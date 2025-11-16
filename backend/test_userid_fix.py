#!/usr/bin/env python3
"""
Test JWT authentication with verification-business endpoint.
Verifies that userId is correctly extracted from JWT payload.
"""

import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

from utils.jwt_parser import validate_jwt_from_cookie

def test_jwt_userid_extraction():
    """Test that userId is correctly extracted from JWT"""
    
    token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkZmU5NDUwZC1mOGZiLTQyZTgtYmE4Ni1mYjI2OWE1YjdlNzUiLCJzZXNzaW9uSWQiOiJqd3QtMTc2MzMyMTI4NzkzMSIsInJvbGVJZCI6ImQzNjM1ZTRmLTNmNzQtNGJkYi04ZGExLTdkYjdjNTJmM2FjZCIsInBlcm1pc3Npb25CaXRzIjoiNjMiLCJvcmdJZCI6IjQ2MmNiN2UzLTdhMjMtNGExYi05MjU0LTZkNDQ3ODg0OGJiZiIsImlhdCI6MTc2MzMyMTI4NywiZXhwIjoxNzYzNDA3Njg3fQ.kWZMGW5cuUkLDMgSM78OEHbV9AdVUQq2zMQNVFm9Sqk"
    
    print("Testing JWT userId extraction")
    print("=" * 60)
    
    payload, is_valid, error = validate_jwt_from_cookie(token)
    
    if not is_valid:
        print(f"✗ Token validation FAILED: {error}")
        return False
    
    print("✓ Token validation PASSED")
    
    # Check userId field
    if "userId" in payload:
        print(f"✓ userId field present: {payload['userId']}")
    else:
        print(f"✗ userId field missing!")
        print(f"  Available fields: {list(payload.keys())}")
        return False
    
    # Check other expected fields
    expected_fields = ["sessionId", "roleId", "permissionBits", "iat", "exp"]
    for field in expected_fields:
        if field in payload:
            print(f"✓ {field} present")
        else:
            print(f"✗ {field} missing")
            return False
    
    print("\n✓ All required JWT fields present and accessible")
    return True

if __name__ == "__main__":
    import sys
    success = test_jwt_userid_extraction()
    sys.exit(0 if success else 1)
