import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.main import mainRouter

app = FastAPI()
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8000",
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
