import jwt
import os
from fastapi import HTTPException, Request
from typing import Optional, Dict, Any
from bson import ObjectId
from utils.dbCalls.user_db import find_user_by_id

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

def authenticate_request(request: Request) -> Optional[Dict[str, Any]]:
    """
    Authenticate a request by decoding JWT token from cookies.

    Args:
        request: FastAPI request object

    Returns:
        Decoded JWT payload or None if authentication fails
    """
    token = request.cookies.get("auth_token")
    if not token:
        return None

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

async def get_authenticated_user(request: Request) -> Dict[str, Any]:
    """
    Get authenticated user details from request.

    Args:
        request: FastAPI request object

    Returns:
        User document from database

    Raises:
        HTTPException: If user is not authenticated or not found
    """
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_doc = await find_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    return user_doc

def validate_user_permissions(user_doc: Dict[str, Any], required_permissions: list = None) -> bool:
    """
    Validate if user has required permissions.

    Args:
        user_doc: User document from database
        required_permissions: List of required permissions

    Returns:
        True if user has permissions, False otherwise
    """
    if not required_permissions:
        return True

    user_permissions = user_doc.get("permissions", [])
    user_role = user_doc.get("role", "user")

    # Admin and superadmin have all permissions
    if user_role in ["admin", "superadmin"]:
        return True

    # Check specific permissions
    for perm in user_permissions:
        if perm.get("resource") in required_permissions:
            return True

    return False