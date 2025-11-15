"""
Utility functions for the backend application.

This package contains various utility modules:
- auth: JWT-based authentication utilities (stateless)
- jwt_parser: JWT token parsing and validation
- permissions: Permission bits checking utilities
- api_tracking: API call tracking and analytics
- gstin_verification: GSTIN verification services
- common: Common constants and configurations
- api_analytics: Legacy API analytics functions
"""

from .auth import (
    get_authenticated_user,
)

from .jwt_parser import (
    decode_jwt_token,
    extract_jwt_claims,
    validate_jwt_from_cookie
)

from .permissions import (
    check_permission,
    has_all_permissions,
    get_permission_bits,
    has_admin_access,
    has_read_access,
    has_write_access,
    has_delete_access,
    PERMISSION_READ,
    PERMISSION_WRITE,
    PERMISSION_DELETE,
    PERMISSION_ADMIN,
    PERMISSION_SUPER_ADMIN,
    PERMISSION_READ_WRITE,
    PERMISSION_ALL,
)

from .api_tracking import (
    track_external_api_call,
    get_api_cost,
    is_analytics_enabled,
    _get_profile_type_from_service,
    _format_request_data
)

from .gstin_verification import (
    verify_gstin_advanced,
    verify_gstin_lite,
    verify_gstin_mini,
    validate_gstin_format,
    extract_gstin_info
)

from .common import (
    get_service_config,
    get_all_services,
    validate_environment_variables,
    get_environment_status,
    SERVICES,
    GST_ADVANCED_SERVICE,
    GST_LITE_SERVICE,
    GST_MINI_SERVICE,
    BUSINESS_VERIFICATION_SERVICE
)

from .api_analytics import log_api_call

__all__ = [
    # Auth utilities
    "get_authenticated_user",

    # JWT utilities
    "decode_jwt_token",
    "extract_jwt_claims",
    "validate_jwt_from_cookie",

    # Permission utilities
    "check_permission",
    "has_all_permissions",
    "get_permission_bits",
    "has_admin_access",
    "has_read_access",
    "has_write_access",
    "has_delete_access",
    "PERMISSION_READ",
    "PERMISSION_WRITE",
    "PERMISSION_DELETE",
    "PERMISSION_ADMIN",
    "PERMISSION_SUPER_ADMIN",
    "PERMISSION_READ_WRITE",
    "PERMISSION_ALL",

    # API tracking
    "track_external_api_call",
    "get_api_cost",
    "is_analytics_enabled",
    "_get_profile_type_from_service",
    "_format_request_data",

    # GSTIN verification
    "verify_gstin_advanced",
    "verify_gstin_lite",
    "verify_gstin_mini",
    "validate_gstin_format",
    "extract_gstin_info",

    # Common utilities
    "get_service_config",
    "get_all_services",
    "validate_environment_variables",
    "get_environment_status",
    "SERVICES",
    "GST_ADVANCED_SERVICE",
    "GST_LITE_SERVICE",
    "GST_MINI_SERVICE",
    "BUSINESS_VERIFICATION_SERVICE",

    # Legacy
    "log_api_call"
]