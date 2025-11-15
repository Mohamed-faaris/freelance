"""
JWT-based authentication utilities.
Provides stateless authentication using JWT tokens from auth_token cookie.
No database lookups needed - authorization is based on permissionBits in JWT.
"""

from fastapi import HTTPException, Request
from typing import Dict, Any
from utils.jwt_parser import validate_jwt_from_cookie


async def get_authenticated_user(request: Request) -> Dict[str, Any]:
    """
    Get JWT payload from auth_token cookie.

    Args:
        request: FastAPI request object

    Returns:
        Decoded JWT payload with userId, sessionId, roleId, permissionBits, iat, exp

    Raises:
        HTTPException(401): If token is missing, invalid, or expired
    """
    token = request.cookies.get("auth_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Validate and decode JWT
    payload, is_valid, error = validate_jwt_from_cookie(token)

    if not is_valid:
        raise HTTPException(status_code=401, detail=error or "Invalid token")

    return payload