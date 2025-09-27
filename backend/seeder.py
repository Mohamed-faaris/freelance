
import motor.motor_asyncio
from datetime import datetime, UTC
import asyncio
import os
from dotenv import load_dotenv
from models.user import User

load_dotenv()

async def create_users():
    client = motor.motor_asyncio.AsyncIOMotorClient(
        os.getenv('MONGODB_URI')
    )
    db = client["Cluster0"]
    userCollection = db["users"]

    users = [
        {
            "username": "superadmin",
            "email": "superadmin@example.com",
            "password": User.hash_password("password123"),
            "role": "superadmin",
            "permissions": [{"resource": "news", "actions": ["view"]}],
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC)
        },
        {
            "username": "admin",
            "email": "admin@example.com",
            "password": User.hash_password("password123"),
            "role": "admin",
            "permissions": [{"resource": "news", "actions": ["view"]}],
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC)
        },
        {
            "username": "user",
            "email": "user@example.com",
            "password": User.hash_password("password123"),
            "role": "user",
            "permissions": [{"resource": "news", "actions": ["view"]}],
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC)
        }
    ]
    result = await userCollection.insert_many(users)
    print(f"Inserted users with ids: {result.inserted_ids}")

if __name__ == "__main__":
    asyncio.run(create_users())