"""
User database operations.

This module contains all database operations related to user management.
All model operations are handled internally to keep routes model-free.
"""

from typing import Optional, Dict, Any, List
from bson import ObjectId
from config.db import userCollection
from datetime import datetime, timezone


async def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Find a user by their ObjectId.
    
    Args:
        user_id: String representation of the user's ObjectId
        
    Returns:
        User document if found, None otherwise
    """
    try:
        return await userCollection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find a user by their email address.
    
    Args:
        email: User's email address
        
    Returns:
        User document if found, None otherwise
    """
    return await userCollection.find_one({"email": email})


async def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Find a user by their username.
    
    Args:
        username: User's username
        
    Returns:
        User document if found, None otherwise
    """
    return await userCollection.find_one({"username": username})


async def find_all_users() -> List[Dict[str, Any]]:
    """
    Get all users from the database.
    
    Returns:
        List of user documents
    """
    return await userCollection.find().to_list(length=None)


async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user in the database with proper password hashing.
    
    Args:
        user_data: Dictionary containing user data
        
    Returns:
        Created user document with _id
        
    Raises:
        Exception: If creation fails
    """
    from models.user import User  # Import only when needed
    
    now = datetime.now(timezone.utc)
    user_data["createdAt"] = now
    user_data["updatedAt"] = now
    
    # Hash password if provided
    if "password" in user_data:
        user_data["password"] = User.hash_password(user_data["password"])
    
    result = await userCollection.insert_one(user_data)
    created_user = await userCollection.find_one({"_id": result.inserted_id})
    return created_user


async def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update a user in the database with proper password hashing.
    
    Args:
        user_id: String representation of the user's ObjectId
        update_data: Dictionary containing fields to update
        
    Returns:
        Updated user document if found, None otherwise
    """
    # Always update the updatedAt timestamp
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    # Hash password if provided
    if "password" in update_data:
        from models.user import User  # Import only when needed
        update_data["password"] = User.hash_password(update_data["password"])
    
    await userCollection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    return await userCollection.find_one({"_id": ObjectId(user_id)})


async def delete_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Delete a user from the database.
    
    Args:
        user_id: String representation of the user's ObjectId
        
    Returns:
        Deleted user document if found, None otherwise
    """
    return await userCollection.find_one_and_delete({"_id": ObjectId(user_id)})


async def check_email_exists(email: str) -> bool:
    """
    Check if a user with the given email exists.
    
    Args:
        email: Email address to check
        
    Returns:
        True if email exists, False otherwise
    """
    user = await userCollection.find_one({"email": email})
    return user is not None


async def check_username_exists(username: str) -> bool:
    """
    Check if a user with the given username exists.
    
    Args:
        username: Username to check
        
    Returns:
        True if username exists, False otherwise
    """
    user = await userCollection.find_one({"username": username})
    return user is not None


async def validate_user_password(user_doc: Dict[str, Any], password: str) -> bool:
    """
    Validate user password using the User model.
    
    Args:
        user_doc: User document from database
        password: Plain text password to validate
        
    Returns:
        True if password is valid, False otherwise
    """
    from models.user import User
    
    user = User.model_construct(**user_doc)
    return user.verify_password(password)


async def get_user_with_model(user_id: str) -> Optional[Any]:
    """
    Get user document and construct User model instance.
    
    Args:
        user_id: String representation of the user's ObjectId
        
    Returns:
        User model instance if found, None otherwise
    """
    from models.user import User
    
    user_doc = await find_user_by_id(user_id)
    if not user_doc:
        return None
    
    return User.model_construct(**user_doc)


async def check_user_permissions(user_doc: Dict[str, Any], required_resource: str) -> bool:
    """
    Check if user has permissions for a specific resource.
    
    Args:
        user_doc: User document from database
        required_resource: Resource name to check permissions for
        
    Returns:
        True if user has permissions, False otherwise
    """
    user_role = user_doc.get("role", "user")
    
    # Superadmin has all permissions
    if user_role == "superadmin":
        return True
    
    # Check specific permissions
    permissions = user_doc.get("permissions", [])
    return any(p.get("resource") == required_resource for p in permissions)


async def find_users_by_query(query: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Find users by a custom query.
    
    Args:
        query: MongoDB query dictionary
        
    Returns:
        List of user documents
    """
    cursor = userCollection.find(query)
    return await cursor.to_list(length=None)


async def update_user_permissions(user_id: str, permissions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Update user permissions.
    
    Args:
        user_id: String representation of the user's ObjectId
        permissions: List of permission dictionaries
        
    Returns:
        Updated user document if successful, None otherwise
    """
    try:
        update_data = {
            "permissions": permissions,
            "updatedAt": datetime.now(timezone.utc)
        }
        
        updated_user = await userCollection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        return updated_user
    except Exception:
        return None