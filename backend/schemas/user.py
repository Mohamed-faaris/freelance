from pydantic import BaseModel
from typing import List, Optional

# Serialization for new User model
def userEntity(item) -> dict:
    return {
        "id": str(item["_id"]),
        "username": item.get("username"),
        "email": item.get("email"),
        "password": item.get("password"),
        "role": item.get("role", "admin"),
        "permissions": [
            {
                "resource": perm.get("resource"),
                "actions": perm.get("actions", ["view"])
            } for perm in item.get("permissions", [])
        ],
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }

def usersEntity(entity) -> list:
    return [userEntity(item) for item in entity]

#Best way
def serializeDict(a) -> dict:
    if hasattr(a, "to_dict"):
        return a.to_dict()
    if isinstance(a, dict):
        return {
            **{i: str(a[i]) for i in a if i == '_id'},
            **{i: a[i] for i in a if i != '_id'}
        }
    raise TypeError("Unsupported type for serialization")

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