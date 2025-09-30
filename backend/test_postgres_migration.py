#!/usr/bin/env python3
"""
Test script to verify that the PostgreSQL conversion works correctly.
This tests the main authentication functionality.
"""

import asyncio
import httpx
import json

async def test_auth_endpoints():
    """Test authentication endpoints after PostgreSQL migration."""
    base_url = "http://localhost:8000/api"
    
    async with httpx.AsyncClient() as client:
        print("🧪 Testing PostgreSQL Migration - Auth Endpoints")
        print("=" * 50)
        
        # Test 1: Check if server is running
        try:
            response = await client.get(f"{base_url}/")
            print(f"✅ Server is running: {response.status_code}")
        except Exception as e:
            print(f"❌ Server not running: {e}")
            return
        
        # Test 2: Register a new user (if not exists)
        test_user = {
            "username": "testuser_pg",
            "email": "testuser_pg@example.com",
            "password": "testpassword123"
        }
        
        try:
            response = await client.post(f"{base_url}/auth/register", json=test_user)
            if response.status_code == 200:
                print("✅ User registration successful")
                reg_data = response.json()
                print(f"   User ID: {reg_data.get('user', {}).get('id')}")
            elif response.status_code == 400:
                print("ℹ️  User already exists (expected)")
            else:
                print(f"❌ Registration failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Registration error: {e}")
        
        # Test 3: Login with the user
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        try:
            response = await client.post(f"{base_url}/auth/", json=login_data)
            if response.status_code == 200:
                print("✅ Login successful")
                login_result = response.json()
                user_data = login_result.get('user', {})
                print(f"   User ID: {user_data.get('id')}")
                print(f"   Username: {user_data.get('username')}")
                print(f"   Email: {user_data.get('email')}")
                print(f"   Role: {user_data.get('role')}")
                
                # Store cookies for authenticated requests
                cookies = response.cookies
                
                # Test 4: Get current user (authenticated request)
                response = await client.get(f"{base_url}/auth/", cookies=cookies)
                if response.status_code == 200:
                    print("✅ Authenticated user retrieval successful")
                    current_user = response.json()
                    print(f"   Current user ID: {current_user.get('user', {}).get('id')}")
                else:
                    print(f"❌ Failed to get current user: {response.status_code}")
                
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Login error: {e}")
        
        print("\n🎉 PostgreSQL migration test completed!")
        print("\nIf all tests passed, your MongoDB to PostgreSQL migration is working correctly!")

if __name__ == "__main__":
    asyncio.run(test_auth_endpoints())