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
    roleResources: int = Field(default=0, ge=0, le=4095, description="12-bit field for role resources (0-4095)")
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    # Computed properties derived from roleResources
    @property
    def role(self) -> str:
        """Get role from roleResources bitfield."""
        from utils.dbCalls.user_db import get_role_from_bits
        return get_role_from_bits(self.roleResources)
    
    @property
    def permissions(self) -> List[UserPermission]:
        """Get permissions from roleResources bitfield."""
        from utils.dbCalls.user_db import permissions_from_int_with_admin
        permissions_data = permissions_from_int_with_admin(self.roleResources)
        return [UserPermission(**perm) for perm in permissions_data["permissions"]]

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
    roleResources: Optional[int] = Field(None, ge=0, le=4095, description="12-bit field for role resources (0-4095)")

    model_config = ConfigDict(
        from_attributes=True
    )
        