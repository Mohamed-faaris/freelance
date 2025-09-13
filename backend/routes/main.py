from fastapi import APIRouter
from .user.index import userRoute
from .auth import authRouter
from .news import newsRoute
# Import other route modules here as you add them, e.g.:
# from .other_route import otherRoute

mainRouter = APIRouter()

# Include user routes with a prefix and tags for organization
# This now includes both user routes and permissions routes (/users/permissions)
mainRouter.include_router(userRoute, prefix="/users", tags=["users"])

# Include auth routes
mainRouter.include_router(authRouter, prefix="/auth", tags=["auth"])

# Include news routes
mainRouter.include_router(newsRoute, prefix="/news", tags=["news"])

# Include other routes here, e.g.:
# mainRouter.include_router(otherRoute, prefix="/other", tags=["other"])

# Export the main router for use in your main FastAPI app
__all__ = ["mainRouter"]