from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any
from datetime import datetime
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
    id: Optional[int] = None
    user_id: int = Field(...)
    username: str
    service: str
    endpoint: str
    method: str = "GET"
    status_code: int
    response_time: float
    cost: float = 0.0
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_data: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        from_attributes=True,
        alias_priority=2
    )

    @classmethod
    async def log_api_call(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        from utils.dbCalls.analytics_db import log_api_call
        return await log_api_call(data)

def create_api_analytics_indexes():
    """
    Index creation is handled automatically in the database configuration.
    PostgreSQL indexes are created in the create_tables() function in config/db.py
    """
    pass