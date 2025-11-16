import os
import sys

# Load environment variables FIRST before any other imports
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

# Now import FastAPI and routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.main import mainRouter

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8000",
        "http://localhost:3000",
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mainRouter, prefix="/api")

# Database connection management
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup."""
    from config.db import init_db
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool on shutdown."""
    from config.db import close_db
    await close_db()
