import os
import sys

# Permite ejecutar el script desde cualquier directorio.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import engine
from sqlalchemy import text

print("Iniciando migración de base de datos...")
try:
    with engine.connect() as con:
        # 1. fecha_limite_matriculacion en clases
        res = con.execute(text("SHOW COLUMNS FROM clases LIKE 'fecha_limite_matriculacion'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE clases ADD COLUMN fecha_limite_matriculacion VARCHAR(10) DEFAULT NULL;"))
            print("Columna 'fecha_limite_matriculacion' agregada a 'clases'.")
        else:
            print("La columna 'fecha_limite_matriculacion' ya existe en 'clases'.")
        
        # 2. estado persistente de la matrícula (no reutilizar codigo_acceso)
        res = con.execute(text("SHOW COLUMNS FROM clases LIKE 'activa'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE clases ADD COLUMN activa TINYINT(1) NOT NULL DEFAULT 1;"))
            print("Columna 'activa' agregada a 'clases'.")
        else:
            print("La columna 'activa' ya existe en 'clases'.")

        # 3. fecha_creacion en usuarios
        res = con.execute(text("SHOW COLUMNS FROM usuarios LIKE 'fecha_creacion'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE usuarios ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP;"))
            print("Columna 'fecha_creacion' agregada a 'usuarios'.")
        else:
            print("La columna 'fecha_creacion' ya existe en 'usuarios'.")

        # 3. fecha_creacion en clases
        res = con.execute(text("SHOW COLUMNS FROM clases LIKE 'fecha_creacion'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE clases ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP;"))
            print("Columna 'fecha_creacion' agregada a 'clases'.")
        else:
            print("La columna 'fecha_creacion' ya existe en 'clases'.")

        # 4. fecha_creacion en inscripciones
        res = con.execute(text("SHOW COLUMNS FROM inscripciones LIKE 'fecha_creacion'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE inscripciones ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP;"))
            print("Columna 'fecha_creacion' agregada a 'inscripciones'.")
        else:
            print("La columna 'fecha_creacion' ya existe en 'inscripciones'.")

        # 5. activo en usuarios
        res = con.execute(text("SHOW COLUMNS FROM usuarios LIKE 'activo'"))
        if not res.fetchone():
            con.execute(text("ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;"))
            print("Columna 'activo' agregada a 'usuarios'.")
        else:
            print("La columna 'activo' ya existe en 'usuarios'.")

        print("¡Migración completada con éxito!")

except Exception as e:
    print(f"Error durante la migración: {e}")
    sys.exit(1)

