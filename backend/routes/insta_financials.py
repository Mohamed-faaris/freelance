from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import jwt
import os
import requests
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from bson import ObjectId
from utils.dbCalls.user_db import find_user_by_id
from utils.dbCalls.analytics_db import log_api_call

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
INSTA_USER_KEY = os.getenv("INSTA_USER_KEY")

if(not JWT_SECRET):
    raise Exception("JWT_SECRET is not configured")

if(not INSTA_USER_KEY):
    raise Exception("INSTA_USER_KEY is not configured")

# API cost mapping for InstaFinancials
INSTA_API_COSTS: Dict[str, float] = {
    "insta-summary": 10.0,
    "insta-basic": 5.0,
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

async def track_insta_api_call(
    user_id: str,
    username: str,
    user_role: str,
    service: str,
    api_function,
    *args
):
    start_time = datetime.now(timezone.utc)

    try:
        result = await api_function(*args)
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000  # in milliseconds
        cost = INSTA_API_COSTS.get(service, 5.0)

        await log_api_call({
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
            "createdAt": datetime.now(timezone.utc)
        })

        return result
    except Exception as error:
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        await log_api_call({
            "userId": ObjectId(user_id),
            "username": username,
            "userRole": user_role,
            "service": service,
            "endpoint": service,
            "apiVersion": "v1",
            "cost": INSTA_API_COSTS.get(service, 5.0),
            "statusCode": 500,
            "responseTime": response_time,
            "profileType": "business",
            "requestData": args[0] if args else None,
            "responseData": {
                "error": str(error)
            },
            "businessId": None,
            "createdAt": datetime.now(timezone.utc)
        })
        raise error

async def fetch_insta_financials(cin: str, service: str, user_id: str, username: str, user_role: str):
    return await track_insta_api_call(
        user_id,
        username,
        user_role,
        service,
        _make_insta_api_call,
        cin,
        service
    )

async def _make_insta_api_call(cin_number: str, service_type: str):
    base_url = "https://instafinancials.com/api"

    if not INSTA_USER_KEY:
        raise Exception("INSTA_USER_KEY is not configured")

    if service_type == "insta-summary":
        url = f"{base_url}/InstaSummary/v1/json/CompanyCIN/{cin_number}"
    elif service_type == "insta-basic":
        url = f"{base_url}/InstaBasic/v1/json/CompanyCIN/{cin_number}/All"
    else:
        raise Exception("Invalid service type")

    print(f"Making request to: {url}")

    response = requests.get(url, headers={
        "user-key": INSTA_USER_KEY,
        "Content-Type": "application/json",
    })

    if not response.ok:
        error_text = response.text
        print(f"InstaFinancials {service_type} failed:", {
            "status": response.status_code,
            "status_text": response.reason,
            "error_text": error_text,
        })
        raise Exception(
            f"InstaFinancials {service_type} failed: {response.status_code} {response.reason} - {error_text}"
        )

    data = response.json()
    print(f"{service_type} response received:", list(data.keys()))
    return data

@router.post("/")
async def post_insta_financials(request: Request):
    auth = authenticate(request)

    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_id = auth.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed")

        user_doc = await find_user_by_id(int(user_id))
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        # Get user details
        username = user_doc.get("username", "Unknown")
        user_role = user_doc.get("role", "user")

        body = await request.json()
        cin = body.get("cin")

        if not cin:
            raise HTTPException(status_code=400, detail="CIN is required")

        print(f"Processing CIN: {cin}")

        # Always try to fetch both, but handle failures gracefully
        summary_data = None
        basic_data = None
        errors = []

        # Try Summary API
        try:
            print("Attempting Summary API call...")
            summary_data = await fetch_insta_financials(
                cin,
                "insta-summary",
                user_id,
                username,
                user_role
            )
            print("Summary API call successful")
        except Exception as error:
            print(f"Summary API failed: {error}")
            errors.append(f"Summary API failed: {str(error)}")

        # Try Basic API
        try:
            print("Attempting Basic API call...")
            basic_data = await fetch_insta_financials(
                cin,
                "insta-basic",
                user_id,
                username,
                user_role
            )
            print("Basic API call successful")
        except Exception as error:
            print(f"Basic API failed: {error}")
            errors.append(f"Basic API failed: {str(error)}")

        # Check if we got any data
        if not summary_data and not basic_data:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Both Summary and Basic API calls failed",
                    "details": errors,
                }
            )

        # Return data even if one API failed
        response = {
            "data": {
                "summary": summary_data,
                "basic": basic_data,
                "cin": cin,
                "errors": errors if errors else None,
                "status": {
                    "summary": "success" if summary_data else "failed",
                    "basic": "success" if basic_data else "failed",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        print("Returning response with status:", response["data"]["status"])
        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as error:
        error_message = str(error)
        print(f"InstaFinancials API Error: {error}")

        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "details": error_message,
            }
        )

@router.get("/")
async def get_insta_financials_health(request: Request):
    auth = authenticate(request)

    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return JSONResponse(content={
        "message": "InstaFinancials API is running",
        "services": list(INSTA_API_COSTS.keys()),
        "costs": INSTA_API_COSTS,
    })