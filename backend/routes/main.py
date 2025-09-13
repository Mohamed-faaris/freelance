from fastapi import APIRouter
from .user.index import userRoute
from .auth import authRouter
from .news import newsRoute
from .states import statesRoute
from .court_cases import courtCasesRouter
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

# Include states routes
mainRouter.include_router(statesRoute, prefix="/states", tags=["states"])

# Include court cases routes
mainRouter.include_router(courtCasesRouter, prefix="/court-cases", tags=["court-cases"])

# Include other routes here, e.g.:
# mainRouter.include_router(otherRoute, prefix="/other", tags=["other"])

# Export the main router for use in your main FastAPI app
__all__ = ["mainRouter"]