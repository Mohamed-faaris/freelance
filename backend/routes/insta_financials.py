from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import os
import requests
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from models.user import User
from utils import get_authenticated_user, track_external_api_call

# Load environment variables
import dotenv
dotenv.load_dotenv()

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


router = APIRouter()

JWT_SECRET = get_env("JWT_SECRET", required=True)
INSTA_USER_KEY = get_env("INSTA_USER_KEY", required=True)

# API cost mapping for InstaFinancials
INSTA_API_COSTS: Dict[str, float] = {
    "insta-summary": 10.0,
    "insta-basic": 5.0,
}

async def fetch_insta_financials(cin: str, service: str, user_id: str, username: str, user_role: str):
    return await track_external_api_call(
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

    # Make the request async
    def _sync_request():
        response = requests.get(url, headers={
            "user-key": INSTA_USER_KEY,
            "Content-Type": "application/json",
        })
        return response

    response = await asyncio.to_thread(_sync_request)

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
    try:
        user_doc = await get_authenticated_user(request)
    except HTTPException as auth_error:
        if auth_error.status_code == 401:
            print("Authentication failed for insta financials request")
        raise

    user = User.model_validate(user_doc)
    user_uuid = user_doc.get("_id") or user_doc.get("id")
    if not user_uuid:
        print(f"Authenticated user missing identifier: {user_doc}")
        raise HTTPException(status_code=500, detail="User identifier missing")
    user_id = str(user_uuid)

    print(f"Authenticated user: {user.username} (Role: {user.role})")

    try:

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
                user.username,
                user.role
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
                user.username,
                user.role
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
                "timestamp": datetime.utcnow().isoformat(),
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
    try:
        await get_authenticated_user(request)
    except HTTPException as auth_error:
        if auth_error.status_code == 401:
            raise HTTPException(status_code=401, detail="Not authenticated")
        raise

    return JSONResponse(content={
        "message": "InstaFinancials API is running",
        "services": list(INSTA_API_COSTS.keys()),
        "costs": INSTA_API_COSTS,
    })