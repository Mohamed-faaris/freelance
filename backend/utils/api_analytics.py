from models.api_analytics import ApiAnalytics
from typing import Dict, Any

def log_api_call(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Log an API call to the analytics collection.

    Args:
        data: Dictionary containing API call details

    Returns:
        The inserted document
    """
    return ApiAnalytics.log_api_call(data)