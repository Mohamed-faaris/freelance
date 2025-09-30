#!/usr/bin/env python3
"""
Quick test for the permissions endpoint to verify the fix.
"""

import asyncio
import httpx

async def test_permissions_endpoint():
    """Test the permissions endpoint that was failing."""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Permissions Endpoint Fix")
        print("=" * 40)
        
        try:
            # Test the permissions endpoint that was failing
            response = await client.get("http://localhost:8000/api/users/permissions?userId=1")
            
            if response.status_code == 200:
                print("✅ Permissions endpoint working correctly!")
                data = response.json()
                print(f"   Response: {data}")
            elif response.status_code == 404:
                print("ℹ️  User ID 1 not found (expected if no user with ID 1)")
            else:
                print(f"❌ Permissions endpoint failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Request failed: {e}")

        try:
            # Test without userId parameter
            response = await client.get("http://localhost:8000/api/users/permissions")
            
            if response.status_code == 200:
                print("✅ Permissions endpoint (no userId) working correctly!")
                data = response.json()
                print(f"   Found {len(data.get('permissions', []))} permissions")
            else:
                print(f"❌ Permissions endpoint (no userId) failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_permissions_endpoint())