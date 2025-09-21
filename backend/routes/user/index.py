from fastapi import APIRouter, HTTPException
from models.user import User, UserUpdate
from config.db import conn
from schemas.user import serializeDict, serializeList
from bson import ObjectId
from config.db import userCollection
from datetime import datetime, timezone

userRoute = APIRouter()




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
        return {"user": serializeDict(created_user)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@userRoute.put("/{id}")
async def update_user(id, user: UserUpdate):
    # Get existing user
    existing_user = await userCollection.find_one({"_id": ObjectId(id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_data = {}
    user_dict = user.model_dump(exclude_unset=True)  # Only include fields that were provided
    
    # Handle password hashing if provided
    if user_dict.get("password"):
        update_data["password"] = User.hash_password(user_dict["password"])
    
    # Add other fields that were provided
    for field, value in user_dict.items():
        if field != "password":  # Password already handled above
            update_data[field] = value
    
    # Always update the updatedAt timestamp
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    # Perform the update
    await userCollection.find_one_and_update(
        {"_id": ObjectId(id)}, 
        {"$set": update_data}
    )
    
    # Return the updated user
    updated_user = await userCollection.find_one({"_id": ObjectId(id)})
    return {"user": serializeDict(updated_user)}


@userRoute.delete("/{id}")
async def delete_user(id):
    deleted_user = await userCollection.find_one_and_delete({"_id": ObjectId(id)})
    return serializeDict(deleted_user)
