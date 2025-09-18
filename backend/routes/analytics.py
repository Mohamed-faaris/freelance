from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from config.db import apiAnalyticsCollection, userCollection
from models.user import User
import jwt
import os

analyticsRouter = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

def authenticate(request: Request):
    token = request.cookies.get("auth_token")
    if not token:
        return None
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except:
        return None

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
    # Authenticate
    decoded = authenticate(request)
    if not decoded:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get user
    user_doc = await userCollection.find_one({"_id": ObjectId(decoded["id"])})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    user = User.model_construct(**user_doc)

    # Check permissions
    if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
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
    filter_ = {
        "createdAt": {"$gte": start, "$lte": end}
    }
    if userId:
        filter_["userId"] = ObjectId(userId)
    if service:
        filter_["service"] = service
    if endpoint:
        filter_["endpoint"] = endpoint
    if profileType:
        filter_["profileType"] = profileType

    # Aggregations
    total_usage = list(apiAnalyticsCollection.aggregate([
        {"$match": filter_},
        {
            "$group": {
                "_id": None,
                "totalCalls": {"$sum": 1},
                "totalCost": {"$sum": "$cost"},
                "avgResponseTime": {"$avg": "$responseTime"},
            },
        },
    ]))

    daily_usage = list(apiAnalyticsCollection.aggregate([
        {"$match": filter_},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"_id": 1}},
    ]))

    service_breakdown = list(apiAnalyticsCollection.aggregate([
        {"$match": filter_},
        {
            "$group": {
                "_id": "$service",
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"calls": -1}},
    ]))

    user_usage = list(apiAnalyticsCollection.aggregate([
        {"$match": filter_},
        {
            "$group": {
                "_id": {"userId": "$userId", "username": "$username"},
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
        {"$sort": {"cost": -1}},
        {"$limit": 10},
    ]))

    profile_type_counts = list(apiAnalyticsCollection.aggregate([
        {"$match": {**filter_, "profileType": {"$ne": None}}},
        {
            "$group": {
                "_id": "$profileType",
                "count": {"$sum": 1},
                "cost": {"$sum": "$cost"},
            },
        },
    ]))

    top_endpoints = list(apiAnalyticsCollection.aggregate([
        {"$match": filter_},
        {
            "$group": {
                "_id": "$endpoint",
                "calls": {"$sum": 1},
                "cost": {"$sum": "$cost"},
                "avgResponseTime": {"$avg": "$responseTime"},
            },
        },
        {"$sort": {"calls": -1}},
        {"$limit": 15},
    ]))

    # Convert ObjectId to str for serialization
    for item in user_usage:
        if "userId" in item["_id"]:
            item["_id"]["userId"] = str(item["_id"]["userId"])

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
    # Authenticate
    decoded = authenticate(request)
    if not decoded:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get user
    user_doc = await userCollection.find_one({"_id": ObjectId(decoded["id"])})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    user = User.model_construct(**user_doc)

    # Check permissions
    if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
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
    filter_ = {
        "createdAt": {"$gte": start, "$lte": end}
    }
    if userId:
        filter_["userId"] = ObjectId(userId)
    if service:
        filter_["service"] = service
    if endpoint:
        filter_["endpoint"] = endpoint
    if profileType:
        filter_["profileType"] = profileType

    try:
        # Get logs with pagination
        skip = (page - 1) * limit
        logs_cursor = apiAnalyticsCollection.find(filter_).sort("createdAt", -1).skip(skip).limit(limit)
        
        # Convert cursor to list
        logs_list = await logs_cursor.to_list(length=None)
        
        # Get logs
        logs = []
        for log in logs_list:
            logs.append({
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

        # Get total count for pagination
        total_count = apiAnalyticsCollection.count_documents(filter_)

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