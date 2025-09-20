from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import jwt
import os
import requests
import asyncio
from datetime import datetime
from bson import ObjectId
from config.db import userCollection, apiAnalyticsCollection
from models.user import User
from models.api_analytics import ApiAnalytics
from services.authService import auth_service
from utils import (
    authenticate_request,
    get_authenticated_user,
    track_external_api_call,
    verify_gstin_advanced,
    GST_ADVANCED_SERVICE,
    validate_environment_variables
)

router = APIRouter()

# Pydantic schemas for request validation
class GSTINAdvancedRequest(BaseModel):
    service: str = Field(..., description="Service identifier (should be 'gstin-advanced')")
    gstin: str = Field(..., min_length=15, max_length=15, description="15-digit GSTIN number")

class ServiceResponse(BaseModel):
    service: Dict[str, Any]

class VerificationResponse(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
BASE_URL = "https://production.deepvue.tech/v1"
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

def authenticate(request: Request):
    return authenticate_request(request)

async def get_access_token():
    """Get access token using the auth service"""
    try:
        return await auth_service.get_access_token()
    except Exception as error:
        print(f"Failed to get access token: {error}")
        raise HTTPException(status_code=500, detail="Failed to authenticate with external service")

# GET endpoint to fetch GST Advanced service details
@router.get("/gstin-advanced", response_model=ServiceResponse)
async def get_gst_advanced_service(request: Request):
    # Get authenticated user using utility function
    await get_authenticated_user(request)

    return ServiceResponse(service=GST_ADVANCED_SERVICE)

# POST endpoint for GST Advanced service access
@router.post("/gstin-advanced", response_model=VerificationResponse)
async def post_gst_advanced_service(request: Request, data: GSTINAdvancedRequest):
    # Get authenticated user using utility function
    user_doc = await get_authenticated_user(request)

    try:
        service = data.service
        gstin = data.gstin

        if service == "gstin-advanced":
            # Use utility function for GSTIN verification with tracking
            response = await track_external_api_call(
                str(user_doc["_id"]),
                user_doc.get("username", ""),
                user_doc.get("role", ""),
                "verification/gstin-advanced",
                verify_gstin_advanced,
                gstin
            )
            return VerificationResponse(
                status="success",
                data=response,
                message="GSTIN verification completed successfully"
            )
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
        verify_gstin_advanced,
        gstin_number
    )