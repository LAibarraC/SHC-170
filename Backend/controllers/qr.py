import logging
import os
import secrets
import traceback
from datetime import datetime, time, timezone
from typing import Optional

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import models
from models import Clase, ClaseQR, Inscripcion, Notificacion, Usuario

from validators.qr import (
    GenerarQRRequest,
    MatricularPorQRRequest,
)

logger = logging.getLogger("qr")


# ────────────────────────────────────────────────────────────
# Configuración
# ────────────────────────────────────────────────────────────

# DEFAULT_DURATION_MINUTES = 30
# FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

FRONTEND_URL = os.getenv("FRONTEND_URL")

def _now_utc() -> datetime:
    """Devuelve el momento actual en UTC, naive para MySQL DateTime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _limite_clase(fecha_limite: Optional[str]) -> Optional[datetime]:
    """Convierte la fecha límite de la clase en el final de ese día."""
    if not fecha_limite:
        return None
    try:
        return datetime.combine(
            datetime.strptime(fecha_limite, "%Y-%m-%d").date(),
            time.max,
        )
    except ValueError:
        return None


def _matricula_cerrada(clase: Clase, ahora: datetime) -> bool:
    """La matrícula se cierra sin depender de la tabla histórica de QR."""
    limite = _limite_clase(clase.fecha_limite_matriculacion)
    return clase.codigo_acceso is None or (limite is not None and limite <= ahora)


def _build_url(token: str) -> str:
    """Construye la URL de matriculación. Usa HashRouter (#) del frontend."""
    base = FRONTEND_URL.rstrip("/")
    return f"{base}/#/matricular/{token}"


def _format_dt(value: Optional[datetime]) -> Optional[str]:
    if not value:
        return None
    return value.strftime("%Y-%m-%d %H:%M:%S")


async def _contar_inscripciones(db: AsyncSession, clase_id: int) -> int:
    result = await db.execute(
        select(func.count(Inscripcion.id)).filter(Inscripcion.clase_id == clase_id)
    )
    return int(result.scalar() or 0)


# ────────────────────────────────────────────────────────────
# Generar QR
# ────────────────────────────────────────────────────────────

async def generar_qr_db(db: AsyncSession, req: GenerarQRRequest, current_user: Usuario):
    """Crea un nuevo QR para la clase indicada.

    Reglas:
      - El usuario autenticado debe ser Docente o Administrador.
      - Si es Docente, debe ser el dueño de la clase.
      - La clase debe existir.
    """
    if current_user.rol not in ("Docente", "Administrador"):
        return JSONResponse(
            status_code=403,
            content={"error": "No tienes autorización para generar códigos QR."},
        )

    clase = (await db.execute(select(Clase).filter(Clase.id == req.clase_id))).scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "La clase indicada no existe."})

    # Capturar los atributos de clase ANTES de cualquier operación que pueda expirar la sesión
    clase_id = clase.id
    docente_id = clase.docente_id
    clase_nombre = clase.nombre

    if current_user.rol != "Administrador" and docente_id != current_user.id:
        return JSONResponse(
            status_code=403,
            content={"error": "No tienes permisos para generar un QR de esta clase."},
        )

    ahora = _now_utc()
    expiracion = _limite_clase(clase.fecha_limite_matriculacion)
    if _matricula_cerrada(clase, ahora):
        return JSONResponse(
            status_code=400,
            content={"error": "La matrícula está cerrada o la fecha límite ya venció."},
        )
    # La fecha almacenada en el registro QR es solo compatibilidad histórica;
    # la validación siempre consulta la fecha y estado actuales de la clase.
    if expiracion is None:
        expiracion = datetime.max

    # secrets.token_urlsafe(32) -> 43 caracteres url-safe (suficientemente seguro)
    token = secrets.token_urlsafe(32)

    qr = ClaseQR(
        token=token,
        clase_id=clase_id,
        docente_id=docente_id,
        # No pasamos fecha_creacion: que use el default=func.now() de la
        # columna para evitar mismatch de zona horaria entre el datetime
        # naive de Python y el TIMESTAMP de MySQL.
        fecha_expiracion=expiracion,
        activo=True,
    )
    db.add(qr)

    try:
        await db.commit()
    except IntegrityError as e:
        # Caso: choque de unicidad del token (extremadamente improbable con
        # token_urlsafe(32), pero lo manejamos explícitamente).
        await db.rollback()
        logger.error("IntegrityError al generar QR: %s", e)
        return JSONResponse(
            status_code=409,
            content={"error": "No se pudo generar el QR por un conflicto de unicidad. Intenta nuevamente."},
        )
    except Exception as e:
        # Cualquier otro error de SQLAlchemy/Pydantic/driver se loguea con
        # traceback para depurar y devolvemos 500 con mensaje claro.
        await db.rollback()
        logger.error("Error inesperado al generar QR: %s", e)
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error interno al generar el QR.",
                "detalle": str(e),
            },
        )

    try:
        await db.refresh(qr)
    except Exception as e:
        # Si el refresh falla, no abortamos: el QR ya quedó persistido.
        logger.warning("No se pudo refrescar el QR recién creado: %s", e)

    alumnos = await _contar_inscripciones(db, clase_id)

    return {
        "id": qr.id,
        "clase_id": clase_id,
        "clase_nombre": clase_nombre,
        "token": qr.token,
        "url": _build_url(qr.token),
        "fecha_creacion": _format_dt(qr.fecha_creacion),
        "fecha_expiracion": _format_dt(qr.fecha_expiracion),
        "activo": qr.activo,
        "alumnos_inscritos": alumnos,
    }


# ────────────────────────────────────────────────────────────
# Información pública del QR (sin auth)
# ────────────────────────────────────────────────────────────

async def info_qr_db(db: AsyncSession, token: str):
    """Devuelve el estado del QR sin exponer datos sensibles.

    - "inexistente" si el token no existe
    - "desactivado" si el docente lo desactivó manualmente
    - "expirado" si pasó la fecha de expiración
    - "valido" en caso contrario
    """
    if not token:
        return {
            "estado": "inexistente",
            "mensaje": "El código QR no existe.",
        }

    qr = (
        await db.execute(select(ClaseQR).filter(ClaseQR.token == token))
    ).scalars().first()
    if not qr:
        return {
            "estado": "inexistente",
            "mensaje": "El código QR no existe.",
        }

    clase = (
        await db.execute(select(Clase).filter(Clase.id == qr.clase_id))
    ).scalars().first()
    docente = (
        await db.execute(select(Usuario).filter(Usuario.id == qr.docente_id))
    ).scalars().first()
    
    # Capturar los atributos necesarios inmediatamente
    clase_id = clase.id if clase else None
    clase_nombre = clase.nombre if clase else None
    docente_nombre = docente.nombre if docente else None

    ahora = _now_utc()
    limite = _limite_clase(clase.fecha_limite_matriculacion)
    fecha_expiracion = _format_dt(limite)

    if not qr.activo or clase.codigo_acceso is None:
        return {
            "estado": "desactivado",
            "mensaje": "La matrícula fue cerrada por el docente.",
            "clase_id": clase_id,
            "clase_nombre": clase_nombre,
            "docente_nombre": docente_nombre,
            "fecha_expiracion": fecha_expiracion,
            "minutos_restantes": 0,
        }

    if limite is not None and limite <= ahora:
        return {
            "estado": "expirado",
            "mensaje": "La fecha límite de matrícula ya venció.",
            "clase_id": clase_id,
            "clase_nombre": clase_nombre,
            "docente_nombre": docente_nombre,
            "fecha_expiracion": fecha_expiracion,
            "minutos_restantes": 0,
        }

    return {
        "estado": "valido",
        "mensaje": "Código QR válido.",
        "clase_id": clase_id,
        "clase_nombre": clase_nombre,
        "docente_nombre": docente_nombre,
        "fecha_expiracion": fecha_expiracion,
        "minutos_restantes": None,
    }


# ────────────────────────────────────────────────────────────
# Matricular por QR
# ────────────────────────────────────────────────────────────

async def matricular_por_qr_db(
    db: AsyncSession, req: MatricularPorQRRequest, current_user: Usuario
):
    """Registra la inscripción del estudiante autenticado a partir del token del QR.

    Validaciones (todas en backend):
      1. Usuario autenticado (realizado por get_current_user).
      2. Usuario con rol Estudiante.
      3. Token existente.
      4. Token activo.
      5. Token no expirado.
      6. Clase existente.
      7. Estudiante no matriculado previamente.
    """
    if current_user.rol != "Estudiante":
        return JSONResponse(
            status_code=403,
            content={"error": "No tienes autorización para realizar esta matrícula."},
        )

    if not req.token:
        return JSONResponse(
            status_code=400, content={"error": "El token del QR es obligatorio."}
        )

    qr = (
        await db.execute(select(ClaseQR).filter(ClaseQR.token == req.token))
    ).scalars().first()
    if not qr:
        return JSONResponse(
            status_code=404, content={"error": "El código QR no existe."}
        )

    ahora = _now_utc()
    if not qr.activo:
        return JSONResponse(
            status_code=400,
            content={"error": "El código QR fue desactivado por el docente."},
        )
    clase = (
        await db.execute(select(Clase).filter(Clase.id == qr.clase_id))
    ).scalars().first()
    if not clase:
        return JSONResponse(
            status_code=404, content={"error": "La asignatura asociada al QR no existe."}
        )

    # Capturar los atributos de clase ANTES de cualquier operación que pueda expirar la sesión
    clase_id = clase.id
    clase_nombre = clase.nombre
    docente_id = clase.docente_id
    fecha_limite = clase.fecha_limite_matriculacion

    # Misma fuente de verdad que la matrícula mediante código.
    if _matricula_cerrada(clase, ahora):
        return JSONResponse(
            status_code=400,
            content={
                "error": f"El periodo de matriculación para este curso ha finalizado (Fecha límite: {fecha_limite or 'no definida'})."
            },
        )

    # Verificar matrícula duplicada (con la restricción única a nivel de BD
    # también se cubre el caso 14: requests concurrentes).
    inscripcion_existente = (
        await db.execute(
            select(Inscripcion).filter(
                Inscripcion.clase_id == clase_id,
                Inscripcion.estudiante_id == current_user.id,
            )
        )
    ).scalars().first()
    if inscripcion_existente:
        return JSONResponse(
            status_code=409,
            content={"error": "El estudiante ya se encuentra matriculado en esta asignatura."},
        )

    nombre_estudiante = current_user.nombre or current_user.email
    nueva_inscripcion = Inscripcion(clase_id=clase_id, estudiante_id=current_user.id)
    db.add(nueva_inscripcion)

    nueva_notificacion = Notificacion(
        tipo="matriculacion",
        mensaje=(
            f"El estudiante {nombre_estudiante} ({current_user.email}) se ha matriculado "
            f"a tu clase '{clase_nombre}' mediante código QR."
        ),
        usuario_id=docente_id,
        leido=False,
    )
    db.add(nueva_notificacion)

    try:
        await db.commit()
    except IntegrityError:
        # Defensa final ante concurrencia: si dos requests pasaron la
        # validación al mismo tiempo, la UNIQUE constraint impide el duplicado.
        await db.rollback()
        return JSONResponse(
            status_code=409,
            content={"error": "El estudiante ya se encuentra matriculado en esta asignatura."},
        )

    return {
        "success": True,
        "message": "Matrícula registrada correctamente",
        "clase_id": clase_id,
        "clase_nombre": clase_nombre,
    }


# ────────────────────────────────────────────────────────────
# Desactivar QR
# ────────────────────────────────────────────────────────────

async def desactivar_qr_db(db: AsyncSession, qr_id: int, current_user: Usuario):
    """Marca el QR como inactivo. Las matrículas ya realizadas NO se eliminan."""
    if current_user.rol not in ("Docente", "Administrador"):
        return JSONResponse(
            status_code=403,
            content={"error": "No tienes autorización para desactivar códigos QR."},
        )

    qr = (await db.execute(select(ClaseQR).filter(ClaseQR.id == qr_id))).scalars().first()
    if not qr:
        return JSONResponse(status_code=404, content={"error": "QR no encontrado."})

    if current_user.rol != "Administrador" and qr.docente_id != current_user.id:
        return JSONResponse(
            status_code=403,
            content={"error": "No tienes permisos para desactivar este QR."},
        )

    qr.activo = False
    try:
        await db.commit()
        # Refrescar el objeto para evitar MissingGreenlet/DetachedInstance
        # al acceder a sus atributos tras el commit en una AsyncSession.
        await db.refresh(qr)
    except Exception as e:
        await db.rollback()
        logger.error("Error al desactivar QR %s: %s", qr_id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Error al desactivar el QR: {str(e)}",
        )

    return {"message": "QR desactivado correctamente", "id": qr.id, "activo": qr.activo}


# ────────────────────────────────────────────────────────────
# Cerrar matrícula
# ────────────────────────────────────────────────────────────

async def cerrar_matricula_db(db: AsyncSession, clase_id: int, current_user: Usuario):
    if current_user.rol not in ("Docente", "Administrador"):
        return JSONResponse(status_code=403, content={"error": "No tienes autorización."})
    clase = (await db.execute(select(Clase).filter(Clase.id == clase_id))).scalars().first()
    if not clase:
        return JSONResponse(status_code=404, content={"error": "Clase no encontrada."})
    if current_user.rol != "Administrador" and clase.docente_id != current_user.id:
        return JSONResponse(status_code=403, content={"error": "No tienes permisos sobre esta clase."})
    clase.codigo_acceso = None
    # El estado persistente de la matrícula es la ausencia del código de acceso.
    # Los QRs históricos se conservan para poder gestionarlos al reabrirla.
    try:
        await db.commit()
        await db.refresh(clase)
    except Exception as e:
        await db.rollback()
        logger.error("Error al cerrar matrícula de la clase %s: %s", clase_id, e)
        raise HTTPException(status_code=500, detail="No se pudo guardar el cierre de la matrícula.")

    return {
        "message": "Matrícula cerrada correctamente.",
        "id": clase.id,
        "codigo_acceso": clase.codigo_acceso,
        "cerrada": clase.codigo_acceso is None,
    }


# ────────────────────────────────────────────────────────────
# Listar QRs del docente
# ────────────────────────────────────────────────────────────

async def listar_qrs_docente_db(db: AsyncSession, current_user: Usuario):
    """Devuelve los QRs del docente autenticado (o todos si es Administrador)."""
    if current_user.rol == "Administrador":
        qrs = (await db.execute(select(ClaseQR))).scalars().all()
    else:
        qrs = (
            await db.execute(select(ClaseQR).filter(ClaseQR.docente_id == current_user.id))
        ).scalars().all()

    items = []
    for qr in qrs:
        clase = (
            await db.execute(select(Clase).filter(Clase.id == qr.clase_id))
        ).scalars().first()
        # Capturar el nombre de la clase inmediatamente
        clase_nombre = clase.nombre if clase else "(clase eliminada)"
        alumnos = await _contar_inscripciones(db, qr.clase_id)
        items.append(
            {
                "id": qr.id,
                "clase_id": qr.clase_id,
                "clase_nombre": clase_nombre,
                "token": qr.token,
                "url": _build_url(qr.token),
                "fecha_creacion": _format_dt(qr.fecha_creacion),
                "fecha_expiracion": _format_dt(_limite_clase(clase.fecha_limite_matriculacion)),
                "activo": qr.activo and clase.codigo_acceso is not None,
                "alumnos_inscritos": alumnos,
            }
        )
    return items
