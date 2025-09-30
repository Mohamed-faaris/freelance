"""
Database Migration Script - MongoDB to PostgreSQL
This script helps migrate existing MongoDB data to PostgreSQL
"""

import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.orm import Session
from config.database import SessionLocal, engine, Base
from models.database_models import User as DBUser, APIAnalytics as DBAPIAnalytics
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection (old)
MONGODB_URI = "mongodb+srv://faaris:faaris3105!@cluster0.ep7mpqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

async def migrate_users():
    """Migrate users from MongoDB to PostgreSQL"""
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient(MONGODB_URI)
    mongo_db = mongo_client.freelance
    users_collection = mongo_db.users
    
    # Connect to PostgreSQL
    db = SessionLocal()
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Get all users from MongoDB
        mongo_users = await users_collection.find().to_list(length=None)
        
        print(f"Found {len(mongo_users)} users to migrate")
        
        for mongo_user in mongo_users:
            try:
                # Check if user already exists
                existing_user = db.query(DBUser).filter(DBUser.email == mongo_user["email"]).first()
                if existing_user:
                    print(f"User {mongo_user['email']} already exists, skipping")
                    continue
                
                # Create new PostgreSQL user
                pg_user = DBUser(
                    username=mongo_user["username"],
                    email=mongo_user["email"],
                    password=mongo_user["password"],  # Already hashed
                    role=mongo_user.get("role", "user"),
                    permissions=mongo_user.get("permissions", [{"resource": "news", "actions": ["view"]}]),
                    created_at=mongo_user.get("createdAt", datetime.utcnow()),
                    updated_at=mongo_user.get("updatedAt", datetime.utcnow())
                )
                
                db.add(pg_user)
                db.commit()
                db.refresh(pg_user)
                
                print(f"Migrated user: {mongo_user['email']} -> {pg_user.uuid}")
                
            except Exception as e:
                print(f"Failed to migrate user {mongo_user.get('email', 'unknown')}: {e}")
                db.rollback()
                continue
        
        print("User migration completed")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()
        mongo_client.close()

async def migrate_analytics():
    """Migrate analytics data from MongoDB to PostgreSQL"""
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient(MONGODB_URI)
    mongo_db = mongo_client.freelance
    analytics_collection = mongo_db.api_analytics
    
    # Connect to PostgreSQL
    db = SessionLocal()
    
    try:
        # Get all analytics from MongoDB
        mongo_analytics = await analytics_collection.find().to_list(length=None)
        
        print(f"Found {len(mongo_analytics)} analytics records to migrate")
        
        for mongo_record in mongo_analytics:
            try:
                # Find corresponding user in PostgreSQL
                user_email = mongo_record.get("user_email")  # Assuming you have this field
                if not user_email:
                    print(f"Skipping analytics record without user_email")
                    continue
                
                pg_user = db.query(DBUser).filter(DBUser.email == user_email).first()
                if not pg_user:
                    print(f"User not found for analytics record: {user_email}")
                    continue
                
                # Create new PostgreSQL analytics record
                pg_analytics = DBAPIAnalytics(
                    user_id=pg_user.id,
                    endpoint=mongo_record.get("endpoint", ""),
                    method=mongo_record.get("method", "GET"),
                    status_code=mongo_record.get("status_code", 200),
                    response_time=mongo_record.get("response_time"),
                    ip_address=mongo_record.get("ip_address"),
                    user_agent=mongo_record.get("user_agent"),
                    request_data=mongo_record.get("request_data"),
                    response_data=mongo_record.get("response_data"),
                    error_message=mongo_record.get("error_message"),
                    created_at=mongo_record.get("createdAt", datetime.utcnow())
                )
                
                db.add(pg_analytics)
                db.commit()
                
                print(f"Migrated analytics record for user: {user_email}")
                
            except Exception as e:
                print(f"Failed to migrate analytics record: {e}")
                db.rollback()
                continue
        
        print("Analytics migration completed")
        
    except Exception as e:
        print(f"Analytics migration failed: {e}")
        db.rollback()
    finally:
        db.close()
        mongo_client.close()

async def main():
    """Main migration function"""
    print("Starting MongoDB to PostgreSQL migration...")
    
    # Migrate users first
    await migrate_users()
    
    # Then migrate analytics
    await migrate_analytics()
    
    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(main())