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
    createdAt: datetime = Field(exclude=True)
    updatedAt: datetime = Field(exclude=True)

    model_config = ConfigDict(
        from_attributes=True
    )

    @field_validator('username')
    @classmethod
    def username_must_be_unique(cls, v):
        from config.db import userCollection
        if userCollection.find_one({"username": v}):
            raise ValueError('Username already exists')
        return v

    @field_validator('email')
    @classmethod
    def email_must_be_unique(cls, v):
        from config.db import userCollection
        if userCollection.find_one({"email": v}):
            raise ValueError('Email already exists')
        return v

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
        