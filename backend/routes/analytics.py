from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from utils.dbCalls.analytics_db import (
    get_analytics_total_usage,
    get_analytics_daily_usage,
    get_analytics_service_breakdown,
    get_analytics_user_usage,
    get_analytics_profile_type_counts,
    get_analytics_top_endpoints,
    get_analytics_logs_paginated,
    count_analytics_logs,
    build_analytics_filter,
    format_analytics_logs_for_response
)
from utils.auth import get_authenticated_user
from utils.permissions import has_verification_advanced_access
import jwt
import os

analyticsRouter = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

@analyticsRouter.get("")
async def get_analytics(
    request: Request,
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    endpoint: Optional[str] = Query(None),
    profileType: Optional[str] = Query(None),
):
    # Authenticate user - get JWT payload directly (stateless)
    user_doc = await get_authenticated_user(request)

    # Check permissions using JWT permission bits
    if not has_verification_advanced_access(user_doc):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Parse dates
    if startDate:
        start = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
    else:
        start = datetime.now() - timedelta(days=30)
    if endDate:
        end = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
    else:
        end = datetime.now()
    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Build filter
    filter_ = build_analytics_filter(start, end, userId, service, endpoint, profileType)

    # Aggregations
    total_usage = await get_analytics_total_usage(filter_)
    daily_usage = await get_analytics_daily_usage(filter_)
    service_breakdown = await get_analytics_service_breakdown(filter_)
    user_usage = await get_analytics_user_usage(filter_, limit=10)
    profile_type_counts = await get_analytics_profile_type_counts(filter_)
    top_endpoints = await get_analytics_top_endpoints(filter_, limit=15)

    # Convert IDs to str for serialization
    for item in user_usage:
        if "id" in item and isinstance(item["id"], dict) and "userId" in item["id"]:
            item["id"]["userId"] = str(item["id"]["userId"])

    # Format response
    analytics = {
        "overview": total_usage[0] if total_usage else {
            "totalCalls": 0,
            "totalCost": 0,
            "avgResponseTime": 0,
        },
        "dailyUsage": daily_usage,
        "serviceBreakdown": service_breakdown,
        "userUsage": user_usage,
        "profileTypeCounts": profile_type_counts,
        "topEndpoints": top_endpoints,
        "timeRange": {
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
        },
    }

    return analytics

@analyticsRouter.get("/logs")
async def get_analytics_logs(
    request: Request,
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    endpoint: Optional[str] = Query(None),
    profileType: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
):
    # Authenticate user - get JWT payload directly (stateless)
    user_doc = await get_authenticated_user(request)

    # Check permissions using JWT permission bits
    if not has_verification_advanced_access(user_doc):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Parse dates
    if startDate:
        start = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
    else:
        start = datetime.now() - timedelta(days=30)
    if endDate:
        end = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
    else:
        end = datetime.now()
    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Build filter
    filter_ = build_analytics_filter(start, end, userId, service, endpoint, profileType)

    try:
        # Get logs with pagination
        logs_list = await get_analytics_logs_paginated(filter_, page, limit)
        
        # Format logs for response
        logs = format_analytics_logs_for_response(logs_list)

        # Get total count for pagination
        total_count = await count_analytics_logs(filter_)

        return {
            "logs": logs,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalCount": total_count,
                "totalPages": (total_count + limit - 1) // limit,  # Ceiling division
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch API logs: {str(e)}")