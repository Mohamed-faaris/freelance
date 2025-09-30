"""
Updated User Routes for PostgreSQL
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.user import User, UserUpdate
from models.database_models import User as DBUser
from config.database import get_db
from repositories.database_repository import UserRepository, serialize_dict, serialize_list
from datetime import datetime, timezone

userRoute = APIRouter()

@userRoute.get("")
async def find_all_users(db: Session = Depends(get_db)):
    """Get all users"""
    try:
        user_repo = UserRepository(db)
        users = await user_repo.get_all_users()
        return {"users": serialize_list(users)}
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@userRoute.post("")
async def create_user(user: User, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        user_repo = UserRepository(db)
        
        # Check uniqueness before creating
        existing_username = await user_repo.get_user_by_username(user.username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        existing_email = await user_repo.get_user_by_email(user.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Prepare user data
        user_data = user.model_dump()
        user_data["password"] = User.hash_password(user_data["password"])  # Hash the password
        
        # Create user
        created_user = await user_repo.create_user(user_data)
        return {"user": serialize_dict(created_user)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@userRoute.put("/{id}")
async def update_user(id: str, user: UserUpdate, db: Session = Depends(get_db)):
    """Update a user"""
    try:
        user_repo = UserRepository(db)
        
        # Check if user exists
        existing_user = await user_repo.get_user_by_id(id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data
        update_data = user.model_dump(exclude_unset=True)  # Only include provided fields
        
        # Handle password hashing if provided
        if update_data.get("password"):
            update_data["password"] = User.hash_password(update_data["password"])
        
        # Always update the updated_at timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update user
        updated_user = await user_repo.update_user(id, update_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"user": serialize_dict(updated_user)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@userRoute.delete("/{id}")
async def delete_user(id: str, db: Session = Depends(get_db)):
    """Delete a user"""
    try:
        user_repo = UserRepository(db)
        
        # Get user before deletion for return value
        user_to_delete = await user_repo.get_user_by_id(id)
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user
        success = await user_repo.delete_user(id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return serialize_dict(user_to_delete)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")