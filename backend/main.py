
# FastAPI imports
from fastapi import FastAPI
from routes.peopleRouter import router as people_router

# FastAPI app and include people router
app = FastAPI()
app.include_router(people_router)
