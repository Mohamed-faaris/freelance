from sqlalchemy.orm import Session
from fastapi import Depends
from config.database import get_db
from models.database_models import User as DBUser, APIAnalytics as DBAPIAnalytics
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class UserRepository:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
    
    async def create_user(self, user_data: Dict[str, Any]) -> DBUser:
        """Create a new user"""
        db_user = DBUser(
            username=user_data["username"],
            email=user_data["email"],
            password=user_data["password"],  # Should be pre-hashed
            role=user_data.get("role", "user"),
            permissions=user_data.get("permissions", [{"resource": "news", "actions": ["view"]}])
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    async def get_user_by_id(self, user_id: str) -> Optional[DBUser]:
        """Get user by UUID"""
        return self.db.query(DBUser).filter(DBUser.uuid == user_id).first()
    
    async def get_user_by_username(self, username: str) -> Optional[DBUser]:
        """Get user by username"""
        return self.db.query(DBUser).filter(DBUser.username == username).first()
    
    async def get_user_by_email(self, email: str) -> Optional[DBUser]:
        """Get user by email"""
        return self.db.query(DBUser).filter(DBUser.email == email).first()
    
    async def get_all_users(self) -> List[DBUser]:
        """Get all users"""
        return self.db.query(DBUser).all()
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[DBUser]:
        """Update user"""
        db_user = self.db.query(DBUser).filter(DBUser.uuid == user_id).first()
        if not db_user:
            return None
        
        for field, value in update_data.items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)
        
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        db_user = self.db.query(DBUser).filter(DBUser.uuid == user_id).first()
        if not db_user:
            return False
        
        self.db.delete(db_user)
        self.db.commit()
        return True

class AnalyticsRepository:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
    
    async def create_analytics_record(self, analytics_data: Dict[str, Any]) -> DBAPIAnalytics:
        """Create analytics record"""
        # Get user by UUID
        user = self.db.query(DBUser).filter(DBUser.uuid == analytics_data["user_id"]).first()
        if not user:
            raise ValueError(f"User not found: {analytics_data['user_id']}")
        
        db_analytics = DBAPIAnalytics(
            user_id=user.id,  # Use internal ID for foreign key
            endpoint=analytics_data["endpoint"],
            method=analytics_data["method"],
            status_code=analytics_data["status_code"],
            response_time=analytics_data.get("response_time"),
            ip_address=analytics_data.get("ip_address"),
            user_agent=analytics_data.get("user_agent"),
            request_data=analytics_data.get("request_data"),
            response_data=analytics_data.get("response_data"),
            error_message=analytics_data.get("error_message")
        )
        self.db.add(db_analytics)
        self.db.commit()
        self.db.refresh(db_analytics)
        return db_analytics
    
    async def get_user_analytics(self, user_id: str, limit: int = 100) -> List[DBAPIAnalytics]:
        """Get analytics for a user"""
        user = self.db.query(DBUser).filter(DBUser.uuid == user_id).first()
        if not user:
            return []
        
        return self.db.query(DBAPIAnalytics)\
            .filter(DBAPIAnalytics.user_id == user.id)\
            .order_by(DBAPIAnalytics.created_at.desc())\
            .limit(limit)\
            .all()

# Utility functions for backward compatibility
def serialize_dict(db_obj) -> Dict[str, Any]:
    """Convert database object to dictionary (MongoDB compatibility)"""
    if hasattr(db_obj, 'to_dict'):
        return db_obj.to_dict()
    return {}

def serialize_list(db_objects) -> List[Dict[str, Any]]:
    """Convert list of database objects to list of dictionaries"""
    return [serialize_dict(obj) for obj in db_objects]