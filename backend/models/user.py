from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
import bcrypt

class UserPermission(BaseModel):
    resource: Optional[str] = None
    actions: List[str] = Field(default_factory=lambda: ["view"])

class User(BaseModel):
    username: str = Field(..., min_length=1, strip_whitespace=True)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["admin", "superadmin", "user"] = "user"
    permissions: List[UserPermission] = Field(default_factory=lambda: [UserPermission(resource="news", actions=["view"])])
    roleResources: int = Field(default=0, ge=0, le=4095, description="12-bit field for role resources (0-4095)")
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )

    @field_validator('username')
    @classmethod
    def username_must_be_unique(cls, v):
        # Remove database check from validator - will be handled in endpoint
        return v

    @field_validator('email')
    @classmethod
    def email_must_be_unique(cls, v):
        # Remove database check from validator - will be handled in endpoint
        return v

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, strip_whitespace=True)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[Literal["admin", "superadmin", "user"]] = None
    permissions: Optional[List[UserPermission]] = None
    roleResources: Optional[int] = Field(None, ge=0, le=4095, description="12-bit field for role resources (0-4095)")

    model_config = ConfigDict(
        from_attributes=True
    )
        