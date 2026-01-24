import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Detect Railway environment and ensure data directory exists for persistence
DATA_DIR = "/app/data"
if not os.path.exists(DATA_DIR) and os.access("/app", os.W_OK):
    try:
        os.makedirs(DATA_DIR)
    except:
        DATA_DIR = "."
else:
    DATA_DIR = "."

DEFAULT_DB = f"sqlite+aiosqlite:///{DATA_DIR}/atlas.db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB)

engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with SessionLocal() as session:
        yield session
