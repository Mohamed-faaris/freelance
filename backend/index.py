from fastapi import FastAPI
from routes.main import mainRouter 
app = FastAPI()

app.include_router(mainRouter, prefix="/api")
