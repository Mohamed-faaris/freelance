from fastapi import APIRouter
from .user.index import userRoute
from .auth import authRouter
from .news import newsRoute
from .states import statesRoute
from .court_cases import courtCasesRouter
from .search import searchRouter
from .analytics import analyticsRouter
from .verification_advanced import verificationRouter
from .verification_lite import verificationLiteRouter
from .verification_mini import verificationMiniRouter
from .verification_business import router as verificationBusinessRouter
from .fssai_verification import router as fssaiVerificationRouter
from .insta_financials import router as instaFinancialsRouter
from .pdf_generation import pdfRouter
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

# Include search routes
mainRouter.include_router(searchRouter, prefix="/search", tags=["search"])

# Include analytics routes
mainRouter.include_router(analyticsRouter, prefix="/analytics", tags=["analytics"])

# Include verification routes
mainRouter.include_router(verificationRouter, prefix="", tags=["verification"])

# Include lite verification routes
mainRouter.include_router(verificationLiteRouter, prefix="", tags=["verification-lite"])

# Include mini verification routes
mainRouter.include_router(verificationMiniRouter, prefix="", tags=["verification-mini"])

# Include business verification routes
mainRouter.include_router(verificationBusinessRouter, prefix="", tags=["verification-business"])

# Include FSSAI verification routes
mainRouter.include_router(fssaiVerificationRouter, prefix="/fssai-verification", tags=["fssai-verification"])

# Include InstaFinancials routes
mainRouter.include_router(instaFinancialsRouter, prefix="/insta-financials", tags=["insta-financials"])

# Include PDF generation routes
mainRouter.include_router(pdfRouter, prefix="/pdf", tags=["pdf-generation"])

# Include other routes here, e.g.:
# mainRouter.include_router(otherRoute, prefix="/other", tags=["other"])

# Export the main router for use in your main FastAPI app
__all__ = ["mainRouter"]