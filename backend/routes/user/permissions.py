from fastapi import APIRouter, HTTPException, Query
from models.user import User
from config.db import userCollection
from schemas.user import userEntity, PermissionQuery, UpdatePermissionsRequest, PermissionResponse, UpdatePermissionsResponse
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

permissionsRoute = APIRouter()

@permissionsRoute.get("", response_model=PermissionResponse)
async def get_permissions(
    role: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    userId: Optional[str] = Query(None)
):
    try:
        # If a specific user is requested, return their permissions
        if userId:
            user = userCollection.find_one({"_id": ObjectId(userId)})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return PermissionResponse(permissions=user.get("permissions", []))

        # Fallback to role-based permissions if no user specified
        query = {}
        if role:
            query["role"] = role
        if resource:
            query["permissions.resource"] = resource

        # Get users matching the query
        users = list(userCollection.find(query))

        # Extract and flatten permissions
        all_permissions = []
        for user in users:
            user_perms = user.get("permissions", [])
            for perm in user_perms:
                if not resource or perm.get("resource") == resource:
                    all_permissions.append({
                        "userId": str(user["_id"]),
                        "username": user.get("username"),
                        "role": user.get("role"),
                        **perm
                    })

        return PermissionResponse(permissions=all_permissions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permissions: {str(e)}")


@permissionsRoute.post("/")
async def update_permissions(request: UpdatePermissionsRequest):
    try:
        # Validate required fields
        if not request.userId or not request.permissions or not request.updatedBy:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Update user permissions
        update_data = {
            "permissions": request.permissions,
            "updatedAt": datetime.now(timezone.utc)
        }

        updated_user = userCollection.find_one_and_update(
            {"_id": ObjectId(request.userId)},
            {"$set": update_data},
            return_document=True
        )

        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        return UpdatePermissionsResponse(
            message="Permissions updated successfully",
            user=userEntity(updated_user)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update permissions: {str(e)}")