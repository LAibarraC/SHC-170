import sys
import os

# Añadir el directorio 'Backend' al sys.path para poder importar módulos como 'config' y 'models'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import engine
import models

print("Conectando a MySQL para crear tablas faltantes...")
try:
    # Esto busca cualquier modelo nuevo y lo crea
    models.Base.metadata.create_all(bind=engine)
    print("¡Éxito! Las tablas deberían estar creadas.")
except Exception as e:
    print(f"Ocurrió un error al crear las tablas: {e}")