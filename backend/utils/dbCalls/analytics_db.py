"""
Analytics database operations.

This module contains all database operations related to API analytics and tracking.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId
from config.db import apiAnalyticsCollection


async def get_analytics_total_usage(filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get total usage analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary
        
    Returns:
        List containing aggregated total usage data
    """
    return await apiAnalyticsCollection.aggregate([
        {"$match": filter_dict},
        {
            "$group": {
                "_id": None,
                "totalCalls": {"$sum": 1},
                "totalCost": {"$sum": "$cost"},
                "avgResponseTime": {"$avg": "$responseTime"},
            },
        },
    ]).to_list(length=None)


async def get_analytics_daily_usage(filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get daily usage analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary
        
    Returns:
        List containing daily usage data
    """
    return await apiAnalyticsCollection.aggregate([
        {"$match": filter_dict},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"_id": 1}},
    ]).to_list(length=None)


async def get_analytics_service_breakdown(filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get service breakdown analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary
        
    Returns:
        List containing service breakdown data
    """
    return await apiAnalyticsCollection.aggregate([
        {"$match": filter_dict},
        {
            "$group": {
                "_id": "$service",
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"calls": -1}},
    ]).to_list(length=None)


async def get_analytics_user_usage(filter_dict: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get user usage analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary
        limit: Maximum number of results to return
        
    Returns:
        List containing user usage data
    """
    return await apiAnalyticsCollection.aggregate([
        {"$match": filter_dict},
        {
            "$group": {
                "_id": {"userId": "$userId", "username": "$username"},
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"cost": -1}},
        {"$limit": limit},
    ]).to_list(length=None)


async def get_analytics_profile_type_counts(filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get profile type counts analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary (should include profileType filter)
        
    Returns:
        List containing profile type counts data
    """
    # Ensure profile type filter is included
    profile_filter = {**filter_dict, "profileType": {"$ne": None}}
    
    return await apiAnalyticsCollection.aggregate([
        {"$match": profile_filter},
        {
            "$group": {
                "_id": "$profileType",
                "count": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
    ]).to_list(length=None)


async def get_analytics_top_endpoints(filter_dict: Dict[str, Any], limit: int = 15) -> List[Dict[str, Any]]:
    """
    Get top endpoints analytics with aggregation.
    
    Args:
        filter_dict: MongoDB filter dictionary
        limit: Maximum number of results to return
        
    Returns:
        List containing top endpoints data
    """
    return await apiAnalyticsCollection.aggregate([
        {"$match": filter_dict},
        {
            "$group": {
                "_id": "$endpoint",
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
                "avgResponseTime": {"$avg": "$responseTime"},
            },
        },
        {"$sort": {"calls": -1}},
        {"$limit": limit},
    ]).to_list(length=None)


async def get_analytics_logs_paginated(
    filter_dict: Dict[str, Any], 
    page: int = 1, 
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get analytics logs with pagination.
    
    Args:
        filter_dict: MongoDB filter dictionary
        page: Page number (1-based)
        limit: Number of records per page
        
    Returns:
        List containing paginated log data
    """
    skip = (page - 1) * limit
    logs_cursor = apiAnalyticsCollection.find(filter_dict).sort("createdAt", -1).skip(skip).limit(limit)
    return await logs_cursor.to_list(length=None)


async def count_analytics_logs(filter_dict: Dict[str, Any]) -> int:
    """
    Count analytics logs matching the filter.
    
    Args:
        filter_dict: MongoDB filter dictionary
        
    Returns:
        Total count of matching documents
    """
    return await apiAnalyticsCollection.count_documents(filter_dict)


async def log_api_call(log_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a new API call log entry using the ApiAnalytics model.
    
    Args:
        log_data: Dictionary containing log data
        
    Returns:
        Inserted document with _id
    """
    from models.api_analytics import ApiAnalytics
    
    # Use the model's log method which handles validation and insertion
    return await ApiAnalytics.log_api_call(log_data)


async def create_analytics_entry(
    user_id: str,
    username: str,
    user_role: str,
    service: str,
    endpoint: str,
    cost: float = 0.0,
    response_time: float = 0.0,
    status_code: int = 200,
    profile_type: Optional[str] = None,
    api_version: str = "v1"
) -> Dict[str, Any]:
    """
    Create a new analytics entry with all required fields.
    
    Args:
        user_id: User ID
        username: Username
        user_role: User role
        service: Service name
        endpoint: API endpoint
        cost: API call cost
        response_time: Response time in milliseconds
        status_code: HTTP status code
        profile_type: Profile type if applicable
        api_version: API version
        
    Returns:
        Created analytics document
    """
    log_data = {
        "userId": ObjectId(user_id),
        "username": username,
        "userRole": user_role,
        "service": service,
        "endpoint": endpoint,
        "cost": cost,
        "responseTime": response_time,
        "statusCode": status_code,
        "profileType": profile_type,
        "apiVersion": api_version,
        "createdAt": datetime.now()
    }
    
    return await log_api_call(log_data)


def build_analytics_filter(
    start_date: datetime,
    end_date: datetime,
    user_id: Optional[str] = None,
    service: Optional[str] = None,
    endpoint: Optional[str] = None,
    profile_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build a filter dictionary for analytics queries.
    
    Args:
        start_date: Start date for the filter
        end_date: End date for the filter
        user_id: Optional user ID filter
        service: Optional service filter
        endpoint: Optional endpoint filter
        profile_type: Optional profile type filter
        
    Returns:
        MongoDB filter dictionary
    """
    filter_dict = {
        "createdAt": {"$gte": start_date, "$lte": end_date}
    }
    
    if user_id:
        filter_dict["userId"] = ObjectId(user_id)
    if service:
        filter_dict["service"] = service
    if endpoint:
        filter_dict["endpoint"] = endpoint
    if profile_type:
        filter_dict["profileType"] = profile_type
    
    return filter_dict


def format_analytics_logs_for_response(logs_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format analytics logs for API response.
    
    Args:
        logs_list: List of raw log documents from database
        
    Returns:
        List of formatted log entries
    """
    formatted_logs = []
    for log in logs_list:
        formatted_logs.append({
            "timestamp": log["createdAt"],
            "userId": str(log["userId"]),
            "username": log.get("username", ""),
            "userRole": log.get("userRole", ""),
            "service": log.get("service", ""),
            "endpoint": log.get("endpoint", ""),
            "apiVersion": log.get("apiVersion", "v1"),
            "cost": log.get("cost", 0.0),
            "statusCode": log.get("statusCode", 0),
            "responseTime": log.get("responseTime", 0.0),
            "profileType": log.get("profileType"),
        })
    return formatted_logs