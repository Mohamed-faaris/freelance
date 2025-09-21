from fastapi import APIRouter, HTTPException, Request, Depends
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
from utils.auth import authenticate_request
from utils.api_tracking import track_external_api_call

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
BASE_URL = "https://production.deepvue.tech/v1"
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# FSSAI service configuration
FSSAI_SERVICE = {
    "id": "fssai-verification",
    "name": "FSSAI License Verification",
    "category": "Business Compliance",
    "description": "FSSAI license verification",
    "price": 3.0,
    "endpoint": "business-compliance/fssai-verification",
    "paramKey": "fssai_id",
}

# GET endpoint to fetch FSSAI service details
@router.get("/")
async def get_fssai_service(request: Request):
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return JSONResponse(content={"service": FSSAI_SERVICE})

# POST endpoint for FSSAI verification
@router.post("/")
async def post_fssai_verification(request: Request, data: Dict[str, Any]):
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get user details
        user_id = user["id"]
        user_doc = await userCollection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        fssai_id = data.get("fssai_id")

        if not fssai_id:
            raise HTTPException(status_code=400, detail="FSSAI ID is required")

        # Fetch FSSAI data
        response = await fetch_fssai(
            fssai_id,
            str(user_doc["_id"]),
            user_doc.get("username", ""),
            user_doc.get("role", "")
        )

        return JSONResponse(content={"fssaiData": response})

    except Exception as error:
        error_message = str(error)
        print(f"FSSAI Verification API Error: {error}")
        raise HTTPException(status_code=500, detail=error_message)

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