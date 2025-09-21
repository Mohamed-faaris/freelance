from fastapi import APIRouter, HTTPException, Request
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from config.db import apiAnalyticsCollection, userCollection
from models.user import User
from models.api_analytics import ApiAnalytics
from services.authService import auth_service
from utils.api_tracking import track_external_api_call
from utils.auth import authenticate_request
import jwt
import os
import requests
import asyncio
from pydantic import BaseModel, ConfigDict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

verificationMiniRouter = APIRouter()

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
BASE_URL = os.getenv("BASE_URL_V1", "https://production.deepvue.tech/v1")
BASE_URL_V2 = os.getenv("BASE_URL_V2", "https://production.deepvue.tech/v2")

# Additional environment variables
ENABLE_ANALYTICS_TRACKING = os.getenv("ENABLE_ANALYTICS_TRACKING", "true").lower() == "true"

# Production limits for mini verification
PRODUCTION_LIMITS = {
    "API_TIMEOUT": 8000,  # 8 second timeout for individual APIs
    "POLLING_TIMEOUT": 20000,  # 20 second total timeout for polling
    "MAX_POLLING_ATTEMPTS": 10,
}

# API cost mapping for mini verification
API_COSTS = {
    "verification/aadhaar": 1.5,
    "verification/panbasic": 2.5,
    "verification/post-driving-license": 2.5,
    "verification/rc-advanced": 4.0,
    "verification/rc-challan-details": 3.5,
    "verification/epfo/pan-to-uan": 5.0,
    "verification/epfo/uan-to-employment-history": 5.0,
    "verification/epfo/aadhaar-to-uan": 5.0,
    "mobile-intelligence/mobile-to-pan": 5.0,
    "mobile-intelligence/mobile-to-dl-details": 1.0,  # For mobile to UAN
    "verification/mnrl": 1.0,
    "verification/post-voter-id": 2.5,
    "verification/passport": 2.5,
    "verification/bankaccount": 2.5,
    "verification/upi": 2.5,
    "verification/gstin-advanced": 5.0,
    "verification/mca/cin": 5.0,
    "verification/mca/din": 5.0,
    "business-compliance/pan-to-din": 5.0,
    "verification/pan-msme-check": 5.0,
    "verification/async/post-udyam-details": 5.0,
    "verification/async/get-udyam-details": 1.0,
    "verification/async/post-udyog-details": 5.0,
    "verification/async/get-udyog-details": 1.0,
    "business-compliance/shop-establishment-certificate": 5.0,
}

class VerificationMiniRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str
    dob: str
    mobile: str
    fatherName: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    dl_number: Optional[str] = None
    rc_number: Optional[str] = None
    epic_Number: Optional[str] = None
    file_number: Optional[str] = None
    upi: Optional[str] = None
    bankAccount: Optional[str] = None
    ifscCode: Optional[str] = None
    verifications: List[str]

async def fetch_with_timeout(url: str, headers: dict, timeout: int = PRODUCTION_LIMITS["API_TIMEOUT"]):
    """Fetch with timeout protection using requests in a thread"""
    def _sync_request():
        response = requests.get(url, headers=headers, timeout=timeout / 1000)  # Convert ms to seconds
        response.raise_for_status()
        return response.json()

    return await asyncio.to_thread(_sync_request)

async def post_with_timeout(url: str, headers: dict, data: dict = None, timeout: int = PRODUCTION_LIMITS["API_TIMEOUT"]):
    """POST with timeout protection using requests in a thread"""
    def _sync_post():
        response = requests.post(url, headers=headers, json=data, timeout=timeout / 1000)
        response.raise_for_status()
        return response.json()

    return await asyncio.to_thread(_sync_post)

def format_date_string(date_str: str) -> str:
    """Format date string to YYYY-MM-DD"""
    # Handle different possible date formats
    if date_str and "-" in date_str and len(date_str.split("-")[0]) == 4:
        return date_str  # Already in YYYY-MM-DD format

    if not date_str:
        return date_str

    parts = []
    if "-" in date_str:
        parts = date_str.split("-")
    elif "/" in date_str:
        parts = date_str.split("/")
    else:
        return date_str  # Can't parse, return as is

    if len(parts) == 3:
        day = parts[0].zfill(2)
        month = parts[1].zfill(2)
        year = parts[2] if len(parts[2]) == 4 else f"20{parts[2]}"
        return f"{year}-{month}-{day}"

    return date_str

@verificationMiniRouter.post("/verification-mini")
async def verification_mini(request: Request, data: VerificationMiniRequest):
    start_time = datetime.now()
    print(f"Starting mini verification for user with mobile: {data.mobile}")

    try:
        # Authenticate user
        decoded = authenticate_request(request)
        if not decoded:
            print("Authentication failed for mini verification request")
            raise HTTPException(status_code=401, detail="Authentication required")

        # Get user
        user_doc = await userCollection.find_one({"_id": ObjectId(decoded["id"])})
        if not user_doc:
            print(f"User not found for ID: {decoded['id']}")
            raise HTTPException(status_code=401, detail="User not found")

        user = User.model_construct(**user_doc)
        print(f"Authenticated user: {user.username} (Role: {user.role})")

        # Validate required fields
        if not data.name or not data.dob or not data.mobile:
            raise HTTPException(
                status_code=400,
                detail="Name, Date of Birth, and Mobile number are required"
            )

        # Format DOB as YYYY-MM-DD for API requests
        formatted_dob = format_date_string(data.dob)

        # Verification results tracking
        verification_results = {
            "personalInfo": {
                "name": data.name,
                "dob": formatted_dob,
                "mobile": data.mobile,
                "fatherName": data.fatherName,
                "aadhaar": data.aadhaar_number,
                "pan": data.pan_number,
                "dl": data.dl_number,
                "rcNumber": data.rc_number,
                "epicNumber": data.epic_Number,
                "fileNumber": data.file_number,
                "upi": data.upi,
                "bankAccount": data.bankAccount,
                "ifscCode": data.ifscCode,
            },
        }

        # Process mobile to PAN first if selected - this can provide PAN information if it's missing
        if "mobile-to-pan" in data.verifications:
            try:
                await process_mobile_to_pan_verification(
                    data.mobile,
                    str(user_doc["_id"]),
                    user.username,
                    user.role,
                    verification_results
                )

                # If PAN verification is also selected and PAN wasn't provided but found via mobile
                if ("pan" in data.verifications and
                    not data.pan_number and
                    verification_results.get("mobileToPANVerification", {}).get("panNumber")):
                    # Use the PAN obtained from mobile verification
                    verification_results["personalInfo"]["pan"] = verification_results["mobileToPANVerification"]["panNumber"]
            except Exception as error:
                print(f"Mobile to PAN verification error: {error}")
                verification_results["mobileToPANVerification"] = {
                    "mobileNumber": data.mobile,
                    "verificationStatus": "failed",
                    "verifiedAt": datetime.now().isoformat(),
                }

        # Process verifications based on selected options
        for verification_type in data.verifications:
            try:
                if verification_type == "aadhaar" and data.aadhaar_number:
                    await process_aadhaar_verification(
                        data.aadhaar_number,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                elif verification_type == "pan":
                    # Use either provided PAN or one obtained from mobile-to-pan
                    pan_to_verify = data.pan_number or verification_results["personalInfo"].get("pan")
                    if pan_to_verify:
                        await process_pan_verification(
                            pan_to_verify,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                elif verification_type == "dl" and data.dl_number and formatted_dob:
                    await process_dl_verification(
                        data.dl_number,
                        formatted_dob,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                elif verification_type == "rc-advanced" and data.rc_number:
                    await process_rc_advanced_verification(
                        data.rc_number,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                elif verification_type == "rc-challan" and data.rc_number:
                    await process_rc_challan_verification(
                        data.rc_number,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                elif verification_type == "pan-to-uan":
                    # Use either provided PAN or one obtained from mobile-to-pan
                    pan_for_uan = data.pan_number or verification_results["personalInfo"].get("pan")
                    if pan_for_uan:
                        uan_result = await process_pan_to_uan_verification(
                            pan_for_uan,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                        # If employment history is also selected, we can use the UAN we just found
                        if ("employment-history" in data.verifications and
                            uan_result and
                            uan_result.get("verificationStatus") == "verified"):
                            await process_employment_history_verification(
                                uan_result["uanNumber"],
                                str(user_doc["_id"]),
                                user.username,
                                user.role,
                                verification_results
                            )

                elif verification_type == "aadhaar-to-uan" and data.aadhaar_number:
                    uan_result = await process_aadhaar_to_uan_verification(
                        data.aadhaar_number,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                    # If employment history is also selected, we can use the UAN we just found
                    if ("employment-history" in data.verifications and
                        uan_result and
                        uan_result.get("verificationStatus") == "verified"):
                        await process_employment_history_verification(
                            uan_result["uanNumber"],
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                elif verification_type == "mobile-to-uan":
                    mobile_for_uan = data.mobile or verification_results["personalInfo"].get("mobile")
                    if mobile_for_uan:
                        uan_result = await process_mobile_to_uan_verification(
                            mobile_for_uan,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                        # If employment history is also selected, we can use the UAN we just found
                        if ("employment-history" in data.verifications and
                            uan_result and
                            uan_result.get("verificationStatus") == "verified"):
                            await process_employment_history_verification(
                                uan_result["uanNumber"],
                                str(user_doc["_id"]),
                                user.username,
                                user.role,
                                verification_results
                            )

                elif verification_type == "mnrl":
                    mobile_for_mnrl = data.mobile or verification_results["personalInfo"].get("mobile")
                    if mobile_for_mnrl:
                        await process_mnrl_verification(
                            mobile_for_mnrl,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                elif verification_type == "voter-id":
                    epic_number = data.epic_Number or verification_results.get("voterIdVerification", {}).get("epic_Number")
                    if epic_number:
                        await process_voter_id_verification(
                            epic_number,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                elif verification_type == "passport":
                    file_number = data.file_number or verification_results.get("passportVerification", {}).get("fileNumber")
                    if file_number and formatted_dob:
                        await process_passport_verification(
                            file_number,
                            formatted_dob,
                            str(user_doc["_id"]),
                            user.username,
                            user.role,
                            verification_results
                        )

                elif verification_type == "bankAccount" and data.bankAccount and data.ifscCode:
                    await process_bank_account_verification(
                        data.bankAccount,
                        data.ifscCode,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                elif verification_type == "upi" and data.upi and data.name:
                    await process_upi_verification(
                        data.upi,
                        data.name,
                        str(user_doc["_id"]),
                        user.username,
                        user.role,
                        verification_results
                    )

                # Skip these as they're handled above
                elif verification_type in ["mobile-to-pan", "employment-history"]:
                    continue

            except Exception as error:
                print(f"Error processing verification type {verification_type}: {error}")
                # Continue with other verifications

        # Add metadata
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        verification_results["metadata"] = {
            "profileType": "mini",
            "totalVerificationsRequested": len(data.verifications),
            "processingTimeMs": processing_time,
            "generatedAt": datetime.now().isoformat(),
        }

        print(f"Mini verification completed in {processing_time}ms for {len(data.verifications)} verification types")

        return verification_results

    except Exception as error:
        print(f"Error in mini verification: {error}")
        raise HTTPException(status_code=500, detail="Failed to perform mini verification")

# =========================== Verification Processing Functions ===========================

async def process_aadhaar_verification(
    aadhaar_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Aadhaar verification"""
    try:
        aadhaar_result = await verify_aadhaar(
            aadhaar_number,
            user_id,
            username,
            user_role
        )

        verification_results["aadhaarVerification"] = {
            "aadhaarNumber": aadhaar_number,
            "ageRange": aadhaar_result["data"].get("age_range"),
            "state": aadhaar_result["data"].get("state"),
            "gender": aadhaar_result["data"].get("gender"),
            "lastDigits": aadhaar_result["data"].get("last_digits"),
            "isMobile": aadhaar_result["data"].get("is_mobile"),
            "verificationStatus": "verified",
            "verifiedAt": datetime.now().isoformat(),
        }
    except Exception as error:
        print(f"Aadhaar verification error: {error}")
        verification_results["aadhaarVerification"] = {
            "aadhaarNumber": aadhaar_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_pan_verification(
    pan_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process PAN verification"""
    try:
        pan_result = await verify_pan(pan_number, user_id, username, user_role)

        verification_results["panVerification"] = {
            "panNumber": pan_number,
            "fullName": pan_result["data"].get("full_name"),
            "status": pan_result["data"].get("status"),
            "category": pan_result["data"].get("category"),
            "cleanedName": pan_result["data"].get("name_information", {}).get("pan_name_cleaned"),
            "verificationStatus": "verified",
            "verifiedAt": datetime.now().isoformat(),
        }
    except Exception as error:
        print(f"PAN verification error: {error}")
        verification_results["panVerification"] = {
            "panNumber": pan_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_dl_verification(
    dl_number: str,
    dob: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Driving License verification"""
    try:
        # Step 1: Initiate DL verification
        dl_init_result = await initiate_dl_verification(
            dl_number,
            dob,
            user_id,
            username,
            user_role
        )
        request_id = dl_init_result["request_id"]

        # Step 2: Poll for DL verification result
        dl_result = await poll_dl_verification(
            request_id,
            user_id,
            username,
            user_role
        )

        # Extract source output
        source_output = dl_result[0].get("result", {}).get("source_output", {})

        verification_results["dlVerification"] = {
            "dlNumber": dl_number,
            "name": source_output.get("name"),
            "relativeName": source_output.get("relatives_name"),
            "address": source_output.get("address"),
            "issuingRto": source_output.get("issuing_rto_name"),
            "dateOfIssue": source_output.get("date_of_issue"),
            "validFrom": source_output.get("nt_validity_from"),
            "validTo": source_output.get("nt_validity_to"),
            "covDetails": source_output.get("cov_details", []),
            "verificationStatus": "verified" if source_output.get("status") == "id_found" else "not_found",
            "verifiedAt": datetime.now().isoformat(),
            "requestId": request_id,
        }
    except Exception as error:
        print(f"DL verification error: {error}")
        verification_results["dlVerification"] = {
            "dlNumber": dl_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_rc_advanced_verification(
    rc_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process RC Advanced verification"""
    try:
        rc_result = await verify_rc_advanced(
            rc_number,
            user_id,
            username,
            user_role
        )

        if rc_result.get("sub_code") == "SUCCESS":
            data = rc_result["data"]
            verification_results["rcAdvancedVerification"] = {
                "rcNumber": rc_number,
                "registrationDate": data.get("registration_date"),
                "ownerName": data.get("owner_name"),
                "fatherName": data.get("father_name"),
                "presentAddress": data.get("present_address"),
                "permanentAddress": data.get("permanent_address"),
                "vehicleCategory": data.get("vehicle_category"),
                "vehicleChasiNumber": data.get("vehicle_chasi_number"),
                "vehicleEngineNumber": data.get("vehicle_engine_number"),
                "makerDescription": data.get("maker_description"),
                "makerModel": data.get("maker_model"),
                "bodyType": data.get("body_type"),
                "fuelType": data.get("fuel_type"),
                "color": data.get("color"),
                "fitUpTo": data.get("fit_up_to"),
                "financer": data.get("financer"),
                "financed": data.get("financed"),
                "insuranceCompany": data.get("insurance_company"),
                "insurancePolicyNumber": data.get("insurance_policy_number"),
                "insuranceUpto": data.get("insurance_upto"),
                "manufacturingDate": data.get("manufacturing_date"),
                "registeredAt": data.get("registered_at"),
                "cubicCapacity": data.get("cubic_capacity"),
                "seatingCapacity": data.get("seat_capacity"),
                "rcStatus": data.get("rc_status"),
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"RC verification failed: {rc_result.get('message')}")
    except Exception as error:
        print(f"RC Advanced verification error: {error}")
        verification_results["rcAdvancedVerification"] = {
            "rcNumber": rc_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_rc_challan_verification(
    rc_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process RC Challan verification"""
    try:
        challan_result = await verify_rc_challan(
            rc_number,
            user_id,
            username,
            user_role
        )

        if challan_result.get("sub_code") == "SUCCESS":
            data = challan_result["data"].get("challan_details", {})

            # Calculate total amount
            total_amount = sum(
                challan.get("amount", 0)
                for challan in data.get("challans", [])
            )

            # Get latest challan date
            challans = data.get("challans", [])
            if challans:
                sorted_challans = sorted(
                    challans,
                    key=lambda x: x.get("challan_date", ""),
                    reverse=True
                )
                latest_challan_date = sorted_challans[0].get("challan_date")
            else:
                latest_challan_date = None

            verification_results["rcChallanVerification"] = {
                "rcNumber": rc_number,
                "totalChallans": len(data.get("challans", [])),
                "totalAmount": total_amount,
                "latestChallanDate": latest_challan_date,
                "challanDetails": [
                    {
                        "challanNumber": challan.get("challan_number"),
                        "offenseDetails": challan.get("offense_details"),
                        "challanPlace": challan.get("challan_place"),
                        "challanDate": challan.get("challan_date"),
                        "amount": challan.get("amount"),
                        "challanStatus": challan.get("challan_status"),
                        "accusedName": challan.get("accused_name"),
                    }
                    for challan in data.get("challans", [])
                ],
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"RC Challan verification failed: {challan_result.get('message')}")
    except Exception as error:
        print(f"RC Challan verification error: {error}")
        verification_results["rcChallanVerification"] = {
            "rcNumber": rc_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_pan_to_uan_verification(
    pan_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process PAN to UAN verification"""
    try:
        uan_result = await verify_pan_to_uan(
            pan_number,
            user_id,
            username,
            user_role
        )

        if uan_result.get("sub_code") == "SUCCESS" and uan_result["data"].get("uan_number"):
            uan_verification = {
                "uanNumber": uan_result["data"]["uan_number"],
                "source": "pan",
                "sourceNumber": pan_number,
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }

            verification_results["uanVerification"] = uan_verification

            # Update personal info with UAN number if not already set
            if not verification_results["personalInfo"].get("uanNumber"):
                verification_results["personalInfo"]["uanNumber"] = uan_result["data"]["uan_number"]

            return uan_verification
        else:
            raise Exception(f"PAN to UAN verification failed: {uan_result.get('message', 'No UAN found')}")
    except Exception as error:
        print(f"PAN to UAN verification error: {error}")
        failed_verification = {
            "uanNumber": "",
            "source": "pan",
            "sourceNumber": pan_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

        verification_results["uanVerification"] = failed_verification
        return failed_verification

async def process_aadhaar_to_uan_verification(
    aadhaar_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Aadhaar to UAN verification"""
    try:
        uan_result = await verify_aadhaar_to_uan(
            aadhaar_number,
            user_id,
            username,
            user_role
        )

        if uan_result.get("sub_code") == "SUCCESS" and uan_result["data"].get("uan_number"):
            uan_verification = {
                "uanNumber": uan_result["data"]["uan_number"],
                "source": "aadhaar",
                "sourceNumber": aadhaar_number,
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }

            verification_results["uanVerification"] = uan_verification

            # Update personal info with UAN number if not already set
            if not verification_results["personalInfo"].get("uanNumber"):
                verification_results["personalInfo"]["uanNumber"] = uan_result["data"]["uan_number"]

            return uan_verification
        else:
            raise Exception(f"Aadhaar to UAN verification failed: {uan_result.get('message', 'No UAN found')}")
    except Exception as error:
        print(f"Aadhaar to UAN verification error: {error}")
        failed_verification = {
            "uanNumber": "",
            "source": "aadhaar",
            "sourceNumber": aadhaar_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

        verification_results["uanVerification"] = failed_verification
        return failed_verification

async def process_mobile_to_uan_verification(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Mobile to UAN verification"""
    try:
        uan_result = await verify_mobile_to_uan(
            mobile_number,
            user_id,
            username,
            user_role
        )

        if uan_result.get("sub_code") == "SUCCESS" and uan_result["data"].get("uan_number"):
            uan_verification = {
                "uanNumber": uan_result["data"]["uan_number"],
                "source": "mobile",
                "sourceNumber": mobile_number,
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }

            verification_results["uanVerification"] = uan_verification

            # Update personal info with UAN number if not already set
            if not verification_results["personalInfo"].get("uanNumber"):
                verification_results["personalInfo"]["uanNumber"] = uan_result["data"]["uan_number"]

            return uan_verification
        else:
            raise Exception(f"Mobile to UAN verification failed: {uan_result.get('message', 'No UAN found')}")
    except Exception as error:
        print(f"Mobile to UAN verification error: {error}")
        failed_verification = {
            "uanNumber": "",
            "source": "mobile",
            "sourceNumber": mobile_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

        verification_results["uanVerification"] = failed_verification
        return failed_verification

async def process_employment_history_verification(
    uan_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Employment History verification"""
    try:
        employment_result = await verify_employment_history(
            uan_number,
            user_id,
            username,
            user_role
        )

        if employment_result.get("sub_code") == "SUCCESS":
            verification_results["employmentHistoryVerification"] = {
                "uanNumber": uan_number,
                "employmentHistory": [
                    {
                        "name": job.get("name"),
                        "guardianName": job.get("guardian_name"),
                        "establishmentName": job.get("establishment_name"),
                        "memberId": job.get("member_id"),
                        "dateOfJoining": job.get("date_of_joining"),
                        "dateOfExit": job.get("date_of_exit"),
                        "lastPfSubmitted": job.get("last_pf_submitted"),
                    }
                    for job in employment_result["data"].get("employment_history", [])
                ],
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"Employment History verification failed: {employment_result.get('message')}")
    except Exception as error:
        print(f"Employment History verification error: {error}")
        verification_results["employmentHistoryVerification"] = {
            "uanNumber": uan_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_mobile_to_pan_verification(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Mobile to PAN verification"""
    try:
        mobile_to_pan_result = await verify_mobile_to_pan(
            mobile_number,
            user_id,
            username,
            user_role
        )

        if mobile_to_pan_result.get("sub_code") == "SUCCESS" and mobile_to_pan_result.get("data"):
            data = mobile_to_pan_result["data"]
            verification_results["mobileToPANVerification"] = {
                "mobileNumber": mobile_number,
                "panNumber": data.get("pan_number"),
                "fullName": data.get("full_name"),
                "fullNameSplit": data.get("full_name_split"),
                "maskedAadhaar": data.get("masked_aadhaar"),
                "gender": data.get("gender"),
                "dob": data.get("dob"),
                "aadhaarLinked": data.get("aadhaar_linked"),
                "dobVerified": data.get("dob_verified"),
                "category": data.get("category"),
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }

            # Update personal info with PAN number if not already set
            if not verification_results["personalInfo"].get("pan") and data.get("pan_number"):
                verification_results["personalInfo"]["pan"] = data["pan_number"]
        else:
            raise Exception(f"Mobile to PAN verification failed: {mobile_to_pan_result.get('message', 'No PAN details found')}")
    except Exception as error:
        print(f"Mobile to PAN verification error: {error}")
        verification_results["mobileToPANVerification"] = {
            "mobileNumber": mobile_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_mnrl_verification(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process MNRL verification"""
    try:
        mnrl_result = await verify_mnrl(
            mobile_number,
            user_id,
            username,
            user_role
        )

        sub_code = mnrl_result.get("sub_code")
        if sub_code in ["LATEST_MNRL_RECORD_FOUND", "MNRL_RECORD_FOUND", "NO_MNRL_RECORD_FOUND"]:
            data = mnrl_result.get("data", {})
            verification_results["mnrlVerification"] = {
                "mnrl_record_found": data.get("mnrl_record_found"),
                "mobile_number": data.get("phone_number"),
                "latest_revocation_status": data.get("latest_revocation_status"),
                "first_revocation_month": data.get("first_revocation_month"),
                "first_revocation_year": data.get("first_revocation_year"),
                "latest_revocation_month": data.get("latest_revocation_month"),
                "latest_revocation_year": data.get("latest_revocation_year"),
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"MNRL verification failed: {mnrl_result.get('message', 'No MNRL details found')}")
    except Exception as error:
        print(f"MNRL verification error: {error}")
        verification_results["mnrlVerification"] = {
            "mnrl_record_found": None,
            "mobile_number": mobile_number,
            "latest_revocation_status": None,
            "first_revocation_month": None,
            "first_revocation_year": None,
            "latest_revocation_month": None,
            "latest_revocation_year": None,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_voter_id_verification(
    epic_number: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Voter ID verification"""
    try:
        # Step 1: Initiate Voter ID verification
        voterid_init_result = await initiate_voter_id_verification(
            epic_number,
            user_id,
            username,
            user_role
        )
        request_id = voterid_init_result["request_id"]

        # Step 2: Poll for Voter ID verification result
        voterid_result = await poll_voter_id_verification(
            request_id,
            user_id,
            username,
            user_role
        )

        # Extract source output
        source_output = voterid_result[0].get("result", {}).get("source_output", {})

        verification_results["voterIdVerification"] = {
            "epic_Number": epic_number,
            "ac_no": source_output.get("ac_no"),
            "dob": source_output.get("date_of_birth"),
            "district": source_output.get("district"),
            "gender": source_output.get("gender"),
            "house_no": source_output.get("house_no"),
            "id_number": source_output.get("id_number"),
            "last_update": source_output.get("last_update"),
            "name_on_card": source_output.get("name_on_card"),
            "part_no": source_output.get("part_no"),
            "ps_lat_long": source_output.get("ps_lat_long"),
            "ps_name": source_output.get("ps_name"),
            "rln_name": source_output.get("rln_name"),
            "section_no": source_output.get("section_no"),
            "source": source_output.get("source"),
            "st_code": source_output.get("st_code"),
            "state": source_output.get("state"),
            "status": source_output.get("status"),
            "verificationStatus": "verified" if source_output.get("status") == "id_found" else "not_found",
            "verifiedAt": datetime.now().isoformat(),
            "requestId": request_id,
        }
    except Exception as error:
        print(f"Voter ID verification error: {error}")
        verification_results["voterIdVerification"] = {
            "epic_Number": epic_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_passport_verification(
    file_number: str,
    dob: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Passport verification"""
    try:
        passport_result = await verify_passport(
            file_number,
            dob,
            user_id,
            username,
            user_role
        )

        if passport_result.get("sub_code") == "SUCCESS" and passport_result.get("data"):
            data = passport_result["data"]
            verification_results["passportVerification"] = {
                "fileNumber": data.get("file_number"),
                "name": data.get("name"),
                "dob": data.get("dob"),
                "applicationType": data.get("application_type"),
                "applicationReceivedDate": data.get("application_received_date"),
                "status": data.get("status"),
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"Passport verification failed: {passport_result.get('message', 'No data found')}")
    except Exception as error:
        print(f"Passport verification error: {error}")
        verification_results["passportVerification"] = {
            "fileNumber": file_number,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_bank_account_verification(
    bank_account: str,
    ifsc_code: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process Bank Account verification"""
    try:
        bank_result = await verify_bank_account(
            bank_account,
            ifsc_code,
            user_id,
            username,
            user_role
        )

        data = bank_result["data"]
        verification_results["bankAccountVerification"] = {
            "bankAccount": bank_account,
            "ifscCode": ifsc_code,
            "message": data.get("message"),
            "accountExists": data.get("account_exists"),
            "nameAtBank": data.get("name_at_bank"),
            "utr": data.get("utr"),
            "verificationStatus": "verified",
            "verifiedAt": datetime.now().isoformat(),
        }
    except Exception as error:
        print(f"Bank Account verification error: {error}")
        verification_results["bankAccountVerification"] = {
            "bankAccount": bank_account,
            "ifscCode": ifsc_code,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

async def process_upi_verification(
    upi: str,
    name: str,
    user_id: str,
    username: str,
    user_role: str,
    verification_results: dict
):
    """Process UPI verification"""
    try:
        upi_result = await verify_upi(upi, name, user_id, username, user_role)

        if upi_result.get("sub_code") == "SUCCESS" and upi_result.get("data"):
            data = upi_result["data"]
            verification_results["upiVerification"] = {
                "accountExists": data.get("account_exists"),
                "nameAtBank": data.get("name_at_bank"),
                "verificationStatus": "verified",
                "verifiedAt": datetime.now().isoformat(),
            }
        else:
            raise Exception(f"UPI verification failed: {upi_result.get('message', 'No data found')}")
    except Exception as error:
        print(f"UPI verification error: {error}")
        verification_results["upiVerification"] = {
            "upi": upi,
            "verificationStatus": "failed",
            "verifiedAt": datetime.now().isoformat(),
        }

# =========================== API Call Functions ===========================

async def verify_aadhaar(
    aadhaar_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Aadhaar verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/aadhaar",
        _verify_aadhaar, aadhaar_number
    )

async def _verify_aadhaar(aadhaar_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL}/verification/aadhaar?aadhaar_number={aadhaar_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_pan(
    pan_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """PAN verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/panbasic",
        _verify_pan, pan_number
    )

async def _verify_pan(pan_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL}/verification/panbasic?pan_number={pan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def initiate_dl_verification(
    dl_number: str,
    dob: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Initiate Driving License verification"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/post-driving-license",
        _initiate_dl_verification, dl_number, dob
    )

async def _initiate_dl_verification(dl_number: str, dob: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL}/verification/post-driving-license?dl_number={dl_number}&dob={dob}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await post_with_timeout(url, headers)

async def poll_dl_verification(
    request_id: str,
    user_id: str,
    username: str,
    user_role: str,
    max_attempts: int = PRODUCTION_LIMITS["MAX_POLLING_ATTEMPTS"]
):
    """Poll Driving License verification result"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/get-driving-license",
        _poll_dl_verification, request_id, max_attempts
    )

async def _poll_dl_verification(request_id: str, max_attempts: int):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL}/verification/get-driving-license?request_id={request_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }

    for attempt in range(max_attempts):
        response = await fetch_with_timeout(url, headers)

        # Check if verification is completed
        if response and len(response) > 0 and response[0].get("status") == "completed":
            return response

        # Wait for 2 seconds before next attempt
        await asyncio.sleep(2)

    raise Exception("DL verification polling timed out")

async def verify_rc_advanced(
    rc_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """RC Advanced verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/rc-advanced",
        _verify_rc_advanced, rc_number
    )

async def _verify_rc_advanced(rc_number: str):
    access_token = await auth_service.get_access_token()
    url = f"{BASE_URL}/verification/rc-advanced?rc_number={rc_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_rc_challan(
    rc_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """RC Challan verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/rc-challan-details",
        _verify_rc_challan, rc_number
    )

async def _verify_rc_challan(rc_number: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/rc-challan-details?rc_number={rc_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_pan_to_uan(
    pan_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """PAN to UAN verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/epfo/pan-to-uan",
        _verify_pan_to_uan, pan_number
    )

async def _verify_pan_to_uan(pan_number: str):
    # Example hardcoded response for specific PAN number (LPMPS8050J)
    if pan_number == "LPMPS8050J":
        return {
            "code": 200,
            "timestamp": 1746692551812,
            "transaction_id": "2d1adc4b91514c6d92980aea2d0b3fb2",
            "sub_code": "SUCCESS",
            "message": "UAN Number fetched successfully",
            "data": {
                "uan_number": "101804454784",
            },
        }

    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/epfo/pan-to-uan"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
        "Content-Type": "application/json",
    }
    data = {"pan_number": pan_number}

    try:
        return await post_with_timeout(url, headers, data)
    except Exception as e:
        if "404" in str(e):
            # Return a no-data response instead of throwing an error
            return {
                "sub_code": "NO_DATA",
                "message": "No UAN found for the provided PAN",
                "data": {"uan_number": None},
            }
        raise e

async def verify_aadhaar_to_uan(
    aadhaar_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Aadhaar to UAN verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/epfo/aadhaar-to-uan",
        _verify_aadhaar_to_uan, aadhaar_number
    )

async def _verify_aadhaar_to_uan(aadhaar_number: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/epfo/aadhaar-to-uan"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
        "Content-Type": "application/json",
    }
    data = {"aadhaar_number": aadhaar_number}

    try:
        return await post_with_timeout(url, headers, data)
    except Exception as e:
        if "404" in str(e):
            # Return a no-data response instead of throwing an error
            return {
                "sub_code": "NO_DATA",
                "message": "No UAN found for the provided Aadhaar",
                "data": {"uan_number": None},
            }
        raise e

async def verify_mobile_to_uan(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Mobile to UAN verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-dl-details",
        _verify_mobile_to_uan, mobile_number
    )

async def _verify_mobile_to_uan(mobile_number: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/mobile-intelligence/mobile-to-dl-details?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }

    try:
        return await fetch_with_timeout(url, headers)
    except Exception as e:
        if "404" in str(e):
            # Return a no-data response instead of throwing an error
            return {
                "sub_code": "NO_DATA",
                "message": "No UAN found for the provided Mobile",
                "data": {"uan_number": None},
            }
        raise e

async def verify_employment_history(
    uan_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Employment History verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/epfo/uan-to-employment-history",
        _verify_employment_history, uan_number
    )

async def _verify_employment_history(uan_number: str):
    # Example hardcoded response for specific UAN number (101804454784)
    if uan_number == "101804454784":
        return {
            "code": 200,
            "timestamp": 1746692583524,
            "transaction_id": "c8a1d59142a24f3a833c1d1d58548438",
            "sub_code": "SUCCESS",
            "message": "Employment History fetched successfully",
            "data": {
                "pdf_url": "https://deepvue-tech.s3.ap-south-1.amazonaws.com/employment-history/101804454784_20250508082303.pdf",
                "employment_history": [
                    {
                        "name": "ANMOL SONKAR",
                        "guardian_name": "VEER SINGH SONKAR",
                        "establishment_name": "PINEYARDS SOLUTIONS PRIVATE LIMITED",
                        "member_id": "DSSHD18753260000010193",
                        "date_of_joining": "2022-03-01",
                        "date_of_exit": "2023-08-04",
                        "last_pf_submitted": None,
                    },
                ],
            },
        }

    access_token = await get_access_token()
    url = f"{BASE_URL_V2}/verification/epfo/uan-to-employment-history?uan_number={uan_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_mobile_to_pan(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Mobile to PAN verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "mobile-intelligence/mobile-to-pan",
        _verify_mobile_to_pan, mobile_number
    )

async def _verify_mobile_to_pan(mobile_number: str):
    # Example hardcoded response for mobile number 7055877416
    if mobile_number == "7055877416":
        return {
            "code": 200,
            "timestamp": 1746692465112,
            "transaction_id": "f9d4eb84d2114dd3a730b1bf9a94389d",
            "sub_code": "SUCCESS",
            "message": "PAN details fetched successfully",
            "data": {
                "pan_number": "LPMPS8050J",
                "full_name": "ANMOL SONKAR",
                "full_name_split": ["ANMOL", "", "SONKAR"],
                "masked_aadhaar": "XXXXXXXX3146",
                "address": {
                    "line_1": "",
                    "line_2": "",
                    "street_name": "",
                    "zip": "",
                    "city": "",
                    "state": "",
                    "country": "",
                    "full": "",
                },
                "email": None,
                "phone_number": None,
                "gender": "M",
                "dob": "2002-07-10",
                "input_dob": None,
                "aadhaar_linked": True,
                "dob_verified": False,
                "dob_check": False,
                "category": "person",
                "less_info": True,
            },
        }

    access_token = await get_access_token()
    url = f"{BASE_URL}/mobile-intelligence/mobile-to-pan"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
        "Content-Type": "application/json",
    }
    data = {"mobile_number": mobile_number}

    try:
        return await post_with_timeout(url, headers, data)
    except Exception as e:
        if "404" in str(e):
            # Return a no-data response instead of throwing an error
            return {
                "sub_code": "NO_DATA",
                "message": "No PAN details found for the provided mobile number",
                "data": None,
            }
        raise e

async def verify_mnrl(
    mobile_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """MNRL verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/mnrl",
        _verify_mnrl, mobile_number
    )

async def _verify_mnrl(mobile_number: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/mnrl/verify?mobile_number={mobile_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }

    try:
        return await fetch_with_timeout(url, headers)
    except Exception as e:
        if "404" in str(e):
            # Return a no-data response instead of throwing an error
            return {
                "sub_code": "NO_DATA",
                "message": "No mnrl found for the provided Mobile",
                "data": {
                    "mnrl_record_found": None,
                    "phone_number": None,
                    "latest_revocation_status": None,
                    "first_revocation_month": None,
                    "first_revocation_year": None,
                    "latest_revocation_month": None,
                    "latest_revocation_year": None,
                    "verificationStatus": "failed",
                },
            }
        raise e

async def initiate_voter_id_verification(
    epic_number: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Initiate Voter ID verification"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/post-voter-id",
        _initiate_voter_id_verification, epic_number
    )

async def _initiate_voter_id_verification(epic_number: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/post-voter-id?epic_number={epic_number}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await post_with_timeout(url, headers)

async def poll_voter_id_verification(
    request_id: str,
    user_id: str,
    username: str,
    user_role: str,
    max_attempts: int = PRODUCTION_LIMITS["MAX_POLLING_ATTEMPTS"]
):
    """Poll Voter ID verification result"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/get-voter-id",
        _poll_voter_id_verification, request_id, max_attempts
    )

async def _poll_voter_id_verification(request_id: str, max_attempts: int):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/get-voter-id?request_id={request_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }

    for attempt in range(max_attempts):
        response = await fetch_with_timeout(url, headers)

        # Check if verification is completed
        if response and len(response) > 0 and response[0].get("status") == "completed":
            return response

        # Wait for 2 seconds before next attempt
        await asyncio.sleep(2)

    raise Exception("Voter ID verification polling timed out")

async def verify_passport(
    file_number: str,
    dob: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Passport verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/passport",
        _verify_passport, file_number, dob
    )

async def _verify_passport(file_number: str, dob: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/passport?file_number={file_number}&dob={dob}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_bank_account(
    bank_account: str,
    ifsc_code: str,
    user_id: str,
    username: str,
    user_role: str
):
    """Bank Account verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/bankaccount",
        _verify_bank_account, bank_account, ifsc_code
    )

async def _verify_bank_account(bank_account: str, ifsc_code: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/bankaccount?account_number={bank_account}&ifsc={ifsc_code}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)

async def verify_upi(
    upi: str,
    name: str,
    user_id: str,
    username: str,
    user_role: str
):
    """UPI verification API call"""
    return await track_external_api_call(
        user_id, username, user_role, "verification/upi",
        _verify_upi, upi, name
    )

async def _verify_upi(upi: str, name: str):
    access_token = await get_access_token()
    url = f"{BASE_URL}/verification/upi?vpa={upi}&name={name}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "x-api-key": CLIENT_SECRET,
    }
    return await fetch_with_timeout(url, headers)