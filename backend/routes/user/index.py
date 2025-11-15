from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from schemas.user import serializeDict, serializeList
from utils.dbCalls.user_db import (
    find_all_users,
    create_user,
    find_user_by_id,
    update_user,
    delete_user,
    check_email_exists,
    check_username_exists
)
from datetime import datetime, timezone

userRoute = APIRouter()

# Local request models to avoid importing from models
class Permission(BaseModel):
    resource: str
    actions: List[str]

class UserCreate(BaseModel):
    username: str
    email: str
    role: Optional[str] = "user"
    permissions: Optional[List[Permission]] = []

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[Permission]] = None




@userRoute.get("")
async def get_all_users():
    users = await find_all_users()
    return {"users": serializeList(users)}




@userRoute.post("")
async def create_new_user(user: UserCreate):
    try:
        # Check uniqueness before creating
        if await check_username_exists(user.username):
            raise HTTPException(status_code=400, detail="Username already exists")
        
        if await check_email_exists(user.email):
            raise HTTPException(status_code=400, detail="Email already exists")
        
        user_dict = user.model_dump()
        created_user = await create_user(user_dict)
        return {"user": serializeDict(created_user)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@userRoute.put("/{id}")
async def update_existing_user(id, user: UserUpdate):
    # Get existing user
    existing_user = await find_user_by_id(int(id))
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    user_dict = user.model_dump(exclude_unset=True)  # Only include fields that were provided
    
    # Update user
    updated_user = await update_user(int(id), user_dict)
    return {"user": serializeDict(updated_user)}


@userRoute.delete("/{id}")
async def delete_existing_user(id):
    deleted_user = await delete_user(int(id))
    return serializeDict(deleted_user)
