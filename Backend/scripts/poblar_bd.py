from config.database import SyncSessionLocal, engine
from models import Usuario, Base

# ¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA! 
# Crea las tablas en MySQL automáticamente si aún no existen.
Base.metadata.create_all(bind=engine)

# Abrimos la conexión a MySQL
db = SyncSessionLocal()

# Definimos los 3 usuarios que necesitas
usuarios_iniciales = [
    Usuario(
        email="admin@usfx.bo", 
        nombre="Diego (Administrador)", 
        password="123", 
        rol="Administrador", 
        perfil="Administrador", 
        institucion="USFX"
    ),
    Usuario(
        email="jose@usfx.bo", 
        nombre="Jose Veliz", 
        password="123", 
        rol="Docente", 
        perfil="Docente", 
        institucion="USFX"
    ),
    Usuario(
    email="ulises@usfx.bo",
    nombre="Ulises Mancilla",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="jesus@usfx.bo",
    nombre="Jesus Avila",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="diego@usfx.bo",
    nombre="Diego Flores",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="luis@usfx.bo",
    nombre="Luis Vargas",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="carlos@usfx.bo",
    nombre="Carlos Perez",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="miguel@usfx.bo",
    nombre="Miguel Rojas",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="ana@usfx.bo",
    nombre="Ana Lopez",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
Usuario(
    email="maria@usfx.bo",
    nombre="Maria Garcia",
    password="123",
    rol="Estudiante",
    perfil="Estudiante",
    institucion="USFX"
),
]

# Recorremos la lista y los guardamos
for u in usuarios_iniciales:
    existente = db.query(Usuario).filter(Usuario.email == u.email).first()
    if not existente:
        db.add(u)
        print(f"Usuario {u.nombre} agregado.")
    else:
        print(f"El usuario {u.nombre} ya existía.")

db.commit()
print("¡Base de datos actualizada con éxito!")
db.close()