"""
Common database utility functions.

This module contains commonly used database operations and utilities
that are shared across multiple modules.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId


def parse_date_with_fallback(date_str: Optional[str], fallback_days: int = 30) -> datetime:
    """
    Parse ISO date string with fallback to relative date.
    
    Args:
        date_str: ISO date string (can be None)
        fallback_days: Number of days to subtract from now if date_str is None
        
    Returns:
        Parsed datetime object
    """
    if date_str:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    else:
        return datetime.now() - timedelta(days=fallback_days)


def format_end_date(date: datetime) -> datetime:
    """
    Format end date to end of day (23:59:59.999999).
    
    Args:
        date: Date to format
        
    Returns:
        Date with time set to end of day
    """
    return date.replace(hour=23, minute=59, second=59, microsecond=999999)


def serialize_object_ids(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert ObjectId fields to strings for JSON serialization.
    
    Args:
        data: Dictionary that may contain ObjectId values
        
    Returns:
        Dictionary with ObjectId values converted to strings
    """
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = serialize_object_ids(value)
            elif isinstance(value, list):
                result[key] = [serialize_object_ids(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
            else:
                result[key] = value
        return result
    return data


def calculate_pagination_info(total_count: int, page: int, limit: int) -> Dict[str, int]:
    """
    Calculate pagination information.
    
    Args:
        total_count: Total number of items
        page: Current page number (1-based)
        limit: Items per page
        
    Returns:
        Dictionary with pagination info
    """
    total_pages = (total_count + limit - 1) // limit  # Ceiling division
    return {
        "page": page,
        "limit": limit,
        "totalCount": total_count,
        "totalPages": total_pages,
    }


def validate_object_id(id_str: str) -> bool:
    """
    Validate if a string is a valid MongoDB ObjectId.
    
    Args:
        id_str: String to validate
        
    Returns:
        True if valid ObjectId, False otherwise
    """
    try:
        ObjectId(id_str)
        return True
    except Exception:
        return False