from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class ProfileType(str, Enum):
    MINI = "mini"
    LITE = "lite"
    ADVANCED = "advanced"
    BUSINESS = "business"

class ApiAnalytics(BaseModel):
    userId: ObjectId = Field(...)
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

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={
            ObjectId: str
        }
    )

    @classmethod
    async def log_api_call(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        from config.db import apiAnalyticsCollection
        instance = cls(**data)
        doc = instance.dict()
        result = await apiAnalyticsCollection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

def create_api_analytics_indexes():
    from config.db import apiAnalyticsCollection
    # Single field indexes
    apiAnalyticsCollection.create_index("userId")
    apiAnalyticsCollection.create_index("username")
    apiAnalyticsCollection.create_index("service")
    apiAnalyticsCollection.create_index("endpoint")
    apiAnalyticsCollection.create_index("profileType")
    apiAnalyticsCollection.create_index("businessId")
    apiAnalyticsCollection.create_index("createdAt")
    # Compound indexes
    apiAnalyticsCollection.create_index([("userId", 1), ("createdAt", 1)])
    apiAnalyticsCollection.create_index([("service", 1), ("endpoint", 1), ("createdAt", 1)])
    apiAnalyticsCollection.create_index([("profileType", 1), ("createdAt", 1)])