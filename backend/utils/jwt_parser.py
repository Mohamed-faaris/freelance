"""
JWT Token Parser for stateless authentication.
Decodes and validates JWT tokens from auth_token cookie.
"""

import jwt
import os
from typing import Dict, Any, Tuple
from datetime import datetime

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def decode_jwt_token(token: str) -> Tuple[Dict[str, Any], str | None]:
    """
    Decode and validate JWT token.

    Args:
        token: JWT token string from cookie

    Returns:
        Tuple of (decoded_payload, error_message)
        - decoded_payload: Dict with userId, sessionId, roleId, permissionBits, iat, exp
        - error_message: None if successful, error description if failed
    """
    if not token:
        return {}, "No token provided"

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded, None
    except jwt.ExpiredSignatureError:
        return {}, "Token has expired"
    except jwt.InvalidTokenError as e:
        return {}, f"Invalid token: {str(e)}"
    except Exception as e:
        return {}, f"Token decode error: {str(e)}"


def extract_jwt_claims(decoded_jwt: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and validate required claims from JWT payload.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        Dict with extracted claims:
        {
            "userId": str,
            "sessionId": str,
            "roleId": str,
            "permissionBits": str,
            "iat": int,
            "exp": int,
            "is_valid": bool
        }
    """
    required_fields = ["userId", "sessionId", "roleId", "permissionBits", "iat", "exp"]
    
    # Check if all required fields are present
    missing_fields = [field for field in required_fields if field not in decoded_jwt]
    
    if missing_fields:
        return {
            "is_valid": False,
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }

    # Validate expiration
    exp_timestamp = decoded_jwt.get("exp")
    if exp_timestamp:
        current_time = datetime.utcnow().timestamp()
        if current_time > exp_timestamp:
            return {
                "is_valid": False,
                "error": "Token has expired"
            }

    return {
        "userId": str(decoded_jwt.get("userId", "")),
        "sessionId": str(decoded_jwt.get("sessionId", "")),
        "roleId": str(decoded_jwt.get("roleId", "")),
        "permissionBits": str(decoded_jwt.get("permissionBits", "0")),
        "iat": int(decoded_jwt.get("iat", 0)),
        "exp": int(decoded_jwt.get("exp", 0)),
        "is_valid": True,
        "error": None
    }


def validate_jwt_from_cookie(token: str) -> Tuple[Dict[str, Any], bool, str | None]:
    """
    Complete JWT validation pipeline.

    Args:
        token: JWT token from auth_token cookie

    Returns:
        Tuple of (payload, is_valid, error_message)
        - payload: Decoded JWT claims if valid, empty dict if invalid
        - is_valid: Boolean indicating if token is valid
        - error_message: None if valid, error description if invalid
    """
    # Step 1: Decode token
    decoded, decode_error = decode_jwt_token(token)
    
    if decode_error:
        return {}, False, decode_error

    # Step 2: Extract and validate claims
    claims = extract_jwt_claims(decoded)
    
    if not claims.get("is_valid"):
        return {}, False, claims.get("error")

    # Return validated payload (without is_valid and error keys)
    return {
        "userId": claims["userId"],
        "sessionId": claims["sessionId"],
        "roleId": claims["roleId"],
        "permissionBits": claims["permissionBits"],
        "iat": claims["iat"],
        "exp": claims["exp"]
    }, True, None
