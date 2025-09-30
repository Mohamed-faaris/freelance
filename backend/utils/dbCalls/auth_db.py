"""
Authentication database operations.

This module contains all database operations related to authentication and authorization.
"""

from typing import Optional, Dict, Any
from bson import ObjectId
from config.db import userCollection


async def authenticate_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find and return user by email for authentication purposes.
    
    Args:
        email: User's email address
        
    Returns:
        User document if found, None otherwise
    """
    return await userCollection.find_one({"email": email})


async def get_user_for_token_validation(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user document for token validation.
    
    Args:
        user_id: String representation of the user's ObjectId
        
    Returns:
        User document if found, None otherwise
    """
    try:
        return await userCollection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


async def check_user_exists_by_email(email: str) -> bool:
    """
    Check if a user exists by email (for registration validation).
    
    Args:
        email: Email address to check
        
    Returns:
        True if user exists, False otherwise
    """
    user = await userCollection.find_one({"email": email})
    return user is not None


async def check_user_exists_by_username(username: str) -> bool:
    """
    Check if a user exists by username (for registration validation).
    
    Args:
        username: Username to check
        
    Returns:
        True if user exists, False otherwise
    """
    user = await userCollection.find_one({"username": username})
    return user is not None


async def insert_new_user(user_data: Dict[str, Any]) -> str:
    """
    Insert a new user and return the user ID.
    
    Args:
        user_data: User data dictionary
        
    Returns:
        String representation of the inserted user's ObjectId
    """
    result = await userCollection.insert_one(user_data)
    return str(result.inserted_id)