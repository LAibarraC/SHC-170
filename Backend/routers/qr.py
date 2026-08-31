from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
import models
from middlewares.auth import get_current_user, require_role

from controllers import qr as qr_controller
from validators.qr import GenerarQRRequest, MatricularPorQRRequest


router = APIRouter()


@router.post("/api/qr/generar")
async def generar_qr(
    datos: GenerarQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await qr_controller.generar_qr_db(db, datos, current_user)


@router.get("/api/qr/info/{token}")
async def info_qr(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Público: no requiere autenticación para mostrar la información del QR
    al estudiante que aún no ha iniciado sesión."""
    return await qr_controller.info_qr_db(db, token)


@router.post("/api/qr/matricular")
async def matricular_por_qr(
    datos: MatricularPorQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    return await qr_controller.matricular_por_qr_db(db, datos, current_user)


@router.patch("/api/qr/cerrar-matricula/{clase_id}")
@router.post("/api/qr/cerrar-matricula/{clase_id}")
async def cerrar_matricula(
    clase_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await qr_controller.cerrar_matricula_db(db, clase_id, current_user)


@router.post("/api/qr/desactivar/{qr_id}")
async def desactivar_qr(
    qr_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await qr_controller.desactivar_qr_db(db, qr_id, current_user)


@router.get("/api/qr/mis-qrs")
async def listar_mis_qrs(
    db: AsyncSession = Depends(get_db),
    current_user: models.Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await qr_controller.listar_qrs_docente_db(db, current_user)
