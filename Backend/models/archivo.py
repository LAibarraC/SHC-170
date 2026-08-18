from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.sql import func
from config.database import Base


# --- 🆕 NUEVAS TABLAS: ARCHIVOS HISTORIAL DE CÁLCULOS ---

class Archivo(Base):
    """
    Registra los metadatos de los archivos Excel subidos al sistema.
    El archivo físico se guarda en una carpeta del servidor, y aquí guardamos la ruta.
    """
    __tablename__ = "archivos"

    id = Column(Integer, primary_key=True, index=True)
    nombre_original = Column(String(255), nullable=False)  # Ej: datos_ventas.xlsx
    ruta_servidor = Column(String(550), nullable=False)    # Ej: uploads/clase_1/datos_ventas.xlsx
    fecha_subida = Column(DateTime, default=func.now())
    size_bytes = Column(Integer, default=0)                # Guardará el peso en bytes
    
    # Relaciones obligatorias
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=True)  # A qué clase pertenece
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Quién lo subió (Docente/Admin)
