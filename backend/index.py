from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.main import mainRouter 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173","http://localhost:8000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mainRouter, prefix="/api")
