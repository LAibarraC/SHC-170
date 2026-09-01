import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# --- Configuración Base ---
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:23luis99@localhost:3306/estadistica_db"
)

connect_args = {}
if "aivencloud" in DATABASE_URL:
    connect_args = {
        "ssl": {
            "ca": "ca.pem"
        }
    }

# --- Motor Síncrono (Para scripts administrativos) ---
SYNC_DATABASE_URL = DATABASE_URL
if SYNC_DATABASE_URL.startswith("mysql://"):
    SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

engine = create_engine(
    SYNC_DATABASE_URL, 
    pool_pre_ping=True, 
    pool_recycle=3600,
    connect_args=connect_args
)

SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Motor Asíncrono (Para FastAPI) ---
ASYNC_DATABASE_URL = DATABASE_URL
if ASYNC_DATABASE_URL.startswith("mysql://"):
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace("mysql://", "mysql+asyncmy://", 1)
elif ASYNC_DATABASE_URL.startswith("mysql+pymysql://"):
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace("mysql+pymysql://", "mysql+asyncmy://", 1)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=False, # <-- Desactivado: asyncmy no soporta ping() sin argumento 'reconnect'
    pool_recycle=3600,
    connect_args=connect_args
)

AsyncSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=async_engine,
    class_=AsyncSession
)

Base = declarative_base()

# Dependencia Asíncrona para FastAPI
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception:
            await db.rollback()
            raise