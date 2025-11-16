from fastapi import APIRouter

permissionsRoute = APIRouter()

# Permission management endpoints have been removed.
# Permissions are now managed through JWT permissionBits from the external auth server.
# This app operates in stateless mode using JWT tokens only.