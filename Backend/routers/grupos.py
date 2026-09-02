from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from models import Usuario
from middlewares.auth import get_current_user, require_role

# Importamos los validadores y el controlador
from validators.grupos import NuevaClase, UnirseClase, CambiarClase, AbandonarClase, ActualizarClase
from controllers import grupos as grupos_controller

router = APIRouter()

@router.post("/crear_clase")
async def crear_clase(datos: NuevaClase, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.crear_clase_db(db, datos)

@router.post("/abandonar_clase")
async def abandonar_clase(datos: AbandonarClase, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.abandonar_clase_db(db, datos.clase_id, datos.estudiante_email)

@router.put("/actualizar_clase")
async def actualizar_clase(
    datos: ActualizarClase,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await grupos_controller.actualizar_clase_db(db, datos, current_user)

@router.delete("/clases/{clase_id}/integrantes")
async def resetear_integrantes_clase(
    clase_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Docente", "Administrador"])),
):
    return await grupos_controller.resetear_integrantes_clase_db(db, clase_id, current_user)

@router.post("/unirse_clase")
async def unirse_clase(datos: UnirseClase, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.unirse_clase_db(db, datos)

@router.post("/cambiar_clase")
async def cambiar_clase(datos: CambiarClase, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.cambiar_clase_db(db, datos)

@router.get("/mis_clases/{email}")
async def obtener_clases_docente(email: str, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.obtener_clases_docente_db(db, email)

@router.get("/mis_inscripciones/{email}")
async def obtener_clases_estudiante(email: str, db: AsyncSession = Depends(get_db)):
    return await grupos_controller.obtener_clases_estudiante_db(db, email)

@router.delete("/eliminar_clase/{clase_id}")
async def eliminar_clase(clase_id: int, user_email: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await grupos_controller.eliminar_clase_db(db, clase_id, user_email)

@router.get("/clases/{clase_id}/estudiantes")
async def obtener_estudiantes_clase(clase_id: int, user_email: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await grupos_controller.obtener_estudiantes_clase_db(db, clase_id, user_email)

@router.delete("/clases/{clase_id}/desmatricular/{estudiante_id}")
async def desmatricular_estudiante(clase_id: int, estudiante_id: int, user_email: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await grupos_controller.desmatricular_estudiante_db(db, clase_id, estudiante_id, user_email)

@router.get("/clases/mis-clases")
async def obtener_mis_clases_docente_v2(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return await grupos_controller.obtener_mis_clases_docente_db(db, current_user)

@router.get("/estadisticas-docente")
@router.get("/grupos/estadisticas-docente")
async def obtener_estadisticas_docente(
    clase_id: int = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return await grupos_controller.obtener_estadisticas_docente_db(db, current_user, clase_id)

