from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime

class UserPermission(BaseModel):
    resource: Optional[str] = None
    actions: List[str] = Field(default_factory=lambda: ["view"])

class User(BaseModel):
    username: str = Field(..., min_length=1, strip_whitespace=True)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["admin", "superadmin"] = "admin"
    permissions: List[UserPermission] = Field(default_factory=lambda: [UserPermission(resource="news", actions=["view"])])
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True