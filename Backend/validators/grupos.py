from pydantic import BaseModel
from typing import Optional

class NuevaClase(BaseModel):
    nombre: str
    docente_email: str 
    fecha_limite_matriculacion: Optional[str] = None

class UnirseClase(BaseModel):
    codigo_acceso: str
    estudiante_email: str

class CambiarClase(BaseModel):
    estudiante_id: int
    clase_actual_id: int
    nueva_clase_id: int
    user_email: str

class AbandonarClase(BaseModel):
    clase_id: int
    estudiante_email: str

class ActualizarClase(BaseModel):
    id: int
    nombre: str
    fecha_limite_matriculacion: Optional[str] = None
    resetear_codigo: Optional[bool] = False

class ActualizarFechaClase(BaseModel):
    id: int
    fecha_limite_matriculacion: str

class ActualizarEstadoMatricula(BaseModel):
    activa: bool
