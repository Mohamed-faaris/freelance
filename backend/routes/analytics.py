from fastapi import APIRouter, HTTPException, Request, Query, Depends
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.database_models import APIAnalytics as APIAnalyticsModel
from models.user import User
from utils.auth import get_authenticated_user

analyticsRouter = APIRouter()


def parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    """Parse ISO8601 strings, accepting trailing Z for UTC."""
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {value}")


def build_filters(
    start: datetime,
    end: datetime,
    user_id: Optional[str],
    service: Optional[str],
    endpoint: Optional[str],
    profile_type: Optional[str],
) -> List:
    filters = [
        APIAnalyticsModel.created_at >= start,
        APIAnalyticsModel.created_at <= end,
    ]

    if user_id:
        filters.append(APIAnalyticsModel.user_uuid == user_id)
    if service:
        filters.append(APIAnalyticsModel.service == service)
    if endpoint:
        filters.append(APIAnalyticsModel.endpoint == endpoint)
    if profile_type:
        filters.append(APIAnalyticsModel.profile_type == profile_type)

    return filters

@analyticsRouter.get("")
async def get_analytics(
    request: Request,
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    endpoint: Optional[str] = Query(None),
    profileType: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    # Authenticate and authorize user
    user_doc = await get_authenticated_user(request)
    user = User.model_validate(user_doc)
    if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    now = datetime.now(timezone.utc)
    start = parse_iso_datetime(startDate) or (now - timedelta(days=30))
    end = parse_iso_datetime(endDate) or now
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)

    filters = build_filters(start, end, userId, service, endpoint, profileType)

    # Overview
    overview_stmt = select(
        func.count(APIAnalyticsModel.id).label("total_calls"),
        func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("total_cost"),
        func.coalesce(func.avg(APIAnalyticsModel.response_time), 0.0).label("avg_response_time"),
    ).where(*filters)
    overview_row = (await db.execute(overview_stmt)).first()
    overview = {
        "totalCalls": overview_row.total_calls if overview_row and overview_row.total_calls is not None else 0,
        "totalCost": float(overview_row.total_cost or 0.0) if overview_row else 0.0,
        "avgResponseTime": float(overview_row.avg_response_time or 0.0) if overview_row else 0.0,
    }

    # Daily usage
    day_column = func.date_trunc("day", APIAnalyticsModel.created_at).label("day")
    daily_stmt = (
        select(
            day_column,
            func.count(APIAnalyticsModel.id).label("calls"),
            func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("cost"),
        )
        .where(*filters)
        .group_by(day_column)
        .order_by(day_column)
    )
    daily_rows = (await db.execute(daily_stmt)).all()
    daily_usage = [
        {
            "date": row.day.date().isoformat() if row.day else None,
            "calls": row.calls,
            "cost": float(row.cost or 0.0),
        }
        for row in daily_rows
    ]

    # Service breakdown
    service_calls = func.count(APIAnalyticsModel.id).label("calls")
    service_cost = func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("cost")
    service_stmt = (
        select(
            APIAnalyticsModel.service.label("service"),
            service_calls,
            service_cost,
        )
        .where(*filters)
        .group_by(APIAnalyticsModel.service)
        .order_by(service_calls.desc())
    )
    service_rows = (await db.execute(service_stmt)).all()
    service_breakdown = [
        {"service": row.service, "calls": row.calls, "cost": float(row.cost or 0.0)}
        for row in service_rows
    ]

    # User usage
    user_calls = func.count(APIAnalyticsModel.id).label("calls")
    user_cost = func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("cost")
    user_stmt = (
        select(
            APIAnalyticsModel.user_uuid.label("user_uuid"),
            APIAnalyticsModel.username.label("username"),
            user_calls,
            user_cost,
        )
        .where(*filters)
        .group_by(APIAnalyticsModel.user_uuid, APIAnalyticsModel.username)
        .order_by(user_cost.desc())
        .limit(10)
    )
    user_rows = (await db.execute(user_stmt)).all()
    user_usage = [
        {
            "userId": row.user_uuid,
            "username": row.username,
            "calls": row.calls,
            "cost": float(row.cost or 0.0),
        }
        for row in user_rows
    ]

    # Profile type counts
    profile_stmt = (
        select(
            APIAnalyticsModel.profile_type.label("profile_type"),
            func.count(APIAnalyticsModel.id).label("count"),
            func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("cost"),
        )
    .where(*filters, APIAnalyticsModel.profile_type.isnot(None))
        .group_by(APIAnalyticsModel.profile_type)
    )
    profile_rows = (await db.execute(profile_stmt)).all()
    profile_type_counts = [
        {
            "profileType": row.profile_type,
            "count": row.count,
            "cost": float(row.cost or 0.0),
        }
        for row in profile_rows
    ]

    # Top endpoints
    endpoint_calls = func.count(APIAnalyticsModel.id).label("calls")
    endpoint_cost = func.coalesce(func.sum(APIAnalyticsModel.cost), 0.0).label("cost")
    endpoint_avg = func.coalesce(func.avg(APIAnalyticsModel.response_time), 0.0).label("avg_response_time")
    endpoint_stmt = (
        select(
            APIAnalyticsModel.endpoint.label("endpoint"),
            endpoint_calls,
            endpoint_cost,
            endpoint_avg,
        )
        .where(*filters)
        .group_by(APIAnalyticsModel.endpoint)
        .order_by(endpoint_calls.desc())
        .limit(15)
    )
    endpoint_rows = (await db.execute(endpoint_stmt)).all()
    top_endpoints = [
        {
            "endpoint": row.endpoint,
            "calls": row.calls,
            "cost": float(row.cost or 0.0),
            "avgResponseTime": float(row.avg_response_time or 0.0),
        }
        for row in endpoint_rows
    ]

    return {
        "overview": overview,
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
    db: AsyncSession = Depends(get_db),
):
    # Authenticate and authorize user
    user_doc = await get_authenticated_user(request)
    user = User.model_validate(user_doc)
    if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    now = datetime.now(timezone.utc)
    start = parse_iso_datetime(startDate) or (now - timedelta(days=30))
    end = parse_iso_datetime(endDate) or now
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    end = end.replace(hour=23, minute=59, second=59, microsecond=999999)

    filters = build_filters(start, end, userId, service, endpoint, profileType)

    offset = (page - 1) * limit

    logs_stmt = (
        select(APIAnalyticsModel)
        .where(*filters)
        .order_by(APIAnalyticsModel.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    logs_result = await db.execute(logs_stmt)
    log_records = logs_result.scalars().all()

    logs = [
        {
            "timestamp": record.created_at.isoformat() if record.created_at else None,
            "userId": record.user_uuid,
            "username": record.username,
            "userRole": record.user_role,
            "service": record.service,
            "endpoint": record.endpoint,
            "apiVersion": record.api_version,
            "cost": float(record.cost or 0.0),
            "statusCode": record.status_code,
            "responseTime": float(record.response_time or 0.0),
            "profileType": record.profile_type,
        }
        for record in log_records
    ]

    total_count_stmt = select(func.count(APIAnalyticsModel.id)).where(*filters)
    total_count = (await db.execute(total_count_stmt)).scalar() or 0

    return {
        "logs": logs,
        "pagination": {
            "page": page,
            "limit": limit,
            "totalCount": total_count,
            "totalPages": (total_count + limit - 1) // limit,
        },
    }