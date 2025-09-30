from pydantic import BaseModel
from typing import List, Optional

# Serialization for new User model
def userEntity(item) -> dict:
    import json
    from utils.dbCalls.user_db import permissions_from_int_with_admin, get_role_from_bits
    
    # Prioritize role_resources over permissions field
    role_resources = item.get("role_resources", 0)
    if role_resources:
        # Use role_resources to generate permissions and role
        permissions_data = permissions_from_int_with_admin(role_resources)
        permissions = permissions_data["permissions"]
        role = get_role_from_bits(role_resources)
    else:
        # Handle permissions - could be JSON string or list (fallback)
        permissions = item.get("permissions", [])
        if isinstance(permissions, str):
            try:
                permissions = json.loads(permissions)
            except (json.JSONDecodeError, TypeError):
                permissions = []
        role = item.get("role", "user")
    
    return {
        "id": str(item["id"]),
        "_id": str(item["id"]),  # Keep for backwards compatibility
        "username": item.get("username"),
        "email": item.get("email"),
        "password": item.get("password"),
        "role": role,
        "permissions": [
            {
                "resource": perm.get("resource"),
                "actions": perm.get("actions", ["view"])
            } for perm in permissions
        ],
        "roleResources": item.get("role_resources", 0),
        "createdAt": item.get("created_at") or item.get("createdAt"),
        "updatedAt": item.get("updated_at") or item.get("updatedAt"),
    }

def usersEntity(entity) -> list:
    return [userEntity(item) for item in entity]

#Best way - Updated for PostgreSQL
def serializeDict(a) -> dict:
    import json
    from datetime import datetime
    
    if not a:
        return {}
    
    result = {}
    for key, value in a.items():
        if key == 'id':
            result['id'] = str(value)
            result['_id'] = str(value)  # Keep for backwards compatibility
        elif key == 'permissions' and isinstance(value, str):
            # Parse JSON string permissions
            try:
                result[key] = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                result[key] = []
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    
    return result

def serializeList(entity) -> list:
    return [serializeDict(a) for a in entity]

class PermissionQuery(BaseModel):
    role: Optional[str] = None
    resource: Optional[str] = None
    userId: Optional[str] = None

class UpdatePermissionsRequest(BaseModel):
    userId: str
    permissions: List[dict]  # List of permission objects
    updatedBy: str

class PermissionResponse(BaseModel):
    permissions: List[dict]

class UpdatePermissionsResponse(BaseModel):
    message: str
    user: dict