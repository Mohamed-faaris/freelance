from fastapi import APIRouter, HTTPException
from models.user import User
from config.db import conn
from schemas.user import serializeDict, serializeList
from bson import ObjectId
from config.db import userCollection
from datetime import datetime, timezone
from .permissions import permissionsRoute

userRoute = APIRouter()

# Include permissions routes as a sub-router
userRoute.include_router(permissionsRoute, prefix="/permissions", tags=["permissions"])


@userRoute.get("")
async def find_all_users():
    users = await userCollection.find().to_list(length=None)
    return {"users": serializeList(users)}


# @user.get('/{id}')
# async def find_one_user(id):
#     return serializeDict(userCollection.find_one({"_id":ObjectId(id)}))


@userRoute.post("")
async def create_user(user: User):
    try:
        # Check uniqueness before creating
        existing_username = await userCollection.find_one({"username": user.username})
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        existing_email = await userCollection.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        now = datetime.now(timezone.utc)
        user_dict = user.model_dump()
        user_dict["password"] = User.hash_password(user_dict["password"])  # Hash the password
        user_dict["createdAt"] = now
        user_dict["updatedAt"] = now
        result = await userCollection.insert_one(user_dict)
        created_user = await userCollection.find_one({"_id": result.inserted_id})
        return serializeDict(created_user)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@userRoute.put("/{id}")
async def update_user(id, user: User):
    user_dict = user.model_dump()
    user_dict["updatedAt"] = datetime.now(timezone.utc)
    await userCollection.find_one_and_update({"_id": ObjectId(id)}, {"$set": user_dict})
    updated_user = await userCollection.find_one({"_id": ObjectId(id)})
    return serializeDict(updated_user)


@userRoute.delete("/{id}")
async def delete_user(id):
    deleted_user = await userCollection.find_one_and_delete({"_id": ObjectId(id)})
    return serializeDict(deleted_user)
