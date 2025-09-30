"""
Analytics database operations.

This module contains all database operations related to API analytics and tracking.
"""

from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
import json
from config.db import get_db_pool


def _build_where_clause(filter_conditions: Dict[str, Any]) -> Tuple[str, List[Any]]:
    """
    Build WHERE clause and values for PostgreSQL queries from filter conditions.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        Tuple of (where_clause_string, values_list)
    """
    if not filter_conditions:
        return "", []
    
    where_clauses = []
    values = []
    param_count = 1
    
    for key, value in filter_conditions.items():
        if key == "created_at" and isinstance(value, dict):
            # Handle date range queries
            if "$gte" in value:
                where_clauses.append(f"created_at >= ${param_count}")
                values.append(value["$gte"])
                param_count += 1
            if "$lte" in value:
                where_clauses.append(f"created_at <= ${param_count}")
                values.append(value["$lte"])
                param_count += 1
        elif key == "user_id":
            where_clauses.append(f"user_id = ${param_count}")
            values.append(value)
            param_count += 1
        elif key in ["service", "endpoint", "username", "method"]:
            where_clauses.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
        elif key == "status_code":
            where_clauses.append(f"status_code = ${param_count}")
            values.append(value)
            param_count += 1
    
    if where_clauses:
        return f"WHERE {' AND '.join(where_clauses)}", values
    return "", []


async def get_analytics_total_usage(filter_conditions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get total usage analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        List containing aggregated total usage data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT 
            COUNT(*) as totalCalls,
            COALESCE(SUM(cost), 0) as totalCost,
            COALESCE(AVG(response_time), 0) as avgResponseTime
        FROM api_analytics
        {where_clause}
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            if row:
                return [dict(row)]
            return [{"totalCalls": 0, "totalCost": 0, "avgResponseTime": 0}]
    except Exception:
        return [{"totalCalls": 0, "totalCost": 0, "avgResponseTime": 0}]


async def get_analytics_daily_usage(filter_conditions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get daily usage analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        List containing daily usage data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT 
            DATE(created_at) as _id,
            COUNT(*) as calls,
            COALESCE(SUM(cost), 0) as cost
        FROM api_analytics
        {where_clause}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values)
            return [dict(row) for row in rows]
    except Exception:
        return []


async def get_analytics_service_breakdown(filter_conditions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get service breakdown analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        List containing service breakdown data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT 
            service as _id,
            COUNT(*) as calls,
            COALESCE(SUM(cost), 0) as cost
        FROM api_analytics
        {where_clause}
        GROUP BY service
        ORDER BY calls DESC
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values)
            return [dict(row) for row in rows]
    except Exception:
        return []


async def get_analytics_user_usage(filter_conditions: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get user usage analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        limit: Maximum number of results to return
        
    Returns:
        List containing user usage data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT 
            user_id,
            username,
            COUNT(*) as calls,
            COALESCE(SUM(cost), 0) as cost
        FROM api_analytics
        {where_clause}
        GROUP BY user_id, username
        ORDER BY cost DESC
        LIMIT ${"" if not values else len(values) + 1}
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values, limit)
            result = []
            for row in rows:
                result.append({
                    "_id": {"userId": row["user_id"], "username": row["username"]},
                    "calls": row["calls"],
                    "cost": row["cost"]
                })
            return result
    except Exception:
        return []


async def get_analytics_profile_type_counts(filter_conditions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get profile type counts analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        List containing profile type counts data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        # Add condition for profile type being not null
        if where_clause:
            where_clause += " AND request_data->>'profileType' IS NOT NULL"
        else:
            where_clause = "WHERE request_data->>'profileType' IS NOT NULL"
        
        query = f"""
        SELECT 
            request_data->>'profileType' as _id,
            COUNT(*) as count,
            COALESCE(SUM(cost), 0) as cost
        FROM api_analytics
        {where_clause}
        GROUP BY request_data->>'profileType'
        ORDER BY count DESC
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values)
            return [dict(row) for row in rows]
    except Exception:
        return []


async def get_analytics_top_endpoints(filter_conditions: Dict[str, Any], limit: int = 15) -> List[Dict[str, Any]]:
    """
    Get top endpoints analytics with aggregation.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        limit: Maximum number of results to return
        
    Returns:
        List containing top endpoints data
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT 
            endpoint as _id,
            COUNT(*) as calls,
            COALESCE(SUM(cost), 0) as cost,
            COALESCE(AVG(response_time), 0) as avgResponseTime
        FROM api_analytics
        {where_clause}
        GROUP BY endpoint
        ORDER BY calls DESC
        LIMIT ${"" if not values else len(values) + 1}
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values, limit)
            return [dict(row) for row in rows]
    except Exception:
        return []


async def get_analytics_logs_paginated(
    filter_conditions: Dict[str, Any], 
    page: int = 1, 
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get analytics logs with pagination.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        page: Page number (1-based)
        limit: Number of records per page
        
    Returns:
        List containing paginated log data
    """
    try:
        offset = (page - 1) * limit
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"""
        SELECT id, user_id, username, service, endpoint, method, status_code, 
               response_time, cost, ip_address, user_agent, request_data, 
               response_data, created_at
        FROM api_analytics
        {where_clause}
        ORDER BY created_at DESC
        LIMIT ${"" if not values else len(values) + 1} OFFSET ${"" if not values else len(values) + 2}
        """
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *values, limit, offset)
            return [dict(row) for row in rows]
    except Exception:
        return []


async def count_analytics_logs(filter_conditions: Dict[str, Any]) -> int:
    """
    Count analytics logs matching the filter.
    
    Args:
        filter_conditions: Dictionary containing filter conditions
        
    Returns:
        Total count of matching documents
    """
    try:
        where_clause, values = _build_where_clause(filter_conditions)
        
        query = f"SELECT COUNT(*) FROM api_analytics {where_clause}"
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            count = await conn.fetchval(query, *values)
            return count or 0
    except Exception:
        return 0


async def log_api_call(log_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a new API call log entry.
    
    Args:
        log_data: Dictionary containing log data
        
    Returns:
        Inserted document with id
    """
    try:
        now = datetime.now()
        
        # Convert dictionaries to JSON strings if they exist
        request_data = log_data.get("request_data") or log_data.get("requestData")
        response_data = log_data.get("response_data") or log_data.get("responseData")
        
        if isinstance(request_data, dict):
            request_data = json.dumps(request_data)
        if isinstance(response_data, dict):
            response_data = json.dumps(response_data)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO api_analytics (
                    user_id, username, service, endpoint, method, status_code,
                    response_time, cost, ip_address, user_agent, request_data,
                    response_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, user_id, username, service, endpoint, method, status_code,
                          response_time, cost, ip_address, user_agent, request_data,
                          response_data, created_at
                """,
                log_data.get("user_id") or log_data.get("userId"),
                log_data.get("username"),
                log_data.get("service"),
                log_data.get("endpoint"),
                log_data.get("method", "GET"),
                log_data.get("status_code") or log_data.get("statusCode", 200),
                log_data.get("response_time") or log_data.get("responseTime", 0.0),
                log_data.get("cost", 0.0),
                log_data.get("ip_address") or log_data.get("ipAddress"),
                log_data.get("user_agent") or log_data.get("userAgent"),
                request_data,
                response_data,
                log_data.get("created_at") or log_data.get("createdAt") or now
            )
            return dict(row)
    except Exception as e:
        print(f"Error logging API call: {e}")
        return {}


async def create_analytics_entry(
    user_id: int,
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
    # Build request data with profile type and api version
    request_data = {}
    if profile_type:
        request_data["profileType"] = profile_type
    if api_version:
        request_data["apiVersion"] = api_version
    if user_role:
        request_data["userRole"] = user_role
    
    log_data = {
        "user_id": user_id,
        "username": username,
        "service": service,
        "endpoint": endpoint,
        "cost": cost,
        "response_time": response_time,
        "status_code": status_code,
        "request_data": request_data,
        "created_at": datetime.now()
    }
    
    return await log_api_call(log_data)


def build_analytics_filter(
    start_date: datetime,
    end_date: datetime,
    user_id: Optional[int] = None,
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
        Dictionary with filter conditions for PostgreSQL queries
    """
    filter_conditions = {
        "created_at": {"$gte": start_date, "$lte": end_date}
    }
    
    if user_id:
        filter_conditions["user_id"] = user_id
    if service:
        filter_conditions["service"] = service
    if endpoint:
        filter_conditions["endpoint"] = endpoint
    if profile_type:
        # Store profile type in request_data for flexibility
        filter_conditions["profile_type"] = profile_type
    
    return filter_conditions


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
        # Parse request_data if it's a JSON string
        request_data = log.get("request_data")
        if isinstance(request_data, str):
            try:
                request_data = json.loads(request_data)
            except (json.JSONDecodeError, TypeError):
                request_data = {}
        elif not request_data:
            request_data = {}
        
        formatted_logs.append({
            "timestamp": log.get("created_at"),
            "userId": str(log.get("user_id", "")),
            "username": log.get("username", ""),
            "userRole": request_data.get("userRole", ""),
            "service": log.get("service", ""),
            "endpoint": log.get("endpoint", ""),
            "apiVersion": request_data.get("apiVersion", "v1"),
            "cost": log.get("cost", 0.0),
            "statusCode": log.get("status_code", 0),
            "responseTime": log.get("response_time", 0.0),
            "profileType": request_data.get("profileType"),
        })
    return formatted_logs