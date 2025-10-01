from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import jwt
import os
import requests
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from bson import ObjectId
from utils.dbCalls.user_db import find_user_by_id
from services.authService import auth_service
from utils.auth import authenticate_request
from utils.api_tracking import track_external_api_call

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
BASE_URL = "https://production.deepvue.tech/v1"
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# Business verification services configuration
BUSINESS_SERVICES = {
    "gst_basic": {
        "id": "gst-basic",
        "name": "GST Basic Verification",
        "category": "Business Compliance",
        "description": "Basic GST registration verification",
        "price": 2.5,
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

# GET endpoint to fetch business verification service details
@router.get("/")
async def get_business_services(request: Request):
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return JSONResponse(content={"services": BUSINESS_SERVICES})

# POST endpoint for business verification services
@router.post("/")
async def post_business_verification(request: Request, data: Dict[str, Any]):
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get user details
        user_id = user["id"]
        user_doc = await find_user_by_id(int(user_id))

        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        gstin = data.get("gstin")
        fssai_id = data.get("fssai_id") or data.get("fssaiId")  # Support both snake_case and camelCase

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
                    str(user_doc["id"]),
                    user_doc.get("username", ""),
                    user_doc.get("role", "")
                )
                result["gstData"] = gst_data["data"]
            except Exception as error:
                errors["gstError"] = str(error)

        # Fetch FSSAI data if FSSAI ID is provided
        if fssai_id and fssai_id.strip():
            try:
                fssai_data = await fetch_fssai(
                    fssai_id.strip(),
                    str(user_doc["id"]),
                    user_doc.get("username", ""),
                    user_doc.get("role", "")
                )
                result["fssaiData"] = fssai_data["data"]
            except Exception as error:
                errors["fssaiError"] = str(error)

        # Check if we got any successful results
        if not result.get("gstData") and not result.get("fssaiData"):
            # If no data was retrieved, return the errors
            error_messages = []
            if gstin and errors.get("gstError"):
                error_messages.append(f"GST: {errors['gstError']}")
            if fssai_id and errors.get("fssaiError"):
                error_messages.append(f"FSSAI: {errors['fssaiError']}")

            error_detail = error_messages[0] if error_messages else "No verification data found"
            raise HTTPException(status_code=400, detail=error_detail)

        # Include any partial errors in the response for transparency
        if errors:
            result["errors"] = errors

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as error:
        error_message = str(error)
        raise HTTPException(status_code=500, detail=error_message)

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