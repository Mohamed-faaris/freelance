"""
User database operations.

This module contains all database operations related to user management.
All model operations are handled internally to keep routes model-free.
"""

from typing import Optional, Dict, Any, List
import json
from config.db import get_db_pool
from datetime import datetime, timezone


async def find_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Find a user by their ID.
    
    Args:
        user_id: User's ID
        
    Returns:
        User document if found, None otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, username, email, password, role, permissions, role_resources, created_at, updated_at FROM users WHERE id = $1",
                user_id
            )
            if row:
                return dict(row)
            return None
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
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, username, email, password, role, permissions, role_resources, created_at, updated_at FROM users WHERE email = $1",
                email
            )
            if row:
                return dict(row)
            return None
    except Exception:
        return None


async def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Find a user by their username.
    
    Args:
        username: User's username
        
    Returns:
        User document if found, None otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, username, email, password, role, permissions, role_resources, created_at, updated_at FROM users WHERE username = $1",
                username
            )
            if row:
                return dict(row)
            return None
    except Exception:
        return None


async def find_all_users() -> List[Dict[str, Any]]:
    """
    Get all users from the database.
    
    Returns:
        List of user documents
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, username, email, password, role, permissions, role_resources, created_at, updated_at FROM users ORDER BY created_at DESC"
            )
            return [dict(row) for row in rows]
    except Exception:
        return []


async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user in the database with proper password hashing.
    
    Args:
        user_data: Dictionary containing user data
        
    Returns:
        Created user document with id
        
    Raises:
        Exception: If creation fails
    """
    from models.user import User  # Import only when needed
    
    now = datetime.now(timezone.utc)
    
    # Hash password if provided
    password = user_data.get("password")
    if password:
        password = User.hash_password(password)
    
    # Convert permissions to JSON string if it's a list
    permissions = user_data.get("permissions", [])
    if isinstance(permissions, list):
        permissions = json.dumps(permissions)
    
    # Handle roleResources field - can come from either roleResources or role_resources
    role_resources = user_data.get("roleResources", user_data.get("role_resources", 0))
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (username, email, password, role, permissions, role_resources, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, username, email, password, role, permissions, role_resources, created_at, updated_at
            """,
            user_data.get("username"),
            user_data.get("email"),
            password,
            user_data.get("role", "user"),
            permissions,
            role_resources,
            now,
            now
        )
        return dict(row)


async def update_user(user_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update a user in the database with proper password hashing.
    
    Args:
        user_id: User's ID
        update_data: Dictionary containing fields to update
        
    Returns:
        Updated user document if found, None otherwise
    """
    try:
        # Always update the updated_at timestamp
        now = datetime.now(timezone.utc)
        
        # Hash password if provided
        if "password" in update_data:
            from models.user import User  # Import only when needed
            update_data["password"] = User.hash_password(update_data["password"])
        
        # Convert permissions to JSON string if it's a list
        if "permissions" in update_data and isinstance(update_data["permissions"], list):
            update_data["permissions"] = json.dumps(update_data["permissions"])
        
        # Handle roleResources field mapping to role_resources column
        if "roleResources" in update_data:
            update_data["role_resources"] = update_data.pop("roleResources")
        
        # Build dynamic update query
        set_clauses = []
        values = []
        param_count = 1
        
        for key, value in update_data.items():
            set_clauses.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
        
        set_clauses.append(f"updated_at = ${param_count}")
        values.append(now)
        values.append(user_id)  # For the WHERE clause
        
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ${param_count + 1} RETURNING id, username, email, password, role, permissions, role_resources, created_at, updated_at"
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            if row:
                return dict(row)
            return None
    except Exception:
        return None


async def delete_user(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Delete a user from the database.
    
    Args:
        user_id: User's ID
        
    Returns:
        Deleted user document if found, None otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "DELETE FROM users WHERE id = $1 RETURNING id, username, email, password, role, permissions, role_resources, created_at, updated_at",
                user_id
            )
            if row:
                return dict(row)
            return None
    except Exception:
        return None


async def check_email_exists(email: str) -> bool:
    """
    Check if a user with the given email exists.
    
    Args:
        email: Email address to check
        
    Returns:
        True if email exists, False otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
            return row is not None
    except Exception:
        return False


async def check_username_exists(username: str) -> bool:
    """
    Check if a user with the given username exists.
    
    Args:
        username: Username to check
        
    Returns:
        True if username exists, False otherwise
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
            return row is not None
    except Exception:
        return False


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


async def get_user_with_model(user_id: int) -> Optional[Any]:
    """
    Get user document and construct User model instance.
    
    Args:
        user_id: User's ID
        
    Returns:
        User model instance if found, None otherwise
    """
    from models.user import User
    
    user_doc = await find_user_by_id(user_id)
    if not user_doc:
        return None
    
    # Convert role_resources integer to permissions and role if available
    role_resources = user_doc.get("role_resources", 0)
    if role_resources:
        # Use role_resources to generate permissions and role
        permissions_data = permissions_from_int_with_admin(role_resources)
        user_doc["permissions"] = permissions_data["permissions"]
        user_doc["role"] = get_role_from_bits(role_resources)
    else:
        # Parse permissions JSON if it's a string (fallback)
        if isinstance(user_doc.get("permissions"), str):
            try:
                user_doc["permissions"] = json.loads(user_doc["permissions"])
            except (json.JSONDecodeError, TypeError):
                user_doc["permissions"] = []
    
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
    
    # Check role_resources first (new bit-based system)
    role_resources = user_doc.get("role_resources", 0)
    if role_resources:
        permissions_data = permissions_from_int_with_admin(role_resources)
        permissions = permissions_data["permissions"]
    else:
        # Fallback to old permissions field
        permissions = user_doc.get("permissions", [])
        if isinstance(permissions, str):
            try:
                permissions = json.loads(permissions)
            except (json.JSONDecodeError, TypeError):
                permissions = []
    
    return any(p.get("resource") == required_resource for p in permissions)


async def find_users_by_query(query: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Find users by a custom query.
    Note: This function supports basic queries. Complex MongoDB-style queries 
    need to be converted to SQL format when calling this function.
    
    Args:
        query: Dictionary containing search criteria (simple key-value pairs)
        
    Returns:
        List of user documents
    """
    try:
        if not query:
            return await find_all_users()
        
        # Build WHERE clause from query dictionary
        where_clauses = []
        values = []
        param_count = 1
        
        for key, value in query.items():
            if key in ["id", "username", "email", "role"]:
                where_clauses.append(f"{key} = ${param_count}")
                values.append(value)
                param_count += 1
        
        if not where_clauses:
            return await find_all_users()
        
        sql_query = f"SELECT id, username, email, password, role, permissions, role_resources, created_at, updated_at FROM users WHERE {' AND '.join(where_clauses)} ORDER BY created_at DESC"
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql_query, *values)
            return [dict(row) for row in rows]
    except Exception:
        return []


def get_role_from_bits(permission_int):
    """
    Get user role from permission bits.
    
    Bit mapping:
    - 11th bit (position 10): admin
    - 12th bit (position 11): superadmin
    
    Args:
        permission_int: Integer representing permission bits
        
    Returns:
        String role: "superadmin", "admin", or "user"
    """
    # Bit positions (0-indexed for bitwise operations)
    ADMIN_BIT = 10      # 11th bit (position 10)
    SUPERADMIN_BIT = 11 # 12th bit (position 11)
    
    if permission_int & (1 << SUPERADMIN_BIT):
        return "superadmin"
    elif permission_int & (1 << ADMIN_BIT):
        return "admin"
    else:
        return "user"


def create_bitfield_from_permissions(role, permissions_list):
    """
    Convert role and permissions list to integer bitfield format.
    
    Args:
        role: String role ("user", "admin", "superadmin")
        permissions_list: List of permission dictionaries with resource and actions
        
    Returns:
        Integer representing the bitfield
    """
    resources = [
        "news",
        "business",
        "fssai-verification",
        "verification-mini",
        "verification-lite",
        "verification-advanced"
    ]
    
    ADMIN_BIT = 10      # 11th bit (index 10)
    SUPERADMIN_BIT = 11 # 12th bit (index 11)
    
    bitfield = 0
    
    # Set bits for resources where action 'view' is present
    for perm in permissions_list:
        resource = perm.get("resource")
        actions = perm.get("actions", [])
        if "view" in actions and resource in resources:
            index = resources.index(resource)
            bitfield |= (1 << index)
    
    # Set role bits
    if role == "admin":
        bitfield |= (1 << ADMIN_BIT)
    elif role == "superadmin":
        bitfield |= (1 << SUPERADMIN_BIT)
    
    return bitfield


def permissions_from_int_with_admin(permission_int):
    """
    Convert integer-based role resources to permissions format.
    
    Bit mapping (1-indexed as specified):
    - 1st bit (position 0): news:view
    - 2nd bit (position 1): business:view  
    - 3rd bit (position 2): fssai-verification:view
    - 4th bit (position 3): verification-mini:view
    - 5th bit (position 4): verification-lite:view
    - 6th bit (position 5): verification-advanced:view
    - 11th bit (position 10): admin
    - 12th bit (position 11): superadmin
    
    Args:
        permission_int: Integer representing permission bits
        
    Returns:
        Dictionary with permissions list
    """
    resources = [
        "news",                    # 1st bit (position 0)
        "business",               # 2nd bit (position 1) 
        "fssai-verification",     # 3rd bit (position 2)
        "verification-mini",      # 4th bit (position 3)
        "verification-lite",      # 5th bit (position 4)
        "verification-advanced"   # 6th bit (position 5)
    ]
    
    # Bit positions (0-indexed for bitwise operations)
    ADMIN_BIT = 10      # 11th bit (position 10)
    SUPERADMIN_BIT = 11 # 12th bit (position 11)
    
    # Check admin or superadmin bits
    is_admin = bool(permission_int & (1 << ADMIN_BIT))
    is_superadmin = bool(permission_int & (1 << SUPERADMIN_BIT))
    
    permissions = []
    if is_admin or is_superadmin:
        # Grant all permissions
        for resource in resources:
            permissions.append({"resource": resource, "actions": ["view"]})
    else:
        # Grant only user permissions from bits 1-6 (positions 0-5)
        for i, resource in enumerate(resources):
            if permission_int & (1 << i):
                permissions.append({"resource": resource, "actions": ["view"]})
    
    return {"permissions": permissions}


async def update_user_permissions(user_id: int, permissions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Update user permissions.
    
    Args:
        user_id: User's ID
        permissions: List of permission dictionaries
        
    Returns:
        Updated user document if successful, None otherwise
    """
    try:
        now = datetime.now(timezone.utc)
        permissions_json = json.dumps(permissions)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE users 
                SET permissions = $1, updated_at = $2 
                WHERE id = $3 
                RETURNING id, username, email, password, role, permissions, role_resources, created_at, updated_at
                """,
                permissions_json,
                now,
                user_id
            )
            if row:
                return dict(row)
            return None
    except Exception:
        return None