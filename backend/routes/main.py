from fastapi import APIRouter
from .user import userRoute
from .auth import authRouter
# Import other route modules here as you add them, e.g.:
# from .other_route import otherRoute

mainRouter = APIRouter()

# Include user routes with a prefix and tags for organization
mainRouter.include_router(userRoute, prefix="/users", tags=["users"])

# Include auth routes
mainRouter.include_router(authRouter, prefix="/auth", tags=["auth"])

# Include other routes here, e.g.:
# mainRouter.include_router(otherRoute, prefix="/other", tags=["other"])

# Export the main router for use in your main FastAPI app
__all__ = ["mainRouter"]