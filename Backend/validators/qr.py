from pydantic import BaseModel
from typing import Optional


class GenerarQRRequest(BaseModel):
    """Body para POST /api/qr/generar"""
    clase_id: int


class GenerarQRResponse(BaseModel):
    id: int
    clase_id: int
    clase_nombre: str
    token: str
    url: str
    fecha_creacion: str
    fecha_expiracion: str
    activo: bool
    alumnos_inscritos: int


class QRInfoResponse(BaseModel):
    """Respuesta pública de GET /api/qr/info/{token}"""
    estado: str  # "valido" | "expirado" | "desactivado" | "inexistente"
    mensaje: str
    clase_id: Optional[int] = None
    clase_nombre: Optional[str] = None
    docente_nombre: Optional[str] = None
    fecha_expiracion: Optional[str] = None
    minutos_restantes: Optional[int] = None


class MatricularPorQRRequest(BaseModel):
    """Body para POST /api/qr/matricular"""
    token: str


class MatricularPorQRResponse(BaseModel):
    success: bool
    message: str
    clase_id: Optional[int] = None
    clase_nombre: Optional[str] = None


class QRDocenteItem(BaseModel):
    id: int
    clase_id: int
    clase_nombre: str
    token: str
    url: str
    fecha_creacion: str
    fecha_expiracion: str
    activo: bool
    alumnos_inscritos: int
