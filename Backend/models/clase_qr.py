from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from config.database import Base


class ClaseQR(Base):
    """
    Registra los códigos QR temporales generados por un docente para
    permitir la matriculación de estudiantes a una clase mediante el
    escaneo de la URL que contiene el token.

    El token es criptográficamente seguro (generado en el backend con
    `secrets.token_urlsafe(32)`) y de un solo uso en el sentido de que
    puede ser reutilizado por varios estudiantes mientras esté activo
    y no haya expirado. La desvinculación entre el token y el
    estudiante se hace al registrar la inscripción en la tabla
    `inscripciones`.
    """
    __tablename__ = "clase_qr"

    id = Column(Integer, primary_key=True, index=True)
    # Identificador público y secreto. Se almacena hasheado en URL.
    token = Column(String(128), nullable=False, unique=True, index=True)
    # Relaciones obligatorias
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=False)
    docente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    # Vigencia
    fecha_creacion = Column(DateTime, default=func.now(), nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
