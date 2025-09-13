from pydantic import BaseModel, Field
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
    userId: ObjectId = Field(..., alias="_id")
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

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str
        }

    @classmethod
    def log_api_call(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        from config.db import apiAnalyticsCollection
        doc = {
            "userId": data["userId"],
            "username": data["username"],
            "userRole": data["userRole"],
            "service": data["service"],
            "endpoint": data["endpoint"],
            "apiVersion": data.get("apiVersion", "v1"),
            "cost": data["cost"],
            "statusCode": data["statusCode"],
            "responseTime": data["responseTime"],
            "profileType": data.get("profileType"),
            "businessId": data.get("businessId"),
            "createdAt": datetime.utcnow(),
            "requestData": data.get("requestData"),
            "responseData": data.get("responseData")
        }
        result = apiAnalyticsCollection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc