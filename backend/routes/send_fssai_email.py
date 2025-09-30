from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from bson import ObjectId
from utils.dbCalls.user_db import find_user_by_id
from utils.auth import authenticate_request
from services.mailService import send_business_verification_email

router = APIRouter()

@router.post("/")
async def send_fssai_email(request: Request, data: Dict[str, Any]):
    """
    Send FSSAI/Business verification email with verification results
    """
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get user details
        user_id = user["id"]
        user_doc = await find_user_by_id(user_id)

        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        # Extract email and business data from request
        recipient_email = data.get("email")
        business_data = data.get("businessData", {})
        gst_info = business_data.get("gstInfo", {})
        fssai_info = business_data.get("fssaiInfo", {})
        addresses = gst_info.get("adadr", [])

        if not recipient_email:
            raise HTTPException(status_code=400, detail="Recipient email is required")

        # Prepare email data
        email_data = {
            "recipient_email": recipient_email,
            "business_data": business_data,
            "gst_info": gst_info,
            "fssai_info": fssai_info,
            "addresses": addresses,
            "user_name": user_doc.get("username", "Valued Customer"),
            "user_email": user_doc.get("email", "")
        }

        # Send the email
        success = await send_business_verification_email(email_data)

        if success:
            return JSONResponse(content={
                "message": "Business verification email sent successfully",
                "recipient": recipient_email
            })
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except HTTPException:
        raise
    except Exception as error:
        print(f"Send FSSAI email error: {error}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(error)}")

@router.get("/")
async def get_fssai_email_service(request: Request):
    """
    Get FSSAI email service information
    """
    user = authenticate_request(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    service_info = {
        "id": "send-fssai-email",
        "name": "Send FSSAI Verification Email",
        "description": "Send business verification results via email",
        "category": "Communication",
        "price": 0.5,
        "endpoint": "/api/send-fssai-email",
        "method": "POST",
        "parameters": {
            "email": "Recipient email address (required)",
            "businessData": "Business information object containing gstInfo, fssaiInfo, etc.",
            "fssaiInfo": "FSSAI verification data (optional)",
            "adadr": "Address array (extracted from gstInfo.adadr)"
        }
    }

    return JSONResponse(content={"service": service_info})