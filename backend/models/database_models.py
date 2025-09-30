from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import bcrypt
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()), index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    permissions = Column(JSON, default=lambda: [{"resource": "news", "actions": ["view"]}])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    api_analytics = relationship("APIAnalytics", back_populates="user")
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": str(self.uuid),  # Use UUID as external ID
            "_id": str(self.uuid),  # Compatibility with existing code
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "permissions": self.permissions,
            "is_active": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

class APIAnalytics(Base):
    __tablename__ = "api_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time = Column(Integer)  # in milliseconds
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    request_data = Column(JSON)
    response_data = Column(JSON)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="api_analytics")
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": str(self.uuid),
            "_id": str(self.uuid),
            "user_id": str(self.user.uuid) if self.user else None,
            "endpoint": self.endpoint,
            "method": self.method,
            "status_code": self.status_code,
            "response_time": self.response_time,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "request_data": self.request_data,
            "response_data": self.response_data,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class NewsCache(Base):
    __tablename__ = "news_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(500), unique=True, index=True, nullable=False)
    data = Column(JSON, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "cache_key": self.cache_key,
            "data": self.data,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CourtCases(Base):
    __tablename__ = "court_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_data = Column(JSON, nullable=False)
    search_params = Column(JSON, nullable=False)
    raw_cases = Column(JSON, nullable=False)
    valid_cases = Column(JSON, nullable=False)
    invalid_cases = Column(JSON, nullable=False)
    search_summary = Column(JSON, nullable=False)
    file_name = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": str(self.uuid),
            "_id": str(self.uuid),
            "user_id": self.user_id,
            "profile_data": self.profile_data,
            "search_params": self.search_params,
            "raw_cases": self.raw_cases,
            "valid_cases": self.valid_cases,
            "invalid_cases": self.invalid_cases,
            "search_summary": self.search_summary,
            "file_name": self.file_name,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }