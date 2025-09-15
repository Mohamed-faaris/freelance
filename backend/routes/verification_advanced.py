from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime
from bson import ObjectId
from config.db import apiAnalyticsCollection, userCollection
from models.user import User
from models.api_analytics import ApiAnalytics
import jwt
import os
import requests
import asyncio
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

verificationRouter = APIRouter()

# Environment variables with validation
JWT_SECRET = os.getenv("JWT_SECRET")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://auth.deepvue.tech")
AUTH_SERVICE_CLIENT_ID = os.getenv("AUTH_SERVICE_CLIENT_ID")
AUTH_SERVICE_CLIENT_SECRET = os.getenv("AUTH_SERVICE_CLIENT_SECRET")

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
BASE_URL_V1 = os.getenv("BASE_URL_V1", "https://production.deepvue.tech/v1")
BASE_URL_V2 = os.getenv("BASE_URL_V2", "https://production.deepvue.tech/v2")

# Additional environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"
VERIFICATION_CACHE_TTL = int(os.getenv("VERIFICATION_CACHE_TTL", "3600"))  # 1 hour default

# Production limits
PRODUCTION_LIMITS = {
    "API_TIMEOUT": 8000,  # 8 second timeout for individual APIs
    "TOTAL_TIMEOUT": 25000,  # 25 second total timeout
    "MAX_GSTIN_CALLS": 2,  # Limit GSTIN verification calls
}

# API cost mapping
API_COSTS = {
    "verification/pan-plus": 4.0,
    "mobile-intelligence/mobile-to-name": 5.0,
    "mobile-intelligence/mobile-to-network-details": 5.0,
    "mobile-intelligence/mobile-to-digital-age": 8.0,
    "mobile-intelligence/mobile-to-multiple-upi": 3.5,
    "verification/epfo/pan-to-uan": 5.0,
    "verification/pan-kra-status": 2.5,
    "verification/pan-to-fathername": 2.5,
    "verification/epfo/uan-to-employment-history": 5.0,
    "verification/gstinlite": 2.5,
    "verification/gstin-advanced": 5.0,
    "verification/pan-msme-check": 5.0,
    "financial-services/credit-bureau/credit-report": 30.0,
    "default": 1.0,
}

class VerificationRequest(BaseModel):
    name: str
    mobile_number: str
    aadhaar_number: Optional[str] = None
    pan_number: str

def authenticate(request: Request):
    token = request.cookies.get("auth_token")
    if not token:
        return None
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except:
        return None

async def get_access_token():
    """Get access token from auth service"""
    try:
        # Prepare the request to get access token
        token_url = f"{AUTH_SERVICE_URL}/oauth/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": AUTH_SERVICE_CLIENT_ID,
            "client_secret": AUTH_SERVICE_CLIENT_SECRET,
            "scope": "api"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        # Make the request synchronously in a thread
        def _get_token():
            response = requests.post(token_url, data=payload, headers=headers, timeout=10)
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")

        access_token = await asyncio.to_thread(_get_token)
        return access_token

    except Exception as error:
        print(f"Failed to get access token: {error}")
        # Fallback to a cached token or raise error
        raise HTTPException(status_code=500, detail="Failed to authenticate with external service")

async def fetch_with_timeout(url: str, headers: dict, timeout: int = PRODUCTION_LIMITS["API_TIMEOUT"]):
    """Fetch with timeout protection using requests in a thread"""
    def _sync_request():
        response = requests.get(url, headers=headers, timeout=timeout / 1000)  # Convert ms to seconds
        response.raise_for_status()
        return response.json()
    
    return await asyncio.to_thread(_sync_request)

async def track_external_api_call(
    user_id: str,
    username: str,
    user_role: str,
    service: str,
    api_function,
    *args,
    **kwargs
):
    """Track external API calls with analytics"""
    start_time = datetime.now()

    try:
        result = await api_function(*args, **kwargs)
        response_time = (datetime.now() - start_time).total_seconds() * 1000  # Convert to ms
        cost = API_COSTS.get(service, API_COSTS["default"])

        # Log successful API call if analytics tracking is enabled
        if ENABLE_ANALYTICS_TRACKING:
            await ApiAnalytics.log_api_call({
                "userId": ObjectId(user_id),
                "username": username,
                "userRole": user_role,
                "service": service,
                "endpoint": service,
                "apiVersion": "v2" if "pan-plus" in service else "v1",
                "cost": cost,
                "statusCode": 200,
                "responseTime": response_time,
                "profileType": "advanced",
                "requestData": args[0] if args else None,
                "responseData": result,
                "businessId": None,
            })

        return result
    except Exception as error:
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        # Log failed API call if analytics tracking is enabled
        if ENABLE_ANALYTICS_TRACKING:
            await ApiAnalytics.log_api_call({
                "userId": ObjectId(user_id),
                "username": username,
                "userRole": user_role,
                "service": service,
                "endpoint": service,
                "apiVersion": "v2" if "pan-plus" in service else "v1",
                "cost": API_COSTS.get(service, API_COSTS["default"]),
                "statusCode": 500,
                "responseTime": response_time,
                "profileType": "advanced",
                "requestData": args[0] if args else None,
                "responseData": {"error": str(error)},
                "businessId": None,
            })

        raise error

@verificationRouter.post("/verification-advanced")
async def verification_advanced(request: Request, data: VerificationRequest):
    start_time = datetime.now()
    print(f"Starting advanced verification for user with PAN: {data.pan_number[:4]}****")

    try:
        # Authenticate user
        decoded = authenticate(request)
        if not decoded:
            print("Authentication failed for verification request")
            raise HTTPException(status_code=401, detail="Authentication required")

        # Get user
        user_doc = userCollection.find_one({"_id": ObjectId(decoded["id"])})
        if not user_doc:
            print(f"User not found for ID: {decoded['id']}")
            raise HTTPException(status_code=401, detail="User not found")

        user = User.model_construct(**user_doc)
        print(f"Authenticated user: {user.username} (Role: {user.role})")

        # Check permissions
        if user.role != "superadmin" and not any(p.resource == "api-analytics" for p in user.permissions):
            print(f"Insufficient permissions for user: {user.username}")
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        # Define API calls with priorities
        priority_api_calls = [
            {
                "name": "PAN Plus",
                "call": lambda: fetch_pan_plus(data.pan_number, str(user_doc["_id"]), user.username, user.role),
                "endpoint": "verification/pan-plus",
                "priority": "HIGH",
            },
            {
                "name": "Mobile to Name",
                "call": lambda: fetch_mobile_to_name(data.mobile_number, str(user_doc["_id"]), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-name",
                "priority": "HIGH",
            },
            {
                "name": "PAN to UAN",
                "call": lambda: fetch_pan_to_uan(data.pan_number, str(user_doc["_id"]), user.username, user.role),
                "endpoint": "verification/epfo/pan-to-uan",
                "priority": "HIGH",
            },
        ]

        secondary_api_calls = [
            {
                "name": "Mobile Network Details",
                "call": lambda: fetch_mobile_network_details(data.mobile_number, str(user_doc["_id"]), user.username, user.role),
                "endpoint": "mobile-intelligence/mobile-to-network-details",
                "priority": "MEDIUM",
            },
            {
                "name": "PAN to Father Name",
                "call": lambda: fetch_pan_to_father_name(data.pan_number, str(user_doc["_id"]), user.username, user.role),
                "endpoint": "verification/pan-to-fathername",
                "priority": "MEDIUM",
            },
        ]

        expensive_api_calls = [
            {
                "name": "Credit Report",
                "call": lambda: fetch_credit_score(data.name, data.pan_number, data.mobile_number, str(user_doc["_id"]), user.username, user.role),
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
                    "call": lambda: fetch_uan_employment_history(uan_number, str(user_doc["_id"]), user.username, user.role),
                    "endpoint": "verification/epfo/uan-to-employment-history",
                })

            # Add PAN MSME Check
            additional_api_calls.append({
                "name": "PAN MSME Check",
                "call": lambda: fetch_pan_msme_check(data.pan_number, str(user_doc["_id"]), user.username, user.role),
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
        # Personal Information
        pan_plus_response = next((r for r in initial_responses if r["name"] == "PAN Plus"), {}).get("response", {}).get("data")
        pan_to_father_name_response = next((r for r in initial_responses if r["name"] == "PAN to Father Name"), {}).get("response", {}).get("data")

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

        # Credit Information
        credit_report_response = next((r for r in initial_responses if r["name"] == "Credit Report"), {}).get("response", {}).get("data")
        pan_kra_status_response = next((r for r in initial_responses if r["name"] == "PAN KRA Status"), {}).get("response", {}).get("data")

        profile_data["creditInfo"] = {
            "creditScore": credit_report_response.get("credit_score", "Not Available") if credit_report_response else "Not Available",
            "creditReport": credit_report_response.get("credit_report") if credit_report_response else None,
            "panKRAStatus": pan_kra_status_response.get("pan_kra_status", "Not Available") if pan_kra_status_response else "Not Available",
            "panKRAAgency": pan_kra_status_response.get("pan_kra_agency", "Not Available") if pan_kra_status_response else "Not Available",
        }

        # Business Information
        pan_msme_check_response = next((r for r in additional_responses if r["name"] == "PAN MSME Check"), {}).get("response", {}).get("data")

        if pan_msme_check_response:
            profile_data["businessInfo"] = {
                "msmeStatus": "Registered" if pan_msme_check_response.get("udyam_exists") else "Not Registered",
                "panDetails": pan_msme_check_response.get("pan_details", {}),
            }

    except Exception as error:
        print(f"Error processing profile data: {error}")
        profile_data["processingError"] = "Some data processing failed"

    return profile_data

# API Functions
async def fetch_pan_plus(pan_number: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
        user_id, username, user_role, "verification/pan-plus",
        _fetch_pan_plus, pan_number
    )

async def _fetch_pan_plus(pan_number: str):
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
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
    access_token = await get_access_token()
    url = f"{BASE_URL_V1}/verification/pan-msme-check?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return fetch_with_timeout(url, headers)