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


def get_env(name: str, default: str | None = None, *, required: bool = False) -> str | None:
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

verificationRouter = APIRouter()

# Environment variables with validation
JWT_SECRET = get_env("JWT_SECRET", required=True)
CLIENT_SECRET = get_env("CLIENT_SECRET", required=True)
AUTH_SERVICE_URL = get_env("AUTH_SERVICE_URL", "https://auth.deepvue.tech")
AUTH_SERVICE_CLIENT_ID = get_env("AUTH_SERVICE_CLIENT_ID", required=True)
AUTH_SERVICE_CLIENT_SECRET = get_env("AUTH_SERVICE_CLIENT_SECRET", required=True)

# Validate required environment variables
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

if not CLIENT_SECRET:
    raise ValueError("CLIENT_SECRET environment variable is required")

if not AUTH_SERVICE_CLIENT_ID:
    raise ValueError("AUTH_SERVICE_CLIENT_ID environment variable is required")

if not AUTH_SERVICE_CLIENT_SECRET:
    raise ValueError("AUTH_SERVICE_CLIENT_SECRET environment variable is required")

# API Configuration
BASE_URL_V1 = get_env("BASE_URL_V1", "https://production.deepvue.tech/v1")
BASE_URL_V2 = get_env("BASE_URL_V2", "https://production.deepvue.tech/v2")

# Additional environment variables
LOG_LEVEL = get_env("LOG_LEVEL", "INFO")
ENABLE_ANALYTICS_TRACKING = get_env("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"
VERIFICATION_CACHE_TTL = int(get_env("VERIFICATION_CACHE_TTL", "3600"))  # 1 hour default
print(f"verification_advanced loaded. BASE_URL_V1={BASE_URL_V1}, BASE_URL_V2={BASE_URL_V2}, ENABLE_ANALYTICS_TRACKING={ENABLE_ANALYTICS_TRACKING}")

# Production limits
PRODUCTION_LIMITS = {
    "API_TIMEOUT": 8000,  # 8 second timeout for individual APIs
    "TOTAL_TIMEOUT": 25000,  # 25 second total timeout
    "MAX_GSTIN_CALLS": 2,  # Limit GSTIN verification calls
}

class VerificationRequest(BaseModel):
    name: str
    mobile_number: str
    aadhaar_number: Optional[str] = None
    pan_number: str

async def fetch_with_timeout(url: str, headers: dict, timeout: int = PRODUCTION_LIMITS["API_TIMEOUT"]):
    """Fetch with timeout protection using requests in a thread"""
    def _sync_request():
        print(f"fetch_with_timeout: making GET {url} with timeout={timeout}ms")
        try:
            response = requests.get(url, headers=headers, timeout=timeout / 1000)  # Convert ms to seconds
            print(f"fetch_with_timeout: received status {response.status_code} for {url}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"fetch_with_timeout: request failed for {url}: {e}")
            raise
    
    return await asyncio.to_thread(_sync_request)

@verificationRouter.post("/verification-advanced")
async def verification_advanced(request: Request, data: VerificationRequest):
    start_time = datetime.now()
    print(f"Starting advanced verification for user with PAN: {data.pan_number[:4]}****")

    try:
        # Get user
        try:
            user_doc = await get_authenticated_user(request)
        except HTTPException as auth_error:
            if auth_error.status_code == 401:
                print("Authentication failed for verification request")
            raise
        user = User.model_validate(user_doc)
        user_uuid = user_doc.get("_id") or user_doc.get("id")
        if not user_uuid:
            print(f"Authenticated user missing identifier: {user_doc}")
            raise HTTPException(status_code=500, detail="User identifier missing")
        print(f"Authenticated user: {user.username} (Role: {user.role})")

        # Check permissions
        if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
            print(f"Insufficient permissions for user: {user.username}")
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        # Define API calls with priorities
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
        ]

        expensive_api_calls = [
            {
                "name": "Credit Report",
                "call": lambda: fetch_credit_score(data.name, data.pan_number, data.mobile_number, str(user_uuid), user.username, user.role),
                "endpoint": "financial-services/credit-bureau/credit-report",
                "priority": "LOW",
            },
        ]

        # Execute priority APIs
        print("Executing priority API calls...")
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
        if remaining_time > 12000:  # At least 12 seconds remaining
            print("Executing secondary API calls...")
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

        # Check time for expensive calls
        remaining_time2 = PRODUCTION_LIMITS["TOTAL_TIMEOUT"] - (datetime.now() - start_time).total_seconds() * 1000

        expensive_responses = []
        if remaining_time2 > 15000:  # At least 15 seconds for credit report
            print("Executing expensive API calls...")
            expensive_results = await asyncio.gather(
                *[api["call"]() for api in expensive_api_calls],
                return_exceptions=True
            )

            for i, result in enumerate(expensive_results):
                api = expensive_api_calls[i]
                if isinstance(result, Exception):
                    expensive_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "error": str(result)
                    })
                else:
                    expensive_responses.append({
                        "name": api["name"],
                        "endpoint": api["endpoint"],
                        "response": result
                    })

        # Combine all responses
        all_responses = priority_responses + secondary_responses + expensive_responses

        # Process additional API calls if time permits
        additional_api_calls = []
        remaining_time3 = PRODUCTION_LIMITS["TOTAL_TIMEOUT"] - (datetime.now() - start_time).total_seconds() * 1000

        if remaining_time3 > 8000:
            # Extract UAN for employment history
            uan_response = next((r for r in all_responses if r["name"] == "PAN to UAN"), None)
            uan_number = uan_response.get("response", {}).get("data", {}).get("uan_number") if uan_response else None

            if uan_number:
                additional_api_calls.append({
                    "name": "UAN Employment History",
                    "call": lambda: fetch_uan_employment_history(uan_number, str(user_uuid), user.username, user.role),
                    "endpoint": "verification/epfo/uan-to-employment-history",
                })

            # Add PAN MSME Check
            additional_api_calls.append({
                "name": "PAN MSME Check",
                "call": lambda: fetch_pan_msme_check(data.pan_number, str(user_uuid), user.username, user.role),
                "endpoint": "verification/pan-msme-check",
            })

        # Execute additional calls
        additional_responses = []
        if additional_api_calls and remaining_time3 > 6000:
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

        # Process profile data
        comprehensive_profile = process_profile_data({
            "input": data.dict(),
            "initial_responses": all_responses,
            "additional_responses": additional_responses,
        })

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Add processing metadata
        comprehensive_profile["processingInfo"] = {
            "processingTimeMs": processing_time,
            "priorityApisCalled": len(priority_responses),
            "secondaryApisCalled": len(secondary_responses),
            "expensiveApisCalled": len(expensive_responses),
            "additionalApisCalled": len(additional_responses),
            "totalApisCalled": len(all_responses) + len(additional_responses),
            "productionOptimized": True,
            "timeoutsPrevented": True,
        }

        print(f"Profile generation completed in {processing_time}ms with {len(all_responses) + len(additional_responses)} API calls")

        return comprehensive_profile

    except Exception as error:
        print(f"Error in comprehensive profile generation: {error}")
        raise HTTPException(status_code=500, detail="Failed to generate comprehensive profile")

def process_profile_data(data):
    """Process and combine API responses into comprehensive profile"""
    input_data = data["input"]
    initial_responses = data["initial_responses"]
    additional_responses = data["additional_responses"]

    print(f"process_profile_data: starting profile processing for PAN: {input_data.get('pan_number', 'N/A')[:4]}****")
    print(f"process_profile_data: received {len(initial_responses)} initial responses and {len(additional_responses)} additional responses")

    profile_data = {
        "input": input_data,
        "identityInfo": {},
        "contactInfo": {},
        "personalInfo": {},
        "employmentInfo": {},
        "businessInfo": {},
        "bankingInfo": {},
        "creditInfo": {},
        "digitalInfo": {},
    }

    try:
        # Personal Information Processing
        print("process_profile_data: processing personal information...")
        pan_plus_response = next((r for r in initial_responses if r["name"] == "PAN Plus"), {}).get("response", {}).get("data")
        pan_to_father_name_response = next((r for r in initial_responses if r["name"] == "PAN to Father Name"), {}).get("response", {}).get("data")

        if pan_plus_response:
            print(f"process_profile_data: PAN Plus data found - full_name: {pan_plus_response.get('full_name', 'N/A')}, gender: {pan_plus_response.get('gender', 'N/A')}")
        else:
            print("process_profile_data: PAN Plus data not available")

        if pan_to_father_name_response:
            print(f"process_profile_data: Father name data found: {pan_to_father_name_response.get('father_name', 'N/A')}")
        else:
            print("process_profile_data: Father name data not available")

        profile_data["personalInfo"] = {
            "fullName": pan_plus_response.get("full_name") if pan_plus_response else input_data["name"],
            "gender": pan_plus_response.get("gender", "Not Available") if pan_plus_response else "Not Available",
            "dateOfBirth": pan_plus_response.get("dob", "Not Available") if pan_plus_response else "Not Available",
            "fatherName": pan_to_father_name_response.get("father_name", "Not Available") if pan_to_father_name_response else "Not Available",
            "category": pan_plus_response.get("category", "Not Available") if pan_plus_response else "Not Available",
            "aadhaarLinked": pan_plus_response.get("aadhaar_linked", False) if pan_plus_response else False,
        }
        print(f"process_profile_data: personal info processed - fullName: {profile_data['personalInfo']['fullName']}")

        # Contact Information Processing
        print("process_profile_data: processing contact information...")
        mobile_to_name_response = next((r for r in initial_responses if r["name"] == "Mobile to Name"), {}).get("response", {}).get("data")
        network_details_response = next((r for r in initial_responses if r["name"] == "Mobile Network Details"), {}).get("response", {}).get("data")

        if mobile_to_name_response:
            print(f"process_profile_data: mobile name data found: {mobile_to_name_response.get('name', 'N/A')}")
        else:
            print("process_profile_data: mobile name data not available")

        if network_details_response:
            print(f"process_profile_data: network details found - operator: {network_details_response.get('currentNetworkName', 'N/A')}")
        else:
            print("process_profile_data: network details not available")

        formatted_address = "Not Available"
        if pan_plus_response and pan_plus_response.get("address"):
            addr = pan_plus_response["address"]
            address_parts = filter(None, [
                addr.get("line_1"),
                addr.get("line_2"),
                addr.get("street_name"),
                addr.get("city"),
                addr.get("state"),
                addr.get("zip"),
                addr.get("country"),
            ])
            formatted_address = ", ".join(address_parts)
            print(f"process_profile_data: address formatted: {formatted_address}")
        else:
            print("process_profile_data: address data not available")

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
        print(f"process_profile_data: contact info processed - mobile: {profile_data['contactInfo']['mobileNumber']}")

        # Employment Information Processing
        print("process_profile_data: processing employment information...")
        uan_response = next((r for r in initial_responses if r["name"] == "PAN to UAN"), {}).get("response", {}).get("data")
        employment_history_response = next((r for r in additional_responses if r["name"] == "UAN Employment History"), {}).get("response", {}).get("data")

        if uan_response and uan_response.get("uan_number"):
            print(f"process_profile_data: UAN found: {uan_response['uan_number']}")

            employment_history = []
            if employment_history_response:
                history_data = employment_history_response.get("employment_history", [])
                print(f"process_profile_data: employment history found with {len(history_data)} records")
                employment_history = [
                    {
                        "companyName": job.get("establishment_name", "Not Available"),
                        "memberId": job.get("member_id", "Not Available"),
                        "dateOfJoining": job.get("date_of_joining", "Not Available"),
                        "dateOfExit": job.get("date_of_exit", "Not Available"),
                        "lastPFSubmitted": job.get("last_pf_submitted", "Not Available"),
                    }
                    for job in history_data
                ]
            else:
                print("process_profile_data: employment history data not available")

            profile_data["employmentInfo"] = {
                "uanNumber": uan_response["uan_number"],
                "employmentHistory": employment_history,
            }
            print(f"process_profile_data: employment info processed with {len(employment_history)} history records")
        else:
            print("process_profile_data: UAN data not available")

        # Credit Information Processing
        print("process_profile_data: processing credit information...")
        credit_report_response = next((r for r in initial_responses if r["name"] == "Credit Report"), {}).get("response", {}).get("data")
        pan_kra_status_response = next((r for r in initial_responses if r["name"] == "PAN KRA Status"), {}).get("response", {}).get("data")

        if credit_report_response:
            print(f"process_profile_data: credit report found - score: {credit_report_response.get('credit_score', 'N/A')}")
        else:
            print("process_profile_data: credit report data not available")

        if pan_kra_status_response:
            print(f"process_profile_data: PAN KRA status found: {pan_kra_status_response.get('pan_kra_status', 'N/A')}")
        else:
            print("process_profile_data: PAN KRA status not available")

        profile_data["creditInfo"] = {
            "creditScore": credit_report_response.get("credit_score", "Not Available") if credit_report_response else "Not Available",
            "creditReport": credit_report_response.get("credit_report") if credit_report_response else None,
            "panKRAStatus": pan_kra_status_response.get("pan_kra_status", "Not Available") if pan_kra_status_response else "Not Available",
            "panKRAAgency": pan_kra_status_response.get("pan_kra_agency", "Not Available") if pan_kra_status_response else "Not Available",
        }
        print(f"process_profile_data: credit info processed - score: {profile_data['creditInfo']['creditScore']}")

        # Business Information Processing
        print("process_profile_data: processing business information...")
        pan_msme_check_response = next((r for r in additional_responses if r["name"] == "PAN MSME Check"), {}).get("response", {}).get("data")

        if pan_msme_check_response:
            msme_status = "Registered" if pan_msme_check_response.get("udyam_exists") else "Not Registered"
            print(f"process_profile_data: MSME check found - status: {msme_status}")

            profile_data["businessInfo"] = {
                "msmeStatus": msme_status,
                "panDetails": pan_msme_check_response.get("pan_details", {}),
            }
            print("process_profile_data: business info processed")
        else:
            print("process_profile_data: MSME check data not available")

        print(f"process_profile_data: profile processing completed successfully")
        print(f"process_profile_data: final profile sections: {list(profile_data.keys())}")

    except Exception as error:
        print(f"process_profile_data: ERROR in profile processing: {error}")
        print(f"process_profile_data: error details: {str(error)}")
        profile_data["processingError"] = "Some data processing failed"
        print("process_profile_data: added processing error flag to profile")

    return profile_data

# API Functions
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
    return fetch_with_timeout(url, headers)

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
    return fetch_with_timeout(url, headers)

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

async def fetch_credit_score(name: str, pan_number: str, mobile_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "financial-services/credit-bureau/credit-report",
        _fetch_credit_score, name, pan_number, mobile_number
    )

async def _fetch_credit_score(name: str, pan_number: str, mobile_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL_V1}/financial-services/credit-bureau/credit-report?full_name={name}&pan_number={pan_number}&mobile_number={mobile_number}&consent=Y&purpose=Profile%20Generation"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers, 12000)  # Longer timeout for credit report

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
    return fetch_with_timeout(url, headers)

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
    return fetch_with_timeout(url, headers)
