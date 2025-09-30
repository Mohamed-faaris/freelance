import os
from datetime import datetime
from typing import Dict, Any, Callable, Awaitable, Optional
from models.api_analytics import ApiAnalytics

ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# API cost mapping
API_COSTS: Dict[str, float] = {
    "verification/gstin-advanced": 5.0,
    "verification/gstin-lite": 2.0,
    "verification/gstin-mini": 1.0,
    "verification/business": 3.0,
    "verification/pan-plus": 4.0,
    "mobile-intelligence/mobile-to-name": 5.0,
    "mobile-intelligence/mobile-to-network-details": 5.0,
    "mobile-intelligence/mobile-to-digital-age": 8.0,
    "mobile-intelligence/mobile-to-multiple-upi": 3.5,
    "verification/epfo/pan-to-uan": 5.0,
    "verification/pan-kra-status": 2.5,
    "verification/pan-to-fathername": 2.5,
    "verification/epfo/uan-to-employment-history": 5.0,
    "verification/gstinlite": 2.5,
    "verification/gstin-advanced": 5.0,
    "verification/pan-msme-check": 5.0,
    "business-compliance/fssai-verification": 3.0,
    "financial-services/credit-bureau/credit-report": 30.0,
    # Mini verification costs
    "verification/aadhaar": 1.5,
    "verification/panbasic": 2.5,
    "verification/post-driving-license": 2.5,
    "verification/rc-advanced": 4.0,
    "verification/rc-challan-details": 3.5,
    "verification/epfo/aadhaar-to-uan": 5.0,
    "mobile-intelligence/mobile-to-pan": 5.0,
    "mobile-intelligence/mobile-to-dl-details": 1.0,
    "verification/mnrl": 1.0,
    "verification/post-voter-id": 2.5,
    "verification/passport": 2.5,
    "verification/bankaccount": 2.5,
    "verification/upi": 2.5,
    "verification/mca/cin": 5.0,
    "verification/mca/din": 5.0,
    "business-compliance/pan-to-din": 5.0,
    "verification/async/post-udyam-details": 5.0,
    "verification/async/get-udyam-details": 1.0,
    "verification/async/post-udyog-details": 5.0,
    "verification/async/get-udyog-details": 1.0,
    "business-compliance/shop-establishment-certificate": 5.0,
    "default": 1.0,
}

async def track_external_api_call(
    user_id: str,
    username: str,
    user_role: str,
    service: str,
    api_function: Callable[..., Awaitable[Any]],
    *args,
    **kwargs
) -> Any:
    """
    Track external API calls with analytics.

    Args:
        user_id: User ID
        username: Username
        user_role: User role
        service: Service name
        api_function: Async function to call
        *args: Arguments for the API function
        **kwargs: Keyword arguments for the API function

    Returns:
        Result from the API function
    """
    start_time = datetime.now()

    try:
        result = await api_function(*args, **kwargs)
        response_time = (datetime.now() - start_time).total_seconds() * 1000  # Convert to ms
        cost = API_COSTS.get(service, API_COSTS["default"])

        # Log successful API call if analytics tracking is enabled
        if ENABLE_ANALYTICS_TRACKING:
            user_id_value = _normalize_user_id(user_id)
            await ApiAnalytics.log_api_call({
                "userId": user_id_value,
                "username": username,
                "userRole": user_role,
                "service": service,
                "endpoint": service,
                "apiVersion": "v1",
                "cost": cost,
                "statusCode": 200,
                "responseTime": response_time,
                "profileType": _get_profile_type_from_service(service),
                "requestData": _format_request_data(service, args),
                "responseData": result,
                "businessId": None,
            })

        return result

    except Exception as error:
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        # Log failed API call if analytics tracking is enabled
        if ENABLE_ANALYTICS_TRACKING:
            user_id_value = _normalize_user_id(user_id)
            await ApiAnalytics.log_api_call({
                "userId": user_id_value,
                "username": username,
                "userRole": user_role,
                "service": service,
                "endpoint": service,
                "apiVersion": "v1",
                "cost": API_COSTS.get(service, API_COSTS["default"]),
                "statusCode": 500,
                "responseTime": response_time,
                "profileType": _get_profile_type_from_service(service),
                "requestData": _format_request_data(service, args),
                "responseData": {"error": str(error)},
                "businessId": None,
            })

        raise error


def _normalize_user_id(user_id: Any) -> Optional[int]:
    """Convert user ID to integer when possible."""
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None

def _get_profile_type_from_service(service: str) -> str:
    """
    Determine profile type from service name.

    Args:
        service: Service name

    Returns:
        Profile type string
    """
    if "business" in service:
        return "business"
    elif "advanced" in service:
        return "advanced"
    elif "lite" in service:
        return "lite"
    elif "mini" in service:
        return "mini"
    else:
        return "business"  # default

def _format_request_data(service: str, args: tuple) -> Optional[Dict[str, Any]]:
    """
    Format request data based on service type.

    Args:
        service: Service name
        args: Arguments passed to the API function

    Returns:
        Formatted request data dictionary or None
    """
    if not args:
        return None

    # Extract the first argument (usually the main parameter)
    first_arg = args[0]

    # Format based on service type
    if "gstin" in service:
        if isinstance(first_arg, str):
            return {"gstin": first_arg}
        elif isinstance(first_arg, dict):
            return first_arg
    elif "business" in service:
        if isinstance(first_arg, str):
            return {"business_id": first_arg}
        elif isinstance(first_arg, dict):
            return first_arg

    # Default: if it's already a dict, return as-is
    if isinstance(first_arg, dict):
        return first_arg

    # For other types, wrap in a generic request data dict
    return {"data": first_arg}

def get_api_cost(service: str) -> float:
    """
    Get the cost of an API service.

    Args:
        service: Service name

    Returns:
        Cost of the service
    """
    return API_COSTS.get(service, API_COSTS["default"])

def is_analytics_enabled() -> bool:
    """
    Check if analytics tracking is enabled.

    Returns:
        True if analytics is enabled, False otherwise
    """
    return ENABLE_ANALYTICS_TRACKING