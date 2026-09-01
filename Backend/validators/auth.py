from typing import Optional
from pydantic import BaseModel

class UsuarioRegistro(BaseModel):
    nombre: str
    email: str
    password: str
    rol: Optional[str] = "Estudiante"

class UsuarioLogin(BaseModel):
    email: str
    password: str

class RecuperarPassword(BaseModel):
    email: str

class ResetearPassword(BaseModel):
    email: str
    token: str
    nuevo_password: str

class CambiarPasswordPerfil(BaseModel):
    email: str
    password_actual: str
    password_nuevo: str

class VerificarEmailRequest(BaseModel):
    email: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    nueva_contrasena: str

class CambiarRol(BaseModel):
    email: str
    nuevo_rol: str

class CambiarEstado(BaseModel):
    email: str
    activo: bool

class GoogleLoginRequest(BaseModel):
    token: str
