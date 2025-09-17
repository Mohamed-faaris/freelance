from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import jwt
import os
import requests
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from bson import ObjectId
from config.db import userCollection, apiAnalyticsCollection
from models.user import User
from models.api_analytics import ApiAnalytics
from services.authService import auth_service

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
BASE_URL = "https://production.deepvue.tech/v1"

# API cost mapping
API_COSTS: Dict[str, float] = {
    "verification/gstinlite": 2.5,
    "business-compliance/fssai-verification": 3.0,
    "default": 1.0,
}

# Business verification services configuration
BUSINESS_SERVICES = {
    "gstBasic": {
        "id": "gst-basic",
        "name": "GST Basic Verification",
        "category": "Business Compliance",
        "description": "Basic GST registration verification",
        "price": 2.0,
        "endpoint": "verification/gstinlite",
        "paramKey": "gstin_number",
    },
    "fssai": {
        "id": "fssai-verification",
        "name": "FSSAI License Verification",
        "category": "Business Compliance",
        "description": "FSSAI license verification",
        "price": 3.0,
        "endpoint": "business-compliance/fssai-verification",
        "paramKey": "fssai_id",
    },
}

def authenticate(request: Request):
    token = request.cookies.get("auth_token")
    if not token:
        return None
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except:
        return None

# Tracker function for external API calls
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
        await ApiAnalytics.log_api_call({
            "userId": ObjectId(user_id),
            "username": username,
            "userRole": user_role,
            "service": service,
            "endpoint": service,
            "apiVersion": "v1",
            "cost": cost,
            "statusCode": 200,
            "responseTime": response_time,
            "profileType": "business",
            "requestData": {"gstin": args[0]} if args and len(args) > 0 and service == "verification/gstinlite" else {"fssai_id": args[0]} if args and len(args) > 0 else None,
            "responseData": result,
            "businessId": None,
        })

        return result
    except Exception as error:
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        # Log failed API call if analytics tracking is enabled
        await ApiAnalytics.log_api_call({
            "userId": ObjectId(user_id),
            "username": username,
            "userRole": user_role,
            "service": service,
            "endpoint": service,
            "apiVersion": "v1",
            "cost": API_COSTS.get(service, API_COSTS["default"]),
            "statusCode": 500,
            "responseTime": response_time,
            "profileType": "business",
            "requestData": {"gstin": args[0]} if args and len(args) > 0 and service == "verification/gstinlite" else {"fssai_id": args[0]} if args and len(args) > 0 else None,
            "responseData": {"error": str(error)},
            "businessId": None,
        })

        raise error

# GET endpoint to fetch business verification service details
@router.get("/")
async def get_business_services(request: Request):
    user = authenticate(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return JSONResponse(content={"services": BUSINESS_SERVICES})

# POST endpoint for business verification services
@router.post("/")
async def post_business_verification(request: Request, data: Dict[str, Any]):
    user = authenticate(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get user details
        user_id = user["id"]
        user_doc = await userCollection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        gstin = data.get("gstin")
        fssai_id = data.get("fssaiId")

        # Validate that at least one parameter is provided
        if not gstin and not fssai_id:
            raise HTTPException(status_code=400, detail="Either GSTIN or FSSAI ID is required")

        # Initialize result object
        result = {}
        errors = {}

        # Fetch GST data if GSTIN is provided
        if gstin and gstin.strip():
            try:
                gst_data = await fetch_gst_basic(
                    gstin.strip(),
                    str(user_doc["_id"]),
                    user_doc.get("username", ""),
                    user_doc.get("role", "")
                )
                result["gstData"] = gst_data.get("data", gst_data)
            except Exception as error:
                print(f"GST verification failed: {error}")
                errors["gstError"] = str(error)

        # Fetch FSSAI data if FSSAI ID is provided
        if fssai_id and fssai_id.strip():
            try:
                fssai_data = await fetch_fssai(
                    fssai_id.strip(),
                    str(user_doc["_id"]),
                    user_doc.get("username", ""),
                    user_doc.get("role", "")
                )
                result["fssaiData"] = fssai_data.get("data", fssai_data)
            except Exception as error:
                print(f"FSSAI verification failed: {error}")
                errors["fssaiError"] = str(error)

        # Check if we got any successful results
        if not result.get("gstData") and not result.get("fssaiData"):
            # If no data was retrieved, return the errors
            error_messages = []
            if gstin and errors.get("gstError"):
                error_messages.append(f"GST: {errors['gstError']}")
            if fssai_id and errors.get("fssaiError"):
                error_messages.append(f"FSSAI: {errors['fssaiError']}")

            raise HTTPException(
                status_code=400,
                detail=error_messages[0] if error_messages else "No verification data found"
            )

        # Include any partial errors in the response for transparency
        if errors:
            result["errors"] = errors

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as error:
        error_message = str(error)
        print(f"Business Verification API Error: {error}")
        raise HTTPException(status_code=500, detail=error_message)

# Function to fetch GST Basic data
async def fetch_gst_basic(
    gstin_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    return await track_external_api_call(
        user_id,
        username,
        user_role,
        "verification/gstinlite",
        _verify_gst_basic,
        gstin_number
    )

# Function to fetch FSSAI data
async def fetch_fssai(
    fssai_id: str,
    user_id: str,
    username: str,
    user_role: str
):
    return await track_external_api_call(
        user_id,
        username,
        user_role,
        "business-compliance/fssai-verification",
        _verify_fssai,
        fssai_id
    )

async def _verify_gst_basic(gstin_num: str):
    access_token = await auth_service.get_access_token()

    url = f"{BASE_URL}/verification/gstinlite?gstin_number={gstin_num}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": os.getenv("CLIENT_SECRET", ""),
    }

    def _make_request():
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()

    return await asyncio.to_thread(_make_request)

async def _verify_fssai(fssai_num: str):
    access_token = await auth_service.get_access_token()

    url = f"{BASE_URL}/business-compliance/fssai-verification?fssai_id={fssai_num}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": os.getenv("CLIENT_SECRET", ""),
    }

    def _make_request():
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()

    return await asyncio.to_thread(_make_request)