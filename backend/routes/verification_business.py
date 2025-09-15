from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import jwt
import os
import requests
from datetime import datetime
from typing import Dict, Any
from config.db import userCollection, apiAnalyticsCollection
from models.user import User
from models.api_analytics import ApiAnalytics

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
BASE_URL = "https://production.deepvue.tech/v1"

# API cost mapping
API_COSTS: Dict[str, float] = {
    "verification/gstin-advanced": 5.0,
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

# Tracker function for external API calls
async def track_external_api_call(
    user_id: str,
    username: str,
    user_role: str,
    service: str,
    api_function,
    *args
):
    start_time = datetime.now()

    try:
        # Call the actual API function
        result = await api_function(*args)
        response_time = (datetime.now() - start_time).total_seconds() * 1000  # in milliseconds

        # Get cost for this service
        cost = API_COSTS.get(service, 1.0)

        # Log this individual API call
        await ApiAnalytics.log_api_call({
            "userId": user_id,
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

        # Also log failed calls
        await ApiAnalytics.log_api_call({
            "userId": user_id,
            "username": username,
            "userRole": user_role,
            "service": service,
            "endpoint": service,
            "apiVersion": "v1",
            "cost": API_COSTS.get(service, 1.0),
            "statusCode": 500,
            "responseTime": response_time,
            "profileType": "business",
            "requestData": args[0] if args else None,
            "responseData": {
                "error": str(error),
            },
            "businessId": None,
        })

        raise error

# GET endpoint to fetch GST Advanced service details
@router.get("/gstin-advanced")
async def get_gst_advanced_service(request: Request):
    auth = await authenticate(request)

    if not auth["authenticated"]:
        raise HTTPException(status_code=401, detail=auth["error"])

    return JSONResponse(content={"service": GST_ADVANCED_SERVICE})

# POST endpoint for GST Advanced service access
@router.post("/gstin-advanced")
async def post_gst_advanced_service(request: Request, data: Dict[str, Any]):
    auth = await authenticate(request)

    if not auth["authenticated"]:
        raise HTTPException(status_code=401, detail=auth["error"])

    try:
        # Get user details
        if not auth.get("user"):
            raise HTTPException(status_code=401, detail="Authentication failed")

        user_id = auth["user"]["id"]
        user = await userCollection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        service = data.get("service")
        gstin = data.get("gstin")

        if not service:
            raise HTTPException(status_code=400, detail="Service identifier is required")

        if service == "gstin-advanced":
            response = await fetch_gstin_advanced(
                gstin,
                str(user["_id"]),
                user.get("username", ""),
                user.get("role", "")
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
    # Assuming authService.getAccessToken() is implemented elsewhere
    # For now, using a placeholder
    access_token = os.getenv("ACCESS_TOKEN", "placeholder_token")

    url = f"{BASE_URL}/verification/gstin-advanced?gstin_number={gstin_num}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": os.getenv("CLIENT_SECRET", ""),
    }

    response = requests.get(url, headers=headers)
    if not response.ok:
        raise Exception("GSTIN advanced verification failed")

    return response.json()