import os
import requests
from typing import Dict, Any
from fastapi import HTTPException
from services.authService import auth_service

BASE_URL = "https://production.deepvue.tech/v1"

async def verify_gstin_advanced(gstin_number: str) -> Dict[str, Any]:
    """
    Verify GSTIN using advanced verification service.

    Args:
        gstin_number: 15-digit GSTIN number

    Returns:
        Verification response data

    Raises:
        Exception: If verification fails
    """
    try:
        access_token = await auth_service.get_access_token()

        url = f"{BASE_URL}/verification/gstin-advanced?gstin_number={gstin_number}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-api-key": os.getenv("CLIENT_SECRET", ""),
        }

        response = requests.get(url, headers=headers, timeout=30)

        if not response.ok:
            raise Exception(f"GSTIN advanced verification failed: {response.status_code} - {response.text}")

        return response.json()

    except requests.exceptions.RequestException as req_error:
        raise Exception(f"Network error during GSTIN verification: {str(req_error)}")
    except Exception as error:
        raise Exception(f"GSTIN verification error: {str(error)}")

async def verify_gstin_lite(gstin_number: str) -> Dict[str, Any]:
    """
    Verify GSTIN using lite verification service.

    Args:
        gstin_number: 15-digit GSTIN number

    Returns:
        Verification response data
    """
    try:
        access_token = await auth_service.get_access_token()

        url = f"{BASE_URL}/verification/gstin-lite?gstin_number={gstin_number}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-api-key": os.getenv("CLIENT_SECRET", ""),
        }

        response = requests.get(url, headers=headers, timeout=30)

        if not response.ok:
            raise Exception(f"GSTIN lite verification failed: {response.status_code} - {response.text}")

        return response.json()

    except requests.exceptions.RequestException as req_error:
        raise Exception(f"Network error during GSTIN lite verification: {str(req_error)}")
    except Exception as error:
        raise Exception(f"GSTIN lite verification error: {str(error)}")

async def verify_gstin_mini(gstin_number: str) -> Dict[str, Any]:
    """
    Verify GSTIN using mini verification service.

    Args:
        gstin_number: 15-digit GSTIN number

    Returns:
        Verification response data
    """
    try:
        access_token = await auth_service.get_access_token()

        url = f"{BASE_URL}/verification/gstin-mini?gstin_number={gstin_number}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-api-key": os.getenv("CLIENT_SECRET", ""),
        }

        response = requests.get(url, headers=headers, timeout=30)

        if not response.ok:
            raise Exception(f"GSTIN mini verification failed: {response.status_code} - {response.text}")

        return response.json()

    except requests.exceptions.RequestException as req_error:
        raise Exception(f"Network error during GSTIN mini verification: {str(req_error)}")
    except Exception as error:
        raise Exception(f"GSTIN mini verification error: {str(error)}")

def validate_gstin_format(gstin: str) -> bool:
    """
    Validate GSTIN format (15-digit alphanumeric).

    Args:
        gstin: GSTIN number to validate

    Returns:
        True if valid format, False otherwise
    """
    if not gstin or len(gstin) != 15:
        return False

    # GSTIN format: 2 digits + 10 characters PAN + 1 entity code + 2 digits state code + Z + 4 digits
    # Basic format check - should be alphanumeric
    return gstin.isalnum()

def extract_gstin_info(gstin: str) -> Dict[str, str]:
    """
    Extract information from GSTIN.

    Args:
        gstin: GSTIN number

    Returns:
        Dictionary with extracted information
    """
    if not validate_gstin_format(gstin):
        return {}

    return {
        "state_code": gstin[:2],
        "pan": gstin[2:12],
        "entity_code": gstin[12],
        "state_code_2": gstin[13:15],
        "check_digit": gstin[15:] if len(gstin) > 15 else ""
    }