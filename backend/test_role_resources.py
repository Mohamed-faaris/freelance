#!/usr/bin/env python3
"""
Test script for roleResources field, permissions_from_int_with_admin function, and get_role_from_bits function.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.dbCalls.user_db import permissions_from_int_with_admin, get_role_from_bits, create_bitfield_from_permissions


def test_permissions_conversion():
    """Test the permissions_from_int_with_admin function with various bit patterns."""
    
    print("=== Testing roleResources to Permissions Conversion ===\n")
    
    # Test cases with different bit patterns
    test_cases = [
        {
            "name": "No permissions (0)",
            "value": 0,
            "expected_permissions": [],
            "expected_role": "user"
        },
        {
            "name": "1st bit - News only",
            "value": 1,  # 0b000000000001 (1st bit)
            "expected_permissions": ["news"],
            "expected_role": "user"
        },
        {
            "name": "2nd bit - Business only", 
            "value": 2,  # 0b000000000010 (2nd bit)
            "expected_permissions": ["business"],
            "expected_role": "user"
        },
        {
            "name": "3rd bit - FSSAI verification",
            "value": 4,  # 0b000000000100 (3rd bit)
            "expected_permissions": ["fssai-verification"],
            "expected_role": "user"
        },
        {
            "name": "4th bit - Verification mini",
            "value": 8,  # 0b000000001000 (4th bit)
            "expected_permissions": ["verification-mini"],
            "expected_role": "user"
        },
        {
            "name": "5th bit - Verification lite",
            "value": 16,  # 0b000000010000 (5th bit)
            "expected_permissions": ["verification-lite"],
            "expected_role": "user"
        },
        {
            "name": "6th bit - Verification advanced",
            "value": 32,  # 0b000000100000 (6th bit)
            "expected_permissions": ["verification-advanced"],
            "expected_role": "user"
        },
        {
            "name": "Multiple resources (bits 1,2,3)",
            "value": 7,  # 0b000000000111 (1st, 2nd, 3rd bits)
            "expected_permissions": ["news", "business", "fssai-verification"],
            "expected_role": "user"
        },
        {
            "name": "All user permissions (bits 1-6)",
            "value": 63,  # 0b000000111111 (bits 1-6)
            "expected_permissions": ["news", "business", "fssai-verification", "verification-mini", "verification-lite", "verification-advanced"],
            "expected_role": "user"
        },
        {
            "name": "11th bit - Admin role",
            "value": 1024,  # 0b010000000000 (11th bit)
            "expected_permissions": ["news", "business", "fssai-verification", "verification-mini", "verification-lite", "verification-advanced"],
            "expected_role": "admin"
        },
        {
            "name": "12th bit - Superadmin role",
            "value": 2048,  # 0b100000000000 (12th bit)
            "expected_permissions": ["news", "business", "fssai-verification", "verification-mini", "verification-lite", "verification-advanced"],
            "expected_role": "superadmin"
        },
        {
            "name": "Admin + some user bits",
            "value": 1027,  # 0b010000000011 (11th bit + 1st + 2nd bits)
            "expected_permissions": ["news", "business", "fssai-verification", "verification-mini", "verification-lite", "verification-advanced"],
            "expected_role": "admin"
        },
        {
            "name": "All bits set (4095)",
            "value": 4095,  # 0b111111111111 (all 12 bits)
            "expected_permissions": ["news", "business", "fssai-verification", "verification-mini", "verification-lite", "verification-advanced"],
            "expected_role": "superadmin"
        }
    ]
    
    for test_case in test_cases:
        print(f"Testing: {test_case['name']}")
        print(f"Input value: {test_case['value']} (binary: {bin(test_case['value'])})")
        
        # Test permissions
        result = permissions_from_int_with_admin(test_case['value'])
        actual_resources = [p["resource"] for p in result["permissions"]]
        
        print(f"Expected resources: {test_case['expected_permissions']}")
        print(f"Actual resources: {actual_resources}")
        
        # Test role
        actual_role = get_role_from_bits(test_case['value'])
        print(f"Expected role: {test_case['expected_role']}")
        print(f"Actual role: {actual_role}")
        
        # Check if all expected resources and role are correct
        permissions_success = set(actual_resources) == set(test_case['expected_permissions'])
        role_success = actual_role == test_case['expected_role']
        success = permissions_success and role_success
        
        print(f"Permissions: {'✅ PASS' if permissions_success else '❌ FAIL'}")
        print(f"Role: {'✅ PASS' if role_success else '❌ FAIL'}")
        print(f"Overall: {'✅ PASS' if success else '❌ FAIL'}")
        print("-" * 50)
    
    print("\n=== Bit Position Reference ===")
    resources = [
        ("1st bit (position 0)", "news"),
        ("2nd bit (position 1)", "business"), 
        ("3rd bit (position 2)", "fssai-verification"),
        ("4th bit (position 3)", "verification-mini"),
        ("5th bit (position 4)", "verification-lite"),
        ("6th bit (position 5)", "verification-advanced")
    ]
    
    for bit_desc, resource in resources:
        print(f"{bit_desc}: {resource}:view")
    
    print("11th bit (position 10): admin")
    print("12th bit (position 11): superadmin")
    print("\n=== Test Complete ===")


if __name__ == "__main__":
    test_permissions_conversion()