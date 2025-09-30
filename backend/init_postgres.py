#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL migration.

This script initializes the PostgreSQL database connection and creates tables.
Run this script after setting up your PostgreSQL database.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def main():
    """Initialize the database and create tables."""
    try:
        from config.db import init_db, close_db
        
        print("Initializing PostgreSQL database...")
        await init_db()
        print("Database initialized successfully!")
        
        # Test a simple query
        from config.db import get_db_pool
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Test users table
            count = await conn.fetchval("SELECT COUNT(*) FROM users")
            print(f"Users table ready. Current count: {count}")
            
            # Test api_analytics table
            count = await conn.fetchval("SELECT COUNT(*) FROM api_analytics")
            print(f"API Analytics table ready. Current count: {count}")
        
        print("\n✅ PostgreSQL migration completed successfully!")
        print("\nNext steps:")
        print("1. Update your environment variables:")
        print("   - DATABASE_URL or individual DB_* variables")
        print("2. Run migration scripts if you have existing data")
        print("3. Update any code that references MongoDB ObjectId to use integer IDs")
        
        await close_db()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        print("\nPlease check:")
        print("1. PostgreSQL is running")
        print("2. Database connection parameters are correct")
        print("3. Database exists and user has proper permissions")

if __name__ == "__main__":
    asyncio.run(main())