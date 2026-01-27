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
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or DATABASE_URL.strip() == "":
    DATABASE_URL = DEFAULT_DB

# Fix Railway's "postgres://" prefix if present and convert to asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DRIVE_TYPE = "POSTGRESQL" if "postgresql" in DATABASE_URL else "SQLITE"
print(f"📡 DATABASE: {DRIVE_TYPE}")
if DRIVE_TYPE == "SQLITE":
    print(f"⚠️  WARNING: Using non-persistent SQLite at {DATABASE_URL.split('///')[-1]}")
else:
    print(f"✅ Persistent storage active: {DATABASE_URL.split('@')[-1]}")

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
