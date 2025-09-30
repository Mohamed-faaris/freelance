import os
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.engine.url import make_url
from sqlalchemy import text
from dotenv import load_dotenv
from typing import AsyncGenerator, Optional

# Load environment variables
load_dotenv()


def get_env(name: str, default: Optional[str] = None, *, required: bool = False) -> Optional[str]:
    """Fetch environment variable with whitespace trimming and optional requirement."""
    value = os.getenv(name)
    if value is not None:
        value = value.strip()
        if value:
            return value
    if default is not None:
        return default
    if required:
        raise ValueError(f"{name} environment variable is required")
    return value


# Database configuration prioritizes .env values
DATABASE_URL = get_env("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not set, using individual DB_* variables")
    DB_HOST = get_env("DB_HOST", "localhost")
    DB_PORT = get_env("DB_PORT", "5432")
    DB_NAME = get_env("DB_NAME", "mydb")
    DB_USER = get_env("DB_USER", "postgres")
    DB_PASSWORD = get_env("DB_PASSWORD", "password")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Ensure async driver is used
url = make_url(DATABASE_URL)
if url.drivername == "postgresql":
    url = url.set(drivername="postgresql+asyncpg")
ASYNC_DATABASE_URL = str(url)

print(f"Connecting to PostgreSQL at {url.host}:{url.port or 5432}/{url.database}")

# Create async engine and session factory
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency providing an async SQLAlchemy session."""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db() -> bool:
    """Initialize database tables asynchronously."""
    from models.database_models import Base

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully")
        return True
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        return False

async def test_connection() -> bool:
    """Test PostgreSQL connectivity."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        print("PostgreSQL connection successful!")
        return True
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        return False