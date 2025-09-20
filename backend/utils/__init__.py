"""
Utility functions for the backend application.

This package contains various utility modules:
- auth: Authentication and user management utilities
- api_tracking: API call tracking and analytics
- gstin_verification: GSTIN verification services
- common: Common constants and configurations
- api_analytics: Legacy API analytics functions
"""

from .auth import (
    authenticate_request,
    get_authenticated_user,
    validate_user_permissions
)

from .api_tracking import (
    track_external_api_call,
    get_api_cost,
    is_analytics_enabled
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
    "authenticate_request",
    "get_authenticated_user",
    "validate_user_permissions",

    # API tracking
    "track_external_api_call",
    "get_api_cost",
    "is_analytics_enabled",

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