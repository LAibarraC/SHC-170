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
        
    await db.execute(delete(Inscripcion).filter(Inscripcion.clase_id == clase.id))
    await db.execute(delete(Archivo).filter(Archivo.clase_id == clase.id))
    await db.execute(delete(HistorialCalculo).filter(HistorialCalculo.clase_id == clase.id))
    
    target_folder = os.path.join("excels", "_cursos", str(clase.id))
    if os.path.exists(target_folder):
        try:
            shutil.rmtree(target_folder)
        except Exception as e:
            print(f"Error al eliminar la carpeta física de la clase {clase.id}: {e}")
            
    await db.delete(clase)
    await db.commit()
    
    return {"message": "Curso eliminado exitosamente"}

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
