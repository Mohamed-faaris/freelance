from fastapi import APIRouter, HTTPException, Query
from schemas.user import userEntity, PermissionQuery, UpdatePermissionsRequest, PermissionResponse, UpdatePermissionsResponse
from utils.dbCalls.user_db import find_user_by_id, find_users_by_query, update_user_role_resources, create_bitfield_from_permissions
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
            
            # Permissions are now always a list from add_computed_fields_to_user_row
            permissions = user.get("permissions", [])
            
            return PermissionResponse(permissions=permissions)

        # Fallback to role-based permissions if no user specified
        print("fallback to role-based permissions")
        
        # Get all users since we can't query by computed "role" field directly
        users = await find_all_users()

        # Filter users by role if specified, and extract permissions
        all_permissions = []
        for user in users:
            # Skip users that don't match the role filter
            if role and user.get("role") != role:
                continue
                
            user_perms = user.get("permissions", [])
            
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


        
        # Get current user to determine role
        current_user = await find_user_by_id(int(request.userId))
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get role from current role_resources or determine from permissions
        from utils.dbCalls.user_db import get_role_from_bits
        current_role = get_role_from_bits(current_user.get("role_resources", 0))
        
        # Convert permissions to bitfield
        role_resources = create_bitfield_from_permissions(current_role, request.permissions)
        
        # Update user role_resources
        updated_user = await update_user_role_resources(int(request.userId), role_resources)

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