from fastapi import APIRouter
from models.user import User
from config.db import conn
from schemas.user import serializeDict, serializeList
from bson import ObjectId
from config.db import userCollection
from datetime import datetime

userRoute = APIRouter()


@userRoute.get("/")
async def find_all_users():
    return serializeList(userCollection.find())


# @user.get('/{id}')
# async def find_one_user(id):
#     return serializeDict(userCollection.find_one({"_id":ObjectId(id)}))


@userRoute.post("/")
async def create_user(user: User):
    user_dict = user.dict()
    userCollection.insert_one(user_dict)
    return serializeList(userCollection.find())


@userRoute.put("/{id}")
async def update_user(id, user: User):
    user_dict = user.dict()
    user_dict["updatedAt"] = datetime.utcnow()
    userCollection.find_one_and_update({"_id": ObjectId(id)}, {"$set": user_dict})
    return serializeDict(userCollection.find_one({"_id": ObjectId(id)}))


@userRoute.delete("/{id}")
async def delete_user(id, user: User):
    return serializeDict(userCollection.find_one_and_delete({"_id": ObjectId(id)}))
