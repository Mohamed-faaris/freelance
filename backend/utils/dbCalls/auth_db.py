"""
Authentication database operations.

This module contains all database operations related to authentication and authorization.
"""

from tkinter import E
from typing import Optional, Dict, Any

from cv2 import add
from config.db import get_db_pool
from utils.dbCalls.user_db import add_computed_fields_to_user_row


async def authenticate_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find and return user by email for authentication purposes.
    
    Args:
        email: User's email address
        
    Returns:
        User document if found, None otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = $1",
                email
            )
            
            if row:
                return add_computed_fields_to_user_row(dict(row))
            return None
    except Exception:
        print("Error in authenticate_user_by_email", {Exception})
        return None


async def get_user_for_token_validation(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user document for token validation.
    
    Args:
        user_id: User's ID
        
    Returns:
        User document if found, None otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, username, email, password, created_at, updated_at FROM users WHERE id = $1",
                user_id
            )
            if row:
                return add_computed_fields_to_user_row(dict(row))
            return None
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
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
            return row is not None
    except Exception:
        return False


async def check_user_exists_by_username(username: str) -> bool:
    """
    Check if a user exists by username (for registration validation).
    
    Args:
        username: Username to check
        
    Returns:
        True if user exists, False otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
            return row is not None
    except Exception:
        return False


async def insert_new_user(user_data: Dict[str, Any]) -> int:
    """
    Insert a new user and return the user ID.
    
    Args:
        user_data: User data dictionary
        
    Returns:
        ID of the inserted user
    """
    try:
        import json
        from datetime import datetime, timezone
        
        now = datetime.now(timezone.utc)
        
        # Convert permissions to JSON string if it's a list
        permissions = user_data.get("permissions", [])
        if isinstance(permissions, list):
            permissions = json.dumps(permissions)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user_id = await conn.fetchval(
                """
                INSERT INTO users (username, email, password,  created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                user_data.get("username"),
                user_data.get("email"),
                user_data.get("password"),
                user_data.get("role", "user"),
                permissions,
                user_data.get("createdAt") or now,
                user_data.get("updatedAt") or now
            )
            return user_id
    except Exception:
        return None