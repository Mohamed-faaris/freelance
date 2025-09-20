import os
from typing import Dict, Any

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
BASE_URL = "https://production.deepvue.tech/v1"
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# Service configurations
GST_ADVANCED_SERVICE = {
    "id": "gstin-advanced",
    "name": "GSTIN Advanced",
    "category": "Business Compliance",
    "description": "Advanced verification of GSTIN",
    "price": 5.0,
    "endpoint": "verification/gstin-advanced",
    "paramKey": "gstin_number",
}

GST_LITE_SERVICE = {
    "id": "gstin-lite",
    "name": "GSTIN Lite",
    "category": "Business Compliance",
    "description": "Basic verification of GSTIN",
    "price": 2.0,
    "endpoint": "verification/gstin-lite",
    "paramKey": "gstin_number",
}

GST_MINI_SERVICE = {
    "id": "gstin-mini",
    "name": "GSTIN Mini",
    "category": "Business Compliance",
    "description": "Minimal verification of GSTIN",
    "price": 1.0,
    "endpoint": "verification/gstin-mini",
    "paramKey": "gstin_number",
}

BUSINESS_VERIFICATION_SERVICE = {
    "id": "business-verification",
    "name": "Business Verification",
    "category": "Business Compliance",
    "description": "Complete business verification",
    "price": 3.0,
    "endpoint": "verification/business",
    "paramKey": "business_id",
}

# Service registry
SERVICES = {
    "gstin-advanced": GST_ADVANCED_SERVICE,
    "gstin-lite": GST_LITE_SERVICE,
    "gstin-mini": GST_MINI_SERVICE,
    "business-verification": BUSINESS_VERIFICATION_SERVICE,
}

def get_service_config(service_id: str) -> Dict[str, Any]:
    """
    Get service configuration by ID.

    Args:
        service_id: Service identifier

    Returns:
        Service configuration dictionary

    Raises:
        ValueError: If service not found
    """
    if service_id not in SERVICES:
        raise ValueError(f"Service '{service_id}' not found")
    return SERVICES[service_id]

def get_all_services() -> Dict[str, Dict[str, Any]]:
    """
    Get all available services.

    Returns:
        Dictionary of all services
    """
    return SERVICES.copy()

def validate_environment_variables() -> Dict[str, str]:
    """
    Validate required environment variables.

    Returns:
        Dictionary of missing variables
    """
    missing_vars = {}

    if not CLIENT_ID:
        missing_vars["CLIENT_ID"] = "Required for authentication"

    if not CLIENT_SECRET:
        missing_vars["CLIENT_SECRET"] = "Required for authentication"

    if not JWT_SECRET:
        missing_vars["JWT_SECRET"] = "Required for JWT token validation"

    return missing_vars

def get_environment_status() -> Dict[str, Any]:
    """
    Get environment configuration status.

    Returns:
        Dictionary with environment status
    """
    missing_vars = validate_environment_variables()

    return {
        "environment": "production" if os.getenv("ENV", "development") == "production" else "development",
        "analytics_enabled": ENABLE_ANALYTICS_TRACKING,
        "base_url": BASE_URL,
        "missing_variables": missing_vars,
        "configuration_valid": len(missing_vars) == 0
    }