from fastapi import APIRouter

userRoute = APIRouter()

# User management endpoints have been removed.
# User data is now managed through the external auth server.
# This app operates in stateless mode using JWT tokens only.
