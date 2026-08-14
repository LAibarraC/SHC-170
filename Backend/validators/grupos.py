from pydantic import BaseModel
from typing import Optional

class NuevaClase(BaseModel):
    nombre: str
    docente_email: str 
    fecha_limite_matriculacion: Optional[str] = None

class UnirseClase(BaseModel):
    codigo_acceso: str
    estudiante_email: str

class AbandonarClase(BaseModel):
    clase_id: int
    estudiante_email: str

class ActualizarClase(BaseModel):
    id: int
    nombre: str
    fecha_limite_matriculacion: Optional[str] = None
    resetear_codigo: Optional[bool] = False
