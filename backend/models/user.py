from pydantic import BaseModel, Field, EmailStr
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
    role: Literal["admin", "superadmin"] = "admin"
    permissions: List[UserPermission] = Field(default_factory=lambda: [UserPermission(resource="news", actions=["view"])])
    createdAt: datetime = Field(exclude=True)
    updatedAt: datetime = Field(exclude=True)

    class Config:
        orm_mode = True

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
        