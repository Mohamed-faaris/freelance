import os
import asyncpg
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# PostgreSQL connection configuration
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
if not DATABASE_URL:
    # Fallback to individual environment variables
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    database = os.getenv("DB_NAME", "myapp")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{database}"

print(f"Connecting to PostgreSQL at {DATABASE_URL}")

# Global connection pool
_pool: Optional[asyncpg.Pool] = None

async def init_db():
    """Initialize the database connection pool."""
    global _pool
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(DATABASE_URL)
            print("Successfully connected to PostgreSQL!")
            
            # Create tables if they don't exist
            await create_tables()
            
        except Exception as e:
            print(f"Error connecting to PostgreSQL: {e}")
            raise

async def get_db_pool() -> asyncpg.Pool:
    """Get the database connection pool."""
    global _pool
    if _pool is None:
        await init_db()
    return _pool

async def close_db():
    """Close the database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def create_tables():
    """Create database tables if they don't exist."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Create users table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                permissions JSONB DEFAULT '[]',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        ''')
        
        # Create api_analytics table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS api_analytics (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                username VARCHAR(255),
                service VARCHAR(255),
                endpoint VARCHAR(255),
                method VARCHAR(10),
                status_code INTEGER,
                response_time FLOAT,
                cost DECIMAL(10, 4) DEFAULT 0,
                ip_address INET,
                user_agent TEXT,
                request_data JSONB,
                response_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        ''')
        
        # Create indexes for better performance
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON api_analytics(user_id)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON api_analytics(created_at)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_analytics_service ON api_analytics(service)')
        
        print("Database tables created successfully!")