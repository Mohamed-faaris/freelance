"""
Permission bits checker for JWT-based authorization.
Uses bit flags from JWT permissionBits claim.
"""

from typing import Dict, Any

# Permission Bit Definitions
PERMISSION_READ = 1      # 0x001
PERMISSION_WRITE = 2     # 0x002
PERMISSION_DELETE = 4    # 0x004
PERMISSION_ADMIN = 8     # 0x008
PERMISSION_SUPER_ADMIN = 16  # 0x010

# Combined permissions for convenience
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
