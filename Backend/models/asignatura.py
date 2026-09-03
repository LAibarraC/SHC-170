from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.sql import func
from config.database import Base

# --- TABLAS PARA GESTIÓN DE CLASES ---

class Clase(Base):
    __tablename__ = "clases"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False) # Ej: Estadística MAT151 - Grupo A
    codigo_acceso = Column(String(20), unique=True, index=True) # Código para que el alumno se una
    fecha_limite_matriculacion = Column(String(10), nullable=True) # Formato YYYY-MM-DD
    activa = Column(Boolean, nullable=False, default=True, server_default="1")
    
    # Llave foránea: Vincula esta clase con el ID del docente que la creó
    docente_id = Column(Integer, ForeignKey("usuarios.id")) 
    fecha_creacion = Column(DateTime, default=func.now())