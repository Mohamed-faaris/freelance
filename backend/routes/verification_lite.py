from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime
from models.user import User
from services.authService import auth_service
from utils.api_tracking import track_external_api_call
from utils.auth import get_authenticated_user
import os
import requests
import asyncio
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_env(name: str, default: Optional[str] = None, *, required: bool = False) -> Optional[str]:
    """Fetch environment variable with whitespace trimming and optional requirement."""
    value = os.getenv(name)
    if value is not None:
        value = value.strip()
        if value:
            return value
    if default is not None:
        return default
    if required:
        raise ValueError(f"{name} environment variable is required")
    return value


verificationLiteRouter = APIRouter()

async def _verify_pan_plus(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V2}/verification/pan-plus?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

# Environment variables with validation
JWT_SECRET = get_env("JWT_SECRET", required=True)
CLIENT_SECRET = get_env("CLIENT_SECRET", required=True)
AUTH_SERVICE_URL = get_env("AUTH_SERVICE_URL", "https://auth.deepvue.tech")
AUTH_SERVICE_CLIENT_ID = get_env("AUTH_SERVICE_CLIENT_ID", required=True)
AUTH_SERVICE_CLIENT_SECRET = get_env("AUTH_SERVICE_CLIENT_SECRET", required=True)

# API Configuration
BASE_URL_V1 = get_env("BASE_URL_V1", "https://production.deepvue.tech/v1")
BASE_URL_V2 = get_env("BASE_URL_V2", "https://production.deepvue.tech/v2")

# Additional environment variables
LOG_LEVEL = get_env("LOG_LEVEL", "INFO")
ENABLE_ANALYTICS_TRACKING = get_env("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# Production limits for lite version
PRODUCTION_LIMITS = {
    "API_TIMEOUT": 8000,  # 8 second timeout for individual APIs
    "TOTAL_TIMEOUT": 20000,  # 20 second total timeout
}

class VerificationLiteRequest(BaseModel):
    name: str
    mobile_number: str
    aadhaar_number: Optional[str] = None
    pan_number: str

async def fetch_with_timeout(url: str, headers: dict, timeout: int = PRODUCTION_LIMITS["API_TIMEOUT"]):
    """Fetch with timeout protection using requests in a thread"""
    def _sync_request():
        response = requests.get(url, headers=headers, timeout=timeout / 1000)  # Convert ms to seconds
        response.raise_for_status()
        return response.json()

    return await asyncio.to_thread(_sync_request)

@verificationLiteRouter.post("/verification-lite")
async def verification_lite(request: Request, data: VerificationLiteRequest):
    start_time = datetime.now()
    print(f"Starting lite verification for user with PAN: {data.pan_number[:4]}****")

    try:
        # Get user
        try:
            user_doc = await get_authenticated_user(request)
        except HTTPException as auth_error:
            if auth_error.status_code == 401:
                print("Authentication failed for lite verification request")
            raise

        user = User.model_validate(user_doc)
        user_uuid = user_doc.get("_id") or user_doc.get("id")
        if not user_uuid:
            print(f"Authenticated user missing identifier: {user_doc}")
            raise HTTPException(status_code=500, detail="User identifier missing")
        print(f"Authenticated user: {user.username} (Role: {user.role})")

        # Define API calls with priorities for lite version
        priority_api_calls = [
            {
                "name": "PAN Plus",
                "call": lambda: fetch_pan_plus(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/pan-plus",
                "priority": "HIGH",
            },
            {
                "name": "Mobile to Name",
                "call": lambda: fetch_mobile_to_name(data.mobile_number, str(user_uuid), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-name",
                "priority": "HIGH",
            },
            {
                "name": "PAN to UAN",
                "call": lambda: fetch_pan_to_uan(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/epfo/pan-to-uan",
                "priority": "HIGH",
            },
        ]

        secondary_api_calls = [
            {
                "name": "Mobile Network Details",
                "call": lambda: fetch_mobile_network_details(data.mobile_number, str(user_uuid), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-network-details",
                "priority": "MEDIUM",
            },
            {
                "name": "PAN to Father Name",
                "call": lambda: fetch_pan_to_father_name(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/pan-to-fathername",
                "priority": "MEDIUM",
            },
            {
                "name": "PAN KRA Status",
                "call": lambda: fetch_pan_kra_status(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/pan-kra-status",
                "priority": "MEDIUM",
            },
        ]

        additional_api_calls = [
            {
                "name": "Mobile to Digital Age",
                "call": lambda: fetch_mobile_to_digital_age(data.mobile_number, str(user_uuid), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-digital-age",
                "priority": "LOW",
            },
            {
                "name": "Mobile to Multiple UPI",
                "call": lambda: fetch_mobile_to_multiple_upi(data.mobile_number, str(user_uuid), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-multiple-upi",
                "priority": "LOW",
            },
        ]

        # Execute priority APIs
        print("Executing priority API calls for lite verification...")
        priority_results = await asyncio.gather(
            *[api["call"]() for api in priority_api_calls],
            return_exceptions=True
        )

        priority_responses = []
        for i, result in enumerate(priority_results):
            api = priority_api_calls[i]
            if isinstance(result, Exception):
                priority_responses.append({
                    "name": api["name"],
                    "endpoint": api["endpoint"],
                    "error": str(result)
                })
            else:
                priority_responses.append({
                    "name": api["name"],
                    "endpoint": api["endpoint"],
                    "response": result
                })

        # Check remaining time for secondary calls
        remaining_time = PRODUCTION_LIMITS["TOTAL_TIMEOUT"] - (datetime.now() - start_time).total_seconds() * 1000

        secondary_responses = []
        if remaining_time > 10000:  # At least 10 seconds remaining for lite version
            print("Executing secondary API calls for lite verification...")
            secondary_results = await asyncio.gather(
                *[api["call"]() for api in secondary_api_calls],
                return_exceptions=True
            )

            for i, result in enumerate(secondary_results):
                api = secondary_api_calls[i]
                if isinstance(result, Exception):
                    secondary_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "error": str(result)
                    })
                else:
                    secondary_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "response": result
                    })

        # Check time for additional calls
        remaining_time2 = PRODUCTION_LIMITS["TOTAL_TIMEOUT"] - (datetime.now() - start_time).total_seconds() * 1000

        additional_responses = []
        if remaining_time2 > 8000:  # At least 8 seconds remaining
            print("Executing additional API calls for lite verification...")
            additional_results = await asyncio.gather(
                *[api["call"]() for api in additional_api_calls],
                return_exceptions=True
            )

            for i, result in enumerate(additional_results):
                api = additional_api_calls[i]
                if isinstance(result, Exception):
                    additional_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "error": str(result)
                    })
                else:
                    additional_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "response": result
                    })

        # Combine all responses
        all_responses = priority_responses + secondary_responses + additional_responses

        # Process conditional additional API calls if time permits
        conditional_api_calls = []
        remaining_time3 = PRODUCTION_LIMITS["TOTAL_TIMEOUT"] - (datetime.now() - start_time).total_seconds() * 1000

        if remaining_time3 > 6000:
            # Extract UAN for employment history
            uan_response = next((r for r in all_responses if r["name"] == "PAN to UAN"), None)
            uan_number = uan_response.get("response", {}).get("data", {}).get("uan_number") if uan_response else None

            if uan_number:
                conditional_api_calls.append({
                    "name": "UAN Employment History",
                    "call": lambda: fetch_uan_employment_history(uan_number, str(user_uuid), user.username, user.role),
                    "endpoint": "verification/epfo/uan-to-employment-history",
                })

            # Add PAN MSME Check
            conditional_api_calls.append({
                "name": "PAN MSME Check",
                "call": lambda: fetch_pan_msme_check(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/pan-msme-check",
            })

        # Execute conditional calls
        conditional_responses = []
        if conditional_api_calls and remaining_time3 > 4000:
            conditional_results = await asyncio.gather(
                *[api["call"]() for api in conditional_api_calls],
                return_exceptions=True
            )

            for i, result in enumerate(conditional_results):
                api = conditional_api_calls[i]
                if isinstance(result, Exception):
                    conditional_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "error": str(result)
                    })
                else:
                    conditional_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "response": result
                    })

        # Process comprehensive profile
        comprehensive_profile = process_lite_profile_data({
            "input": {
                "name": data.name,
                "mobile_number": data.mobile_number,
                "aadhaar_number": data.aadhaar_number,
                "pan_number": data.pan_number
            },
            "initial_responses": all_responses,
            "additional_responses": conditional_responses,
        })

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Add processing metadata
        comprehensive_profile["processingInfo"] = {
            "processingTimeMs": processing_time,
            "priorityApisCalled": len(priority_responses),
            "secondaryApisCalled": len(secondary_responses),
            "additionalApisCalled": len(additional_responses),
            "conditionalApisCalled": len(conditional_responses),
            "totalApisCalled": len(all_responses) + len(conditional_responses),
            "productionOptimized": True,
            "timeoutsPrevented": True,
        }

        print(f"Lite profile generation completed in {processing_time}ms with {len(all_responses) + len(conditional_responses)} API calls")

        return comprehensive_profile

    except Exception as error:
        print(f"Error in lite profile generation: {error}")
        raise HTTPException(status_code=500, detail="Failed to generate lite profile")

def process_lite_profile_data(data):
    """Process and combine API responses into comprehensive lite profile"""
    input_data = data["input"]
    initial_responses = data["initial_responses"]
    additional_responses = data["additional_responses"]

    profile_data = {
        "input": input_data,
        "identityInfo": {},
        "contactInfo": {},
        "personalInfo": {},
        "employmentInfo": {},
        "businessInfo": {},
        "bankingInfo": {},
        "digitalInfo": {},
    }

    try:
        # Personal Information Processing
        pan_plus_response = next((r for r in initial_responses if r["name"] == "PAN Plus"), {}).get("response", {}).get("data")
        pan_to_father_name_response = next((r for r in initial_responses if r["name"] == "PAN to Father Name"), {}).get("response", {}).get("data")

        print(f"PAN Plus Data used for lite profile: {pan_plus_response}")

        profile_data["personalInfo"] = {
            "fullName": pan_plus_response.get("full_name") if pan_plus_response else input_data["name"],
            "gender": pan_plus_response.get("gender", "Not Available") if pan_plus_response else "Not Available",
            "dateOfBirth": pan_plus_response.get("dob", "Not Available") if pan_plus_response else "Not Available",
            "fatherName": pan_to_father_name_response.get("father_name", "Not Available") if pan_to_father_name_response else "Not Available",
            "category": pan_plus_response.get("category", "Not Available") if pan_plus_response else "Not Available",
            "aadhaarLinked": pan_plus_response.get("aadhaar_linked", False) if pan_plus_response else False,
        }

        # Contact Information
        mobile_to_name_response = next((r for r in initial_responses if r["name"] == "Mobile to Name"), {}).get("response", {}).get("data")
        network_details_response = next((r for r in initial_responses if r["name"] == "Mobile Network Details"), {}).get("response", {}).get("data")

        formatted_address = "Not Available"
        if pan_plus_response and pan_plus_response.get("address"):
            addr = pan_plus_response["address"]
            formatted_address = ", ".join(filter(None, [
                addr.get("line_1"),
                addr.get("line_2"),
                addr.get("street_name"),
                addr.get("city"),
                addr.get("state"),
                addr.get("zip"),
                addr.get("country"),
            ]))

        profile_data["contactInfo"] = {
            "mobileNumber": input_data["mobile_number"],
            "alternativeName": mobile_to_name_response.get("name", "Not Available") if mobile_to_name_response else "Not Available",
            "networkOperator": network_details_response.get("currentNetworkName", "Not Available") if network_details_response else "Not Available",
            "networkRegion": network_details_response.get("currentNetworkRegion", "Not Available") if network_details_response else "Not Available",
            "numberType": network_details_response.get("numberBillingType", "Not Available") if network_details_response else "Not Available",
            "address": formatted_address,
            "addressDetails": pan_plus_response.get("address", {}) if pan_plus_response else {},
            "email": pan_plus_response.get("email", "Not Available") if pan_plus_response else "Not Available",
            "phoneNumber": pan_plus_response.get("phone_number", "Not Available") if pan_plus_response else "Not Available",
        }

        # Digital Information
        mobile_to_digital_age_response = next((r for r in initial_responses if r["name"] == "Mobile to Digital Age"), {}).get("response", {}).get("data")
        mobile_to_upi_response = next((r for r in initial_responses if r["name"] == "Mobile to Multiple UPI"), {}).get("response", {}).get("data")

        profile_data["digitalInfo"] = {
            "digitalAge": mobile_to_digital_age_response.get("digitalAge", "Not Available") if mobile_to_digital_age_response else "Not Available",
            "upiIds": mobile_to_upi_response.get("vpas", []) if mobile_to_upi_response else [],
            "nameAtBank": mobile_to_upi_response.get("name_at_bank", "Not Available") if mobile_to_upi_response else "Not Available",
        }

        # Employment Information
        uan_response = next((r for r in initial_responses if r["name"] == "PAN to UAN"), {}).get("response", {}).get("data")
        employment_history_response = next((r for r in additional_responses if r["name"] == "UAN Employment History"), {}).get("response", {}).get("data")

        if uan_response and uan_response.get("uan_number"):
            profile_data["employmentInfo"] = {
                "uanNumber": uan_response["uan_number"],
                "employmentHistory": [
                    {
                        "companyName": job.get("establishment_name", "Not Available"),
                        "memberId": job.get("member_id", "Not Available"),
                        "dateOfJoining": job.get("date_of_joining", "Not Available"),
                        "dateOfExit": job.get("date_of_exit", "Not Available"),
                        "lastPFSubmitted": job.get("last_pf_submitted", "Not Available"),
                    }
                    for job in employment_history_response.get("employment_history", [])
                ] if employment_history_response else [],
            }

        # Business Information
        pan_msme_check_response = next((r for r in additional_responses if r["name"] == "PAN MSME Check"), {}).get("response", {}).get("data")

        if pan_msme_check_response:
            profile_data["businessInfo"] = {
                "msmeStatus": "Registered" if pan_msme_check_response.get("udyam_exists") else "Not Registered",
                "panDetails": pan_msme_check_response.get("pan_details", {}),
            }

        return profile_data

    except Exception as error:
        print(f"Error processing lite profile data: {error}")
        return profile_data

# API fetch functions for lite verification

async def fetch_pan_plus(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/pan-plus",
        _fetch_pan_plus, pan_number
    )

async def _fetch_pan_plus(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V2}/verification/pan-plus?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_mobile_to_name(mobile_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-name",
        _fetch_mobile_to_name, mobile_number
    )

async def _fetch_mobile_to_name(mobile_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/mobile-intelligence/mobile-to-name?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_mobile_network_details(mobile_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-network-details",
        _fetch_mobile_network_details, mobile_number
    )

async def _fetch_mobile_network_details(mobile_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/mobile-intelligence/mobile-to-network-details?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_mobile_to_digital_age(mobile_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-digital-age",
        _fetch_mobile_to_digital_age, mobile_number
    )

async def _fetch_mobile_to_digital_age(mobile_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/mobile-intelligence/mobile-to-digital-age?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_mobile_to_multiple_upi(mobile_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-multiple-upi",
        _fetch_mobile_to_multiple_upi, mobile_number
    )

async def _fetch_mobile_to_multiple_upi(mobile_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/mobile-intelligence/mobile-to-multiple-upi?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_pan_to_uan(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/epfo/pan-to-uan",
        _fetch_pan_to_uan, pan_number
    )

async def _fetch_pan_to_uan(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/verification/epfo/pan-to-uan?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_pan_kra_status(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/pan-kra-status",
        _fetch_pan_kra_status, pan_number
    )

async def _fetch_pan_kra_status(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/verification/pan-kra-status?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_pan_to_father_name(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/pan-to-fathername",
        _fetch_pan_to_father_name, pan_number
    )

async def _fetch_pan_to_father_name(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/verification/pan-to-fathername?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_uan_employment_history(uan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/epfo/uan-to-employment-history",
        _fetch_uan_employment_history, uan_number
    )

async def _fetch_uan_employment_history(uan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/verification/epfo/uan-to-employment-history?uan_number={uan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def fetch_pan_msme_check(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/pan-msme-check",
        _fetch_pan_msme_check, pan_number
    )

async def _fetch_pan_msme_check(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/verification/pan-msme-check?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)