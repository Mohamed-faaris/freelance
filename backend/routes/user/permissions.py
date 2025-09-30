from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.user import UpdatePermissionsRequest, PermissionResponse, UpdatePermissionsResponse
from datetime import datetime, timezone
from typing import Optional
from config.database import get_db
from models.database_models import User as UserModel

permissionsRoute = APIRouter()

@permissionsRoute.get("", response_model=PermissionResponse)
async def get_permissions(
    role: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        if userId:
            result = await db.execute(
                select(UserModel).where(UserModel.uuid == userId)
            )
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return PermissionResponse(permissions=user.permissions or [])

        stmt = select(UserModel)
        if role:
            stmt = stmt.where(UserModel.role == role)

        result = await db.execute(stmt)
        users = result.scalars().all()

        all_permissions = []
        for user in users:
            user_perms = user.permissions or []
            for perm in user_perms:
                if not resource or perm.get("resource") == resource:
                    all_permissions.append({
                        "userId": user.uuid,
                        "username": user.username,
                        "role": user.role,
                        **perm
                    })

        return PermissionResponse(permissions=all_permissions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permissions: {str(e)}")


@permissionsRoute.post("")
async def update_permissions(
    request: UpdatePermissionsRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        # Validate required fields
        if not request.userId or not request.permissions or not request.updatedBy:
            raise HTTPException(status_code=400, detail="Missing required fields")

        result = await db.execute(
            select(UserModel).where(UserModel.uuid == request.userId)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.permissions = request.permissions
        user.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        return UpdatePermissionsResponse(
            message="Permissions updated successfully",
            user=user.to_dict()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update permissions: {str(e)}")