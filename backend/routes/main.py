from fastapi import APIRouter
from .user.index import userRoute
from .auth import authRouter
from .news import newsRoute
from .states import statesRoute
from .court_cases import court_cases_router
from .search import searchRouter
from .analytics import analyticsRouter
from .verification_advanced import verificationRouter
from .verification_lite import verificationLiteRouter
from .verification_mini import verificationMiniRouter
from .verification_business import router as verificationBusinessRouter
from .fssai_verification import router as fssaiVerificationRouter
from .insta_financials import router as instaFinancialsRouter
from .pdf_generation import pdfRouter
from .pdf_generation_puppeteer import router as puppeteerPdfRouter
from .send_business_email import router as sendBusinessEmailRouter
from .send_profile_email import router as sendProfileEmailRouter
from .send_fssai_email import router as sendFssaiEmailRouter

from .user.permissions import permissionsRoute

authMainRouter = APIRouter()
authMainRouter.include_router(authRouter, prefix="/auth", tags=["auth"])

permissionsMainRouter = APIRouter()
permissionsMainRouter.include_router(permissionsRoute, prefix="/user/permissions", tags=["permissions"])
permissionsMainRouter.include_router(userRoute, prefix="/users", tags=["permissions"])

servicesMainRouter = APIRouter()
servicesMainRouter.include_router(newsRoute, prefix="/news", tags=["news"])
servicesMainRouter.include_router(statesRoute, prefix="/states", tags=["states"])
servicesMainRouter.include_router(court_cases_router, prefix="/court-cases", tags=["court-cases"])
servicesMainRouter.include_router(searchRouter, prefix="/search", tags=["search"])
servicesMainRouter.include_router(analyticsRouter, prefix="/analytics", tags=["analytics"])
servicesMainRouter.include_router(verificationRouter, prefix="", tags=["verification"])
servicesMainRouter.include_router(verificationLiteRouter, prefix="", tags=["verification-lite"])
servicesMainRouter.include_router(verificationMiniRouter, prefix="", tags=["verification-mini"])
servicesMainRouter.include_router(verificationBusinessRouter, prefix="", tags=["verification-business"])
servicesMainRouter.include_router(fssaiVerificationRouter, prefix="/business-verification", tags=["business-verification"])
servicesMainRouter.include_router(instaFinancialsRouter, prefix="/insta-financials", tags=["insta-financials"])
servicesMainRouter.include_router(pdfRouter, prefix="", tags=["pdf-generation"])
servicesMainRouter.include_router(puppeteerPdfRouter, prefix="", tags=["pdf-generation-puppeteer"])
servicesMainRouter.include_router(sendBusinessEmailRouter, prefix="", tags=["send-business-email"])
servicesMainRouter.include_router(sendProfileEmailRouter, prefix="", tags=["send-profile-email"])
servicesMainRouter.include_router(sendFssaiEmailRouter, prefix="/send-fssai-email", tags=["send-fssai-email"])

mainRouter = APIRouter()

# Include user routes with a prefix and tags for organization
# This now includes both user routes and permissions routes (/users/permissions)
mainRouter.include_router(userRoute, prefix="/users", tags=["users"])
mainRouter.include_router(permissionsRoute, prefix="/users/permissions", tags=["permissions"])

# Include auth routes
mainRouter.include_router(authRouter, prefix="/auth", tags=["auth"])

mainRouter.include_router(sendFssaiEmailRouter, prefix="/send-fssai-email", tags=["send-fssai-email"])

# Include news routes
mainRouter.include_router(newsRoute, prefix="/news", tags=["news"])

# Include states routes
mainRouter.include_router(statesRoute, prefix="/states", tags=["states"])

# Include court cases routes
mainRouter.include_router(court_cases_router, prefix="/court-cases", tags=["court-cases"])

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
mainRouter.include_router(pdfRouter, prefix="", tags=["pdf-generation"])

# Include Puppeteer PDF generation routes
mainRouter.include_router(puppeteerPdfRouter, prefix="", tags=["pdf-generation-puppeteer"])

# Include send business email routes
mainRouter.include_router(sendBusinessEmailRouter, prefix="", tags=["send-business-email"])

# Include send profile email routes
mainRouter.include_router(sendProfileEmailRouter, prefix="", tags=["send-profile-email"])

# Export the main router for use in your main FastAPI app
__all__ = ["mainRouter"]