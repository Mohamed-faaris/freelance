from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import jwt
import os
import requests
import asyncio
from datetime import datetime
from typing import Dict, Any
from bson import ObjectId
from config.db import userCollection, apiAnalyticsCollection
from models.user import User
from models.api_analytics import ApiAnalytics

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
BASE_URL = "https://production.deepvue.tech/v1"
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://auth.deepvue.tech")
AUTH_SERVICE_CLIENT_ID = os.getenv("AUTH_SERVICE_CLIENT_ID")
AUTH_SERVICE_CLIENT_SECRET = os.getenv("AUTH_SERVICE_CLIENT_SECRET")

# API cost mapping
API_COSTS: Dict[str, float] = {
    "verification/gstin-advanced": 5.0,
    "default": 1.0,
}

# GST Advanced service configuration
GST_ADVANCED_SERVICE = {
    "id": "gstin-advanced",
    "name": "GSTIN Advanced",
    "category": "Business Compliance",
    "description": "Advanced verification of GSTIN",
    "price": 5.0,
    "endpoint": "verification/gstin-advanced",
    "paramKey": "gstin_number",
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
        if ENABLE_ANALYTICS_TRACKING:
            ApiAnalytics.log_api_call({
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
                "requestData": args[0] if args else None,
                "responseData": result,
                "businessId": None,
            })

        return result
    except Exception as error:
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        # Log failed API call if analytics tracking is enabled
        if ENABLE_ANALYTICS_TRACKING:
            ApiAnalytics.log_api_call({
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
                "requestData": args[0] if args else None,
                "responseData": {"error": str(error)},
                "businessId": None,
            })

        raise error

# GET endpoint to fetch GST Advanced service details
@router.get("/gstin-advanced")
async def get_gst_advanced_service(request: Request):
    user = authenticate(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return JSONResponse(content={"service": GST_ADVANCED_SERVICE})

# POST endpoint for GST Advanced service access
@router.post("/gstin-advanced")
async def post_gst_advanced_service(request: Request, data: Dict[str, Any]):
    user = authenticate(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get user details
        user_id = user["id"]
        user_doc = await userCollection.find_one({"_id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        service = data.get("service")
        gstin = data.get("gstin")

        if not service:
            raise HTTPException(status_code=400, detail="Service identifier is required")

        if service == "gstin-advanced":
            response = await fetch_gstin_advanced(
                gstin,
                str(user_doc["_id"]),
                user_doc.get("username", ""),
                user_doc.get("role", "")
            )
            return JSONResponse(content=response)
        else:
            raise HTTPException(status_code=400, detail="Service not supported")

    except Exception as error:
        error_message = str(error)
        print(f"Service API Error: {error}")
        raise HTTPException(status_code=500, detail=error_message)

async def fetch_gstin_advanced(
    gstin_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    return await track_external_api_call(
        user_id,
        username,
        user_role,
        "verification/gstin-advanced",
        _verify_gstin_advanced,
        gstin_number
    )

async def _verify_gstin_advanced(gstin_num: str):
    access_token = await get_access_token()

    url = f"{BASE_URL}/verification/gstin-advanced?gstin_number={gstin_num}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": os.getenv("CLIENT_SECRET", ""),
    }

    response = requests.get(url, headers=headers)
    if not response.ok:
        raise Exception("GSTIN advanced verification failed")

    return response.json()