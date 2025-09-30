from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import text
from config.database import AsyncSessionLocal, engine
from models.database_models import APIAnalytics as APIAnalyticsModel

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class ProfileType(str, Enum):
    MINI = "mini"
    LITE = "lite"
    ADVANCED = "advanced"
    BUSINESS = "business"

class ApiAnalytics(BaseModel):
    userId: str = Field(...)
    username: str
    userRole: UserRole
    service: str
    endpoint: str
    apiVersion: str = "v1"
    cost: float = 0.0
    statusCode: int
    responseTime: float
    profileType: Optional[ProfileType] = None
    businessId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    requestData: Optional[Dict[str, Any]] = None
    responseData: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    async def log_api_call(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        instance = cls(**data)

        profile_type = (
            instance.profileType.value
            if isinstance(instance.profileType, Enum)
            else instance.profileType
        )

        async with AsyncSessionLocal() as session:
            record = APIAnalyticsModel(
                user_uuid=instance.userId,
                username=instance.username,
                user_role=instance.userRole.value
                if isinstance(instance.userRole, Enum)
                else instance.userRole,
                service=instance.service,
                endpoint=instance.endpoint,
                api_version=instance.apiVersion,
                cost=instance.cost,
                status_code=instance.statusCode,
                response_time=instance.responseTime,
                profile_type=profile_type,
                business_id=instance.businessId,
                request_data=instance.requestData,
                response_data=instance.responseData,
                created_at=instance.createdAt,
            )
            session.add(record)
            await session.commit()
            await session.refresh(record)
            return record.to_dict()

async def create_api_analytics_indexes() -> None:
    index_statements = [
        "CREATE INDEX IF NOT EXISTS idx_api_analytics_user_uuid ON api_analytics (user_uuid)",
        "CREATE INDEX IF NOT EXISTS idx_api_analytics_service ON api_analytics (service)",
        "CREATE INDEX IF NOT EXISTS idx_api_analytics_endpoint ON api_analytics (endpoint)",
        "CREATE INDEX IF NOT EXISTS idx_api_analytics_created_at ON api_analytics (created_at)",
    ]

    async with engine.begin() as conn:
        for stmt in index_statements:
            await conn.execute(text(stmt))