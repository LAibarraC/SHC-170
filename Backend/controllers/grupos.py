import random
import os
import shutil
from datetime import datetime
import string
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, func
from models import Clase, ClaseQR, Inscripcion, Usuario, Archivo, HistorialCalculo, Notificacion
from validators.grupos import NuevaClase, UnirseClase, CambiarClase, ActualizarClase

async def crear_clase_db(db: AsyncSession, datos: NuevaClase):
    result = await db.execute(select(Usuario).filter(Usuario.email == datos.docente_email))
    docente = result.scalars().first()
    if not docente:
        return JSONResponse(status_code=404, content={"error": "Docente no encontrado"})

    prefijo = datos.nombre.replace(" ", "")[:3].upper()
    prefijo = prefijo.ljust(3, 'X')
    
    codigo = f"{prefijo}-{random.randint(1000, 9999)}"

    nueva_clase = Clase(
        nombre=datos.nombre,
        docente_id=docente.id,
        codigo_acceso=codigo,
        fecha_limite_matriculacion=datos.fecha_limite_matriculacion
    )
    db.add(nueva_clase)
    await db.commit()
    await db.refresh(nueva_clase)
    return {"message": "Clase creada exitosamente", "codigo_acceso": codigo}

async def actualizar_clase_db(db: AsyncSession, datos: ActualizarClase, current_user: Usuario):
    if current_user.rol not in ("Docente", "Administrador"):
        return JSONResponse(status_code=403, content={"error": "No tienes autorización para actualizar clases"})

    result = await db.execute(select(Clase).filter(Clase.id == datos.id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})
    if current_user.rol != "Administrador" and clase.docente_id != current_user.id:
        return JSONResponse(status_code=403, content={"error": "No tienes permisos sobre esta clase"})
    
    clase.nombre = datos.nombre
    clase.fecha_limite_matriculacion = datos.fecha_limite_matriculacion
    
    if datos.resetear_codigo:
        caracteres_aleatorios = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        codigo_nuevo = f"MAT-{clase.id}-{caracteres_aleatorios}"
        
        while True:
            res = await db.execute(select(Clase).filter(Clase.codigo_acceso == codigo_nuevo))
            if res.scalars().first() is None:
                break
            caracteres_aleatorios = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            codigo_nuevo = f"MAT-{clase.id}-{caracteres_aleatorios}"
            
        clase.codigo_acceso = codigo_nuevo
        # Un código nuevo invalida los enlaces QR anteriores de la misma clase.
        qrs = (await db.execute(select(ClaseQR).filter(ClaseQR.clase_id == clase.id))).scalars().all()
        for qr in qrs:
            qr.activo = False
        
    await db.commit()
    await db.refresh(clase)
    
    return {
        "message": "Clase actualizada exitosamente",
        "id": clase.id,
        "nombre": clase.nombre,
        "fecha_limite_matriculacion": clase.fecha_limite_matriculacion,
        "codigo_acceso": clase.codigo_acceso
    }

async def resetear_integrantes_clase_db(db: AsyncSession, clase_id: int, current_user: Usuario):
    result = await db.execute(select(Clase).filter(Clase.id == clase_id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})

    if current_user.rol != "Administrador" and clase.docente_id != current_user.id:
        return JSONResponse(status_code=403, content={"error": "No tienes permisos para modificar esta clase"})

    result = await db.execute(
        select(func.count()).select_from(Inscripcion).filter(Inscripcion.clase_id == clase_id)
    )
    total = result.scalar() or 0
    await db.execute(delete(Inscripcion).where(Inscripcion.clase_id == clase_id))
    await db.commit()
    return {"message": "Integrantes eliminados correctamente", "eliminados": total}


async def unirse_clase_db(db: AsyncSession, datos: UnirseClase):
    result = await db.execute(select(Usuario).filter(Usuario.email == datos.estudiante_email))
    estudiante = result.scalars().first()
    if not estudiante:
        return JSONResponse(status_code=404, content={"error": "Estudiante no encontrado"})

    result = await db.execute(select(Clase).filter(Clase.codigo_acceso == datos.codigo_acceso))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Código de clase inválido"})

    if clase.fecha_limite_matriculacion:
        try:
            limite = datetime.strptime(clase.fecha_limite_matriculacion, "%Y-%m-%d").date()
            if datetime.now().date() > limite:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"El periodo de matriculación para este curso ha finalizado (Fecha límite: {clase.fecha_limite_matriculacion})."}
                )
        except ValueError:
            pass
        
    result = await db.execute(select(Inscripcion).filter(
        Inscripcion.clase_id == clase.id,
        Inscripcion.estudiante_id == estudiante.id
    ))
    inscrito = result.scalars().first()
    
    if inscrito:
        return JSONResponse(status_code=409, content={"error": "Ya estás inscrito en esta clase"})

    nombre_clase = clase.nombre
    nombre_estudiante = estudiante.nombre or estudiante.email
    nueva_inscripcion = Inscripcion(clase_id=clase.id, estudiante_id=estudiante.id)
    db.add(nueva_inscripcion)

    nueva_notificacion = Notificacion(
        tipo="matriculacion",
        mensaje=f"El estudiante {nombre_estudiante} ({estudiante.email}) se ha inscrito a tu clase '{nombre_clase}'.",
        usuario_id=clase.docente_id,
        leido=False
    )
    db.add(nueva_notificacion)

    await db.commit()
    return {"message": f"Te has unido a {nombre_clase} exitosamente"}

async def cambiar_clase_db(db: AsyncSession, datos: CambiarClase):
    result = await db.execute(select(Usuario).filter(Usuario.email == datos.user_email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})

    result = await db.execute(select(Usuario).filter(Usuario.id == datos.estudiante_id))
    estudiante = result.scalars().first()
    if not estudiante:
        return JSONResponse(status_code=404, content={"error": "Estudiante no encontrado"})

    result = await db.execute(select(Clase).filter(Clase.id == datos.clase_actual_id))
    clase_actual = result.scalars().first()
    result = await db.execute(select(Clase).filter(Clase.id == datos.nueva_clase_id))
    nueva_clase = result.scalars().first()
    if not clase_actual or not nueva_clase:
        return JSONResponse(status_code=404, content={"error": "Una de las clases no existe"})

    if usuario.rol != "Administrador" and clase_actual.docente_id != usuario.id:
        return JSONResponse(status_code=403, content={"error": "No tienes permisos para modificar esta clase"})

    result = await db.execute(select(Inscripcion).filter(
        Inscripcion.clase_id == datos.clase_actual_id,
        Inscripcion.estudiante_id == datos.estudiante_id
    ))
    inscripcion = result.scalars().first()
    if not inscripcion:
        return JSONResponse(status_code=404, content={"error": "Inscripción actual no encontrada"})

    result = await db.execute(select(Inscripcion).filter(
        Inscripcion.clase_id == datos.nueva_clase_id,
        Inscripcion.estudiante_id == datos.estudiante_id
    ))
    if result.scalars().first():
        return JSONResponse(status_code=409, content={"error": "El estudiante ya está inscrito en la nueva clase"})

    nueva_clase_id = nueva_clase.id
    nueva_clase_nombre = nueva_clase.nombre
    clase_actual_nombre = clase_actual.nombre
    inscripcion.clase_id = datos.nueva_clase_id
    db.add(Notificacion(
        tipo="personal",
        mensaje=f"Has sido cambiado del grupo '{clase_actual_nombre}' al grupo '{nueva_clase_nombre}' por tu docente.",
        usuario_id=estudiante.id,
        leido=False
    ))
    await db.commit()
    return {
        "message": "Estudiante cambiado de clase exitosamente",
        "clase_id": nueva_clase_id,
        "clase_nombre": nueva_clase_nombre
    }

async def obtener_clases_docente_db(db: AsyncSession, email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == email))
    usuario = result.scalars().first()
    if not usuario: return []
    
    if usuario.rol == "Administrador":
        result = await db.execute(select(Clase))
        clases = result.scalars().all()
    else:
        result = await db.execute(select(Clase).filter(Clase.docente_id == usuario.id))
        clases = result.scalars().all()
        
    res_list = []
    for c in clases:
        res = await db.execute(select(Usuario).filter(Usuario.id == c.docente_id))
        docente_creador = res.scalars().first()
        docente_nombre = docente_creador.nombre if docente_creador else "Desconocido"
        docente_email = docente_creador.email if docente_creador else ""
        res_list.append({
            "id": c.id,
            "nombre": c.nombre,
            "codigo": c.codigo_acceso,
            "alumnos": 0,
            "archivos": 0,
            "fecha_limite_matriculacion": c.fecha_limite_matriculacion,
            "docente_nombre": docente_nombre,
            "docente_email": docente_email
        })
    return res_list

async def obtener_clases_estudiante_db(db: AsyncSession, email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == email))
    estudiante = result.scalars().first()
    if not estudiante: return []
    
    result = await db.execute(select(Inscripcion).filter(Inscripcion.estudiante_id == estudiante.id))
    inscripciones = result.scalars().all()
    
    clases_inscritas = []
    for ins in inscripciones:
        res = await db.execute(select(Clase).filter(Clase.id == ins.clase_id))
        clase = res.scalars().first()
        if clase:
            clases_inscritas.append({
                "id": clase.id,
                "nombre": clase.nombre,
                "codigo": clase.codigo_acceso,
                "fecha_limite_matriculacion": clase.fecha_limite_matriculacion
            })
    return clases_inscritas

async def eliminar_clase_db(db: AsyncSession, clase_id: int, user_email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == user_email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
        
    result = await db.execute(select(Clase).filter(Clase.id == clase_id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})
        
    if usuario.rol != "Administrador" and clase.docente_id != usuario.id:
        return JSONResponse(
            status_code=403, 
            content={"error": "No tienes permisos para eliminar este curso. Solo el docente creador o un administrador pueden hacerlo."}
        )
        
    try:
        await db.execute(delete(Inscripcion).filter(Inscripcion.clase_id == clase.id))
        await db.execute(delete(Archivo).filter(Archivo.clase_id == clase.id))
        await db.execute(delete(HistorialCalculo).filter(HistorialCalculo.clase_id == clase.id))
        await db.execute(delete(ClaseQR).filter(ClaseQR.clase_id == clase.id))
        
        target_folder = os.path.join("excels", "_cursos", str(clase.id))
        if os.path.exists(target_folder):
            try:
                shutil.rmtree(target_folder)
            except Exception as e:
                print(f"Error al eliminar la carpeta física de la clase {clase.id}: {e}")
                
        await db.delete(clase)
        await db.commit()
        
        return {"message": "Curso eliminado exitosamente"}
    except Exception as e:
        await db.rollback()
        print(f"Error al eliminar clase {clase_id}: {e}")
        return JSONResponse(status_code=500, content={"error": f"Error interno al eliminar el curso: {str(e)}"})

async def obtener_estudiantes_clase_db(db: AsyncSession, clase_id: int, user_email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == user_email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
        
    result = await db.execute(select(Clase).filter(Clase.id == clase_id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})
        
    if usuario.rol != "Administrador" and clase.docente_id != usuario.id:
        return JSONResponse(
            status_code=403, 
            content={"error": "No tienes permisos para ver los alumnos de esta clase"}
        )
        
    result = await db.execute(select(Inscripcion).filter(Inscripcion.clase_id == clase_id))
    inscripciones = result.scalars().all()
    estudiantes_list = []
    for ins in inscripciones:
        res = await db.execute(select(Usuario).filter(Usuario.id == ins.estudiante_id))
        est = res.scalars().first()
        if est:
            estudiantes_list.append({
                "id": est.id,
                "nombre": est.nombre,
                "email": est.email,
                "fecha_creacion": ins.fecha_creacion.strftime("%Y-%m-%d %H:%M:%S") if ins.fecha_creacion else "N/A"
            })
    return estudiantes_list

async def abandonar_clase_db(db: AsyncSession, clase_id: int, estudiante_email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == estudiante_email))
    estudiante = result.scalars().first()
    if not estudiante:
        return JSONResponse(status_code=404, content={"error": "Estudiante no encontrado"})

    result = await db.execute(select(Clase).filter(Clase.id == clase_id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})

    result = await db.execute(select(Inscripcion).filter(
        Inscripcion.clase_id == clase_id,
        Inscripcion.estudiante_id == estudiante.id
    ))
    inscripcion = result.scalars().first()
    if not inscripcion:
        return JSONResponse(status_code=404, content={"error": "No estás inscrito en esta clase"})

    nombre_clase = clase.nombre
    nombre_estudiante = estudiante.nombre or estudiante.email

    await db.delete(inscripcion)

    result = await db.execute(select(Usuario).filter(Usuario.id == clase.docente_id))
    docente = result.scalars().first()
    if docente:
        nueva_notificacion = Notificacion(
            tipo="desmatriculacion",
            mensaje=f"El estudiante {nombre_estudiante} ({estudiante.email}) ha abandonado la clase '{nombre_clase}'.",
            usuario_id=docente.id,
            leido=False
        )
        db.add(nueva_notificacion)

    await db.commit()
    return {"message": f"Te has desmatriculado de {nombre_clase} exitosamente"}

async def desmatricular_estudiante_db(db: AsyncSession, clase_id: int, estudiante_id: int, user_email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == user_email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
        
    result = await db.execute(select(Clase).filter(Clase.id == clase_id))
    clase = result.scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada"})
        
    if usuario.rol != "Administrador" and clase.docente_id != usuario.id:
        return JSONResponse(
            status_code=403, 
            content={"error": "No tienes permisos para modificar esta clase"}
        )
        
    result = await db.execute(select(Inscripcion).filter(
        Inscripcion.clase_id == clase_id,
        Inscripcion.estudiante_id == estudiante_id
    ))
    inscripcion = result.scalars().first()
    
    if not inscripcion:
        return JSONResponse(status_code=404, content={"error": "Inscripción no encontrada"})
        
    nombre_clase = clase.nombre
    await db.delete(inscripcion)
    db.add(Notificacion(
        tipo="personal",
        mensaje=f"Has sido eliminado del grupo '{nombre_clase}' por tu docente.",
        usuario_id=estudiante_id,
        leido=False
    ))
    await db.commit()
    return {"message": "Estudiante desmatriculado exitosamente"}

async def obtener_mis_clases_docente_db(db: AsyncSession, current_user: Usuario):
    if current_user.rol == "Administrador":
        result = await db.execute(select(Clase))
        clases = result.scalars().all()
    else:
        result = await db.execute(select(Clase).filter(Clase.docente_id == current_user.id))
        clases = result.scalars().all()
        
    res_list = []
    for c in clases:
        res = await db.execute(select(Usuario).filter(Usuario.id == c.docente_id))
        docente_creador = res.scalars().first()
        docente_nombre = docente_creador.nombre if docente_creador else "Desconocido"
        docente_email = docente_creador.email if docente_creador else ""
        
        count_res = await db.execute(select(func.count()).select_from(Inscripcion).filter(Inscripcion.clase_id == c.id))
        alumnos_count = count_res.scalar()
        
        res_list.append({
            "id": c.id,
            "nombre": c.nombre,
            "codigo": c.codigo_acceso,
            "alumnos": alumnos_count,
            "archivos": 0,
            "fecha_limite_matriculacion": c.fecha_limite_matriculacion,
            "docente_nombre": docente_nombre,
            "docente_email": docente_email
        })
    return res_list


async def obtener_estadisticas_docente_db(db: AsyncSession, current_user: Usuario, clase_id: int = None):
    """
    Genera estadísticas y métricas analíticas para el Docente.
    Soporta vista General (todos sus grupos consolidados) o filtrada por un grupo específico.
    """
    try:
        rol_usuario = (current_user.rol or "").capitalize()
        if rol_usuario not in ["Docente", "Administrador"]:
            return JSONResponse(status_code=403, content={"error": "Acceso restringido a docentes y administradores"})

        # 1. Obtener todas las clases a cargo del docente
        if rol_usuario == "Administrador":
            res_clases = await db.execute(select(Clase))
            todas_clases = res_clases.scalars().all()
        else:
            res_clases = await db.execute(select(Clase).filter(Clase.docente_id == current_user.id))
            todas_clases = res_clases.scalars().all()

        clases_disponibles = [
            {"id": c.id, "nombre": c.nombre, "codigo": c.codigo_acceso}
            for c in todas_clases
        ]

        # Determinar qué clases entran en el análisis
        clase_seleccionada_obj = None
        if clase_id is not None and int(clase_id) > 0:
            clases_filtradas = [c for c in todas_clases if c.id == int(clase_id)]
            if not clases_filtradas:
                # Si no estaba en su lista (o admin), buscar directamente en BD
                res_c = await db.execute(select(Clase).filter(Clase.id == int(clase_id)))
                c_encontrada = res_c.scalars().first()
                if c_encontrada and (rol_usuario == "Administrador" or c_encontrada.docente_id == current_user.id):
                    clases_filtradas = [c_encontrada]
                else:
                    return JSONResponse(status_code=404, content={"error": "Clase no encontrada o sin permisos"})

            clase_seleccionada_obj = {
                "id": clases_filtradas[0].id,
                "nombre": clases_filtradas[0].nombre,
                "codigo": clases_filtradas[0].codigo_acceso,
                "fecha_limite": clases_filtradas[0].fecha_limite_matriculacion
            }
        else:
            clases_filtradas = todas_clases

        clases_ids = [c.id for c in clases_filtradas]

        if not clases_ids:
            return {
                "kpis": {
                    "total_clases": 0,
                    "total_alumnos": 0,
                    "alumnos_activos": 0,
                    "alumnos_inactivos": 0,
                    "total_calculos": 0,
                    "promedio_calculos": 0,
                    "total_archivos": 0
                },
                "distribucion_modulos": [],
                "comparativa_grupos": [],
                "evolucion_temporal": [],
                "ranking_estudiantes": [],
                "lista_estudiantes": [],
                "clases_disponibles": clases_disponibles,
                "clase_seleccionada": None
            }

        # 2. Obtener inscripciones de las clases filtradas
        res_insc = await db.execute(
            select(Inscripcion).filter(Inscripcion.clase_id.in_(clases_ids))
        )
        inscripciones = res_insc.scalars().all()

        # Mapeo de estudiantes e inscripciones
        estudiante_ids = list(set([ins.estudiante_id for ins in inscripciones]))

        # Mapa de información de usuarios
        usuarios_map = {}
        if estudiante_ids:
            res_users = await db.execute(
                select(Usuario).filter(Usuario.id.in_(estudiante_ids))
            )
            for u in res_users.scalars().all():
                usuarios_map[u.id] = u

        # Mapa de clases
        clases_map = {c.id: c for c in todas_clases}

        # 3. Obtener Historial de Cálculos
        from sqlalchemy import or_
        condiciones = []
        if estudiante_ids:
            condiciones.append(HistorialCalculo.usuario_id.in_(estudiante_ids))
        if clases_ids:
            condiciones.append(HistorialCalculo.clase_id.in_(clases_ids))

        calculos_list = []
        if condiciones:
            res_calc = await db.execute(
                select(HistorialCalculo).filter(or_(*condiciones))
            )
            calculos_list = res_calc.scalars().all()

        # Conteo de cálculos por estudiante
        calculos_por_estudiante = {}
        for c in calculos_list:
            calculos_por_estudiante[c.usuario_id] = calculos_por_estudiante.get(c.usuario_id, 0) + 1

        # Conteo de cálculos por tipo/módulo
        modulos_counter = {}
        for c in calculos_list:
            tipo = c.tipo_analisis or "Análisis General"
            modulos_counter[tipo] = modulos_counter.get(tipo, 0) + 1

        distribucion_modulos = [
            {"name": k, "cantidad": v}
            for k, v in sorted(modulos_counter.items(), key=lambda x: x[1], reverse=True)
        ]

        # 4. Conteo de archivos de las clases
        res_arch = await db.execute(
            select(func.count()).select_from(Archivo).filter(Archivo.clase_id.in_(clases_ids))
        )
        total_archivos = res_arch.scalar() or 0

        # 5. Lista detallada de estudiantes inscritos (un único registro por alumno consolidando sus materias)
        estudiantes_map_info = {}
        alumnos_activos_set = set()

        for ins in inscripciones:
            est = usuarios_map.get(ins.estudiante_id)
            if not est:
                continue

            c_obj = clases_map.get(ins.clase_id)
            num_calculos = calculos_por_estudiante.get(est.id, 0)
            if num_calculos > 0:
                alumnos_activos_set.add(est.id)

            if est.id not in estudiantes_map_info:
                estudiantes_map_info[est.id] = {
                    "id": est.id,
                    "nombre": est.nombre or "Sin Nombre",
                    "email": est.email,
                    "clases": [],
                    "clase_nombres": [],
                    "calculos_count": num_calculos,
                    "estado_actividad": "Activo" if num_calculos > 0 else "Sin Actividad",
                    "fecha_inscripcion": ins.fecha_creacion.strftime("%Y-%m-%d %H:%M") if ins.fecha_creacion else "N/A",
                    "fecha_inscripcion_dt": ins.fecha_creacion
                }

            if c_obj:
                estudiantes_map_info[est.id]["clases"].append({
                    "id": c_obj.id,
                    "nombre": c_obj.nombre,
                    "codigo": c_obj.codigo_acceso
                })
                estudiantes_map_info[est.id]["clase_nombres"].append(f"{c_obj.nombre} ({c_obj.codigo_acceso})")

            # Mantener la fecha de inscripción más reciente si tiene múltiples
            if ins.fecha_creacion:
                cur_dt = estudiantes_map_info[est.id]["fecha_inscripcion_dt"]
                if cur_dt is None or ins.fecha_creacion > cur_dt:
                    estudiantes_map_info[est.id]["fecha_inscripcion_dt"] = ins.fecha_creacion
                    estudiantes_map_info[est.id]["fecha_inscripcion"] = ins.fecha_creacion.strftime("%Y-%m-%d %H:%M")

        lista_estudiantes = []
        for info in estudiantes_map_info.values():
            clases_list = info["clases"]
            if len(clases_list) == 1:
                clase_nombre = clases_list[0]["nombre"]
                clase_codigo = clases_list[0]["codigo"]
                clase_id_val = clases_list[0]["id"]
            elif len(clases_list) > 1:
                clase_nombre = ", ".join(info["clase_nombres"])
                clase_codigo = ", ".join([c["codigo"] for c in clases_list])
                clase_id_val = None
            else:
                clase_nombre = "Sin grupo"
                clase_codigo = "-"
                clase_id_val = None

            lista_estudiantes.append({
                "id": info["id"],
                "nombre": info["nombre"],
                "email": info["email"],
                "clases": info["clases"],
                "clase_id": clase_id_val,
                "clase_nombre": clase_nombre,
                "clase_codigo": clase_codigo,
                "calculos_count": info["calculos_count"],
                "estado_actividad": info["estado_actividad"],
                "fecha_inscripcion": info["fecha_inscripcion"]
            })

        # Ordenar estudiantes por más cálculos primero
        lista_estudiantes.sort(key=lambda x: x["calculos_count"], reverse=True)

        # Ranking de top estudiantes más participativos
        ranking_estudiantes = [
            {
                "id": est["id"],
                "nombre": est["nombre"],
                "email": est["email"],
                "clase_nombre": est["clase_nombre"],
                "calculos_count": est["calculos_count"]
            }
            for est in lista_estudiantes[:10] if est["calculos_count"] > 0
        ]

        # 6. Comparativa entre todos los grupos del docente
        comparativa_grupos = []
        for c in todas_clases:
            insc_clase = [ins for ins in inscripciones if ins.clase_id == c.id]
            est_clase_ids = [ins.estudiante_id for ins in insc_clase]
            calc_clase = sum(calculos_por_estudiante.get(eid, 0) for eid in est_clase_ids)
            comparativa_grupos.append({
                "id": c.id,
                "nombre": c.nombre,
                "codigo": c.codigo_acceso,
                "alumnos": len(insc_clase),
                "calculos": calc_clase
            })

        # 7. Evolución temporal de inscripciones y cálculos
        meses_nombres = {
            1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
        }
        evolucion_dict = {}

        for ins in inscripciones:
            if ins.fecha_creacion:
                key = (ins.fecha_creacion.year, ins.fecha_creacion.month)
                if key not in evolucion_dict:
                    evolucion_dict[key] = {"inscripciones": 0, "calculos": 0}
                evolucion_dict[key]["inscripciones"] += 1

        for calc in calculos_list:
            if calc.fecha_creacion:
                key = (calc.fecha_creacion.year, calc.fecha_creacion.month)
                if key not in evolucion_dict:
                    evolucion_dict[key] = {"inscripciones": 0, "calculos": 0}
                evolucion_dict[key]["calculos"] += 1

        evolucion_temporal = []
        for (year, month), val in sorted(evolucion_dict.items()):
            evolucion_temporal.append({
                "mes": f"{meses_nombres.get(month, str(month))} {year}",
                "inscripciones": val["inscripciones"],
                "calculos": val["calculos"]
            })

        # 8. Consolidación de KPIs
        total_alumnos = len(lista_estudiantes)
        total_alumnos_activos = len(alumnos_activos_set)
        total_alumnos_inactivos = max(total_alumnos - total_alumnos_activos, 0)
        total_calculos = len(calculos_list)
        promedio_calculos = round(total_calculos / max(total_alumnos, 1), 1)

        return {
            "kpis": {
                "total_clases": len(clases_filtradas),
                "total_alumnos": total_alumnos,
                "alumnos_activos": total_alumnos_activos,
                "alumnos_inactivos": total_alumnos_inactivos,
                "total_calculos": total_calculos,
                "promedio_calculos": promedio_calculos,
                "total_archivos": total_archivos
            },
            "distribucion_modulos": distribucion_modulos,
            "comparativa_grupos": comparativa_grupos,
            "evolucion_temporal": evolucion_temporal,
            "ranking_estudiantes": ranking_estudiantes,
            "lista_estudiantes": lista_estudiantes,
            "clases_disponibles": clases_disponibles,
            "clase_seleccionada": clase_seleccionada_obj
        }
    except Exception as e:
        print(f"Error en obtener_estadisticas_docente_db: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Error interno al calcular estadísticas: {str(e)}"})

