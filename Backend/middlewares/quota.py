# middlewares/quota.py
from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from config.database import get_db 
from middlewares.auth import get_current_user
from models.archivo import Archivo

LIMITE_BYTES = 10 * 1024 * 1024 # 10 MB

async def verificar_cuota_almacenamiento(
    request: Request, 
    db: AsyncSession = Depends(get_db),  # <-- CAMBIO AQUÍ
    current_user = Depends(get_current_user)
):
    content_length = request.headers.get('content-length')
    tamaño_entrante = int(content_length) if content_length else 0
    
    if tamaño_entrante > LIMITE_BYTES:
        raise HTTPException(
            status_code=400, 
            detail="El archivo supera el límite máximo de 10MB."
        )

    # Consulta asíncrona de SQLAlchemy 2.0
    result = await db.execute(
        select(func.sum(Archivo.size_bytes)).filter(Archivo.usuario_id == current_user.id)
    )
    espacio_usado = result.scalar() or 0

    if (espacio_usado + tamaño_entrante) > LIMITE_BYTES:
        raise HTTPException(
            status_code=403, 
            detail=f"Cuota excedida. Tienes {(espacio_usado / (1024*1024)):.2f}MB usados de 10MB."
        )
    
    return espacio_usado