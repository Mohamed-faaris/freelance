#!/usr/bin/env python3
"""
Test JWT authentication with the provided token.
Verifies that the token can be decoded and validated with SKIP_JWT_VERIFICATION=true.
"""

import os
import sys

# Set environment variable for JWT verification
os.environ["SKIP_JWT_VERIFICATION"] = "true"
os.environ["JWT_SECRET"] = "your-super-secret-jwt-key-change-this-in-production"
os.environ["JWT_ALGORITHM"] = "HS256"

from utils.jwt_parser import validate_jwt_from_cookie

def test_jwt_validation():
    """Test JWT token validation and claims extraction"""
    
    # Token from the server logs
    token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkZmU5NDUwZC1mOGZiLTQyZTgtYmE4Ni1mYjI2OWE1YjdlNzUiLCJzZXNzaW9uSWQiOiJqd3QtMTc2MzMyMTI4NzkzMSIsInJvbGVJZCI6ImQzNjM1ZTRmLTNmNzQtNGJkYi04ZGExLTdkYjdjNTJmM2FjZCIsInBlcm1pc3Npb25CaXRzIjoiNjMiLCJvcmdJZCI6IjQ2MmNiN2UzLTdhMjMtNGExYi05MjU0LTZkNDQ3ODg0OGJiZiIsImlhdCI6MTc2MzMyMTI4NywiZXhwIjoxNzYzNDA3Njg3fQ.kWZMGW5cuUkLDMgSM78OEHbV9AdVUQq2zMQNVFm9Sqk"
    
    print("Testing JWT validation with SKIP_JWT_VERIFICATION=true")
    print("=" * 60)
    
    # Validate the token
    payload, is_valid, error = validate_jwt_from_cookie(token)
    
    if is_valid:
        print("✓ Token validation PASSED")
        print("\nExtracted JWT Claims:")
        print("-" * 60)
        for key, value in payload.items():
            print(f"  {key}: {value}")
        
        # Verify all required fields are present
        required_fields = ["userId", "sessionId", "roleId", "permissionBits", "iat", "exp"]
        missing = [f for f in required_fields if f not in payload]
        
        if not missing:
            print("\n✓ All required fields present")
            return True
        else:
            print(f"\n✗ Missing fields: {missing}")
            return False
    else:
        print(f"✗ Token validation FAILED: {error}")
        return False

if __name__ == "__main__":
    success = test_jwt_validation()
    sys.exit(0 if success else 1)
