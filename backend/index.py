from fastapi import FastAPI
from routes.user import userRoute 
app = FastAPI()
app.include_router(userRoute)
