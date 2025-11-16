"""
Permission bits checker for JWT-based authorization.
Uses bit flags from JWT permissionBits claim.

Permission Bit Positions:
- Bit 0: NEWS_VIEW
- Bit 1: BUSINESSVIEW
- Bit 2: FSSAI_VERIFICATION_VIEW
- Bit 3: VERIFICATION_MINI_VIEW
- Bit 4: VERIFICATION_LITE_VIEW
- Bit 5: VERIFICATION_ADVANCED_VIEW
"""

from typing import Dict, Any

# Permission Bit Positions
NEWS_VIEW = 0
BUSINESSVIEW = 1
FSSAI_VERIFICATION_VIEW = 2
VERIFICATION_MINI_VIEW = 3
VERIFICATION_LITE_VIEW = 4
VERIFICATION_ADVANCED_VIEW = 5

# Permission Values (bit shifted)
PERMISSION_NEWS_VIEW = 1 << NEWS_VIEW                           # 1
PERMISSION_BUSINESSVIEW = 1 << BUSINESSVIEW                     # 2
PERMISSION_FSSAI_VERIFICATION_VIEW = 1 << FSSAI_VERIFICATION_VIEW  # 4
PERMISSION_VERIFICATION_MINI_VIEW = 1 << VERIFICATION_MINI_VIEW  # 8
PERMISSION_VERIFICATION_LITE_VIEW = 1 << VERIFICATION_LITE_VIEW  # 16
PERMISSION_VERIFICATION_ADVANCED_VIEW = 1 << VERIFICATION_ADVANCED_VIEW  # 32

# Role Presets
ROLE_USER = 1                  # Only news:view (bit 0)
ROLE_ADMIN = 63                # All 6 permissions (bits 0-5)

# Legacy permissions (for backward compatibility)
PERMISSION_READ = 1
PERMISSION_WRITE = 2
PERMISSION_DELETE = 4
PERMISSION_ADMIN = 8
PERMISSION_SUPER_ADMIN = 16
PERMISSION_READ_WRITE = PERMISSION_READ | PERMISSION_WRITE
PERMISSION_ALL = PERMISSION_READ | PERMISSION_WRITE | PERMISSION_DELETE | PERMISSION_ADMIN


def check_permission(decoded_jwt: Dict[str, Any], required_bits: int) -> bool:
    """
    Check if JWT has required permission bits.

    Args:
        decoded_jwt: Decoded JWT payload from jwt_parser
        required_bits: Bit flags to check (can be OR'd together)

    Returns:
        True if (permissionBits & required_bits) != 0, False otherwise

    Example:
        >>> jwt_payload = {"permissionBits": "15", ...}
        >>> check_permission(jwt_payload, PERMISSION_ADMIN)
        True
    """
    try:
        permission_bits_str = decoded_jwt.get("permissionBits", "0")
        permission_bits = int(permission_bits_str)
        return (permission_bits & required_bits) != 0
    except (ValueError, TypeError):
        return False


def has_all_permissions(decoded_jwt: Dict[str, Any], required_bits: int) -> bool:
    """
    Check if JWT has ALL required permission bits.

    Args:
        decoded_jwt: Decoded JWT payload
        required_bits: All bit flags that must be present

    Returns:
        True if (permissionBits & required_bits) == required_bits, False otherwise

    Example:
        >>> jwt_payload = {"permissionBits": "15", ...}
        >>> has_all_permissions(jwt_payload, PERMISSION_READ | PERMISSION_WRITE)
        True
    """
    try:
        permission_bits_str = decoded_jwt.get("permissionBits", "0")
        permission_bits = int(permission_bits_str)
        return (permission_bits & required_bits) == required_bits
    except (ValueError, TypeError):
        return False


def get_permission_bits(decoded_jwt: Dict[str, Any]) -> int:
    """
    Extract permission bits as integer from JWT payload.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        Integer representation of permission bits, or 0 if invalid

    Example:
        >>> jwt_payload = {"permissionBits": "15", ...}
        >>> get_permission_bits(jwt_payload)
        15
    """
    try:
        permission_bits_str = decoded_jwt.get("permissionBits", "0")
        return int(permission_bits_str)
    except (ValueError, TypeError):
        return 0


def has_admin_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Convenience check for admin or super_admin permissions.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        True if user has ADMIN or SUPER_ADMIN permissions
    """
    return check_permission(decoded_jwt, PERMISSION_ADMIN) or check_permission(
        decoded_jwt, PERMISSION_SUPER_ADMIN
    )


def has_read_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Convenience check for read permissions.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        True if user has READ permission
    """
    return check_permission(decoded_jwt, PERMISSION_READ)


def has_verification_advanced_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Check if user has access to verification-advanced endpoint.
    
    Args:
        decoded_jwt: Decoded JWT payload
    
    Returns:
        True if user has VERIFICATION_ADVANCED_VIEW permission
    """
    try:
        permission_bits = int(decoded_jwt.get("permissionBits", "0"))
        return (permission_bits & PERMISSION_VERIFICATION_ADVANCED_VIEW) != 0
    except (ValueError, TypeError):
        return False


def has_verification_lite_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Check if user has access to verification-lite endpoint.
    
    Args:
        decoded_jwt: Decoded JWT payload
    
    Returns:
        True if user has VERIFICATION_LITE_VIEW permission
    """
    try:
        permission_bits = int(decoded_jwt.get("permissionBits", "0"))
        return (permission_bits & PERMISSION_VERIFICATION_LITE_VIEW) != 0
    except (ValueError, TypeError):
        return False


def has_verification_mini_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Check if user has access to verification-mini endpoint.
    
    Args:
        decoded_jwt: Decoded JWT payload
    
    Returns:
        True if user has VERIFICATION_MINI_VIEW permission
    """
    try:
        permission_bits = int(decoded_jwt.get("permissionBits", "0"))
        return (permission_bits & PERMISSION_VERIFICATION_MINI_VIEW) != 0
    except (ValueError, TypeError):
        return False


def has_fssai_verification_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Check if user has access to FSSAI verification endpoint.
    
    Args:
        decoded_jwt: Decoded JWT payload
    
    Returns:
        True if user has FSSAI_VERIFICATION_VIEW permission
    """
    try:
        permission_bits = int(decoded_jwt.get("permissionBits", "0"))
        return (permission_bits & PERMISSION_FSSAI_VERIFICATION_VIEW) != 0
    except (ValueError, TypeError):
        return False


def has_business_view_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Check if user has access to business view.
    
    Args:
        decoded_jwt: Decoded JWT payload
    
    Returns:
        True if user has BUSINESSVIEW permission
    """
    try:
        permission_bits = int(decoded_jwt.get("permissionBits", "0"))
        return (permission_bits & PERMISSION_BUSINESSVIEW) != 0
    except (ValueError, TypeError):
        return False

def has_write_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Convenience check for write permissions.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        True if user has WRITE permission
    """
    return check_permission(decoded_jwt, PERMISSION_WRITE)


def has_delete_access(decoded_jwt: Dict[str, Any]) -> bool:
    """
    Convenience check for delete permissions.

    Args:
        decoded_jwt: Decoded JWT payload

    Returns:
        True if user has DELETE permission
    """
    return check_permission(decoded_jwt, PERMISSION_DELETE)
