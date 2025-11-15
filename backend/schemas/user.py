from pydantic import BaseModel
from typing import List, Optional

# Serialization for new User model
def userEntity(item) -> dict:
    # Use the already computed permissions and role from add_computed_fields_to_user_row
    permissions = item.get("permissions", [])
    role = item.get("role", "user")
    role_resources = item.get("role_resources", 0)
    
    return {
        "id": str(item["id"]),
        "username": item.get("username"),
        "email": item.get("email"),
        "role": role,  # Already computed from roleResources
        "permissions": permissions,  # Already computed from roleResources
        "roleResources": role_resources,
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