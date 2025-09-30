from fastapi import APIRouter, HTTPException, Query
from schemas.user import userEntity, PermissionQuery, UpdatePermissionsRequest, PermissionResponse, UpdatePermissionsResponse
from utils.dbCalls.user_db import find_user_by_id, find_users_by_query, update_user_permissions
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
            user = await find_user_by_id(int(userId))
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Handle permissions - could be JSON string or list
            permissions = user.get("permissions", [])
            if isinstance(permissions, str):
                import json
                try:
                    permissions = json.loads(permissions)
                except (json.JSONDecodeError, TypeError):
                    permissions = []
            
            return PermissionResponse(permissions=permissions)

        # Fallback to role-based permissions if no user specified
        print("fallback to role-based permissions")
        query = {}
        if role:
            query["role"] = role
        # Note: PostgreSQL doesn't support MongoDB-style nested queries
        # We'll filter by resource after fetching the data

        # Get users matching the query
        users = await find_users_by_query(query)

        # Extract and flatten permissions
        all_permissions = []
        for user in users:
            user_perms = user.get("permissions", [])
            if isinstance(user_perms, str):
                import json
                try:
                    user_perms = json.loads(user_perms)
                except (json.JSONDecodeError, TypeError):
                    user_perms = []
            
            for perm in user_perms:
                if not resource or perm.get("resource") == resource:
                    all_permissions.append({
                        "userId": str(user["id"]),
                        "username": user.get("username"),
                        "role": user.get("role"),
                        **perm
                    })

        return PermissionResponse(permissions=all_permissions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permissions: {str(e)}")


@permissionsRoute.post("")
async def update_permissions(request: UpdatePermissionsRequest):
    try:
        # Validate required fields
        if not request.userId or not request.permissions or not request.updatedBy:
            raise HTTPException(status_code=400, detail="Missing required fields")


        
        # Update user permissions
        updated_user = await update_user_permissions(int(request.userId), request.permissions)

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