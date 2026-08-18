from fastapi import APIRouter, File, UploadFile, Form, Query, Depends
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from middlewares.quota import verificar_cuota_almacenamiento # <-- ADD THIS
from middlewares.auth import get_current_user

from validators.archivos import (
    SaveTableHojasRequest,
    SaveTableRequest,
    UpdateExcelRequest,
    AddEditSheetRequest
)

from controllers.archivos import (
    upload_file_logic,
    list_files_logic,
    view_excel_logic,
    get_sheets_logic,
    get_download_file_path,
    delete_file_logic,
    save_table_hojas_logic,
    create_table_logic,
    save_table_logic,
    update_excel_logic,
    add_edit_sheet_logic
)

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    autor: str = Form(...),
    visibilidad: str = Form("personal"), 
    curso: str = Form(None),
    db: AsyncSession = Depends(get_db),
    espacio_usado: int = Depends(verificar_cuota_almacenamiento) # <-- ENFORCE QUOTA HERE
):
    resultado = await upload_file_logic(file, autor, visibilidad, curso, db)
    if "error" in resultado:
        return JSONResponse(status_code=404 if resultado["error"] == "Clase no encontrada" else 400, content=resultado)
    return resultado

@router.get("/files")
async def list_files(
    autor: str = Query(None), 
    visibilidad: str = Query("personal"), 
    curso: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await list_files_logic(autor, visibilidad, curso, db)

@router.get("/view/{filename}")
async def view_excel(
    filename: str, 
    hoja: int = 0, 
    autor: str = Query(None), 
    curso: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    resultado = await view_excel_logic(filename, hoja, autor, curso, db)
    if isinstance(resultado, dict) and "error" in resultado:
        return JSONResponse(status_code=400, content=resultado)
    return JSONResponse(content=resultado)

@router.get("/sheets/{filename}")
async def get_sheets(
    filename: str, 
    autor: str = Query(None), 
    curso: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await get_sheets_logic(filename, autor, curso, db)

@router.get("/files/{filename}")
async def download_file(
    filename: str, 
    autor: str = Query(None), 
    curso: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    file_path = await get_download_file_path(filename, autor, curso, db)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.delete("/files/{filename}")
async def delete_file(
    filename: str, 
    autor: str = Query(...), 
    curso: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await delete_file_logic(filename, autor, curso, db)

@router.post("/save_table_hojas")
async def save_table_hojas(
    body: SaveTableHojasRequest, 
    db: AsyncSession = Depends(get_db),
    espacio_usado: int = Depends(verificar_cuota_almacenamiento) 
):
    return await save_table_hojas_logic(body, db)

@router.post("/create_table")
async def create_table(
    nombre: str = Query(None), 
    num_columnas: int = 1, 
    num_filas: int = 1, 
    autor: str = Query(None),
    db: AsyncSession = Depends(get_db),
    espacio_usado: int = Depends(verificar_cuota_almacenamiento) 
):
    return await create_table_logic(nombre, num_columnas, num_filas, autor, db)

@router.post("/save_table")
async def save_table(
    body: SaveTableRequest, 
    db: AsyncSession = Depends(get_db),
    espacio_usado: int = Depends(verificar_cuota_almacenamiento) 
):
    return await save_table_logic(body, db)

@router.post("/update_excel")
async def update_excel(
    body: UpdateExcelRequest, 
    db: AsyncSession = Depends(get_db),
):
    return await update_excel_logic(body, db)

@router.post("/add_edit_sheet")
async def add_edit_sheet(
    body: AddEditSheetRequest, 
    db: AsyncSession = Depends(get_db),
):
    return await add_edit_sheet_logic(body, db)
    
@router.get("/espacio-usado")
async def obtener_espacio(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user) 
):
    from sqlalchemy import func
    from models.archivo import Archivo
    from sqlalchemy.future import select
    
    result = await db.execute(
        select(func.sum(Archivo.size_bytes)).filter(Archivo.usuario_id == current_user.id)
    )
    espacio_usado = result.scalar() or 0
    return {"usado_bytes": espacio_usado, "limite_bytes": 10 * 1024 * 1024}