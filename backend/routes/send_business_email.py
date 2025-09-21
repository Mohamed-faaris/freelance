from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.mailService import mail_service, EmailData
from utils.html_generator import htmlContent

router = APIRouter()

# ===== REQUEST MODELS =====
class BusinessInfo(BaseModel):
    business_name: Optional[str] = None
    legal_name: Optional[str] = None
    gstin: Optional[str] = None
    pan_number: Optional[str] = None
    constitution_of_business: Optional[str] = None
    taxpayer_type: Optional[str] = None
    gstin_status: Optional[str] = None
    date_of_registration: Optional[str] = None
    nature_bus_activities: Optional[List[str]] = None
    nature_of_core_business_activity_description: Optional[str] = None

class ContactInfoPrincipal(BaseModel):
    address: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    nature_of_business: Optional[str] = None

class ContactInfo(BaseModel):
    principal: Optional[ContactInfoPrincipal] = None

class JurisdictionInfo(BaseModel):
    center_jurisdiction: Optional[str] = None
    state_jurisdiction: Optional[str] = None

class FinancialInfo(BaseModel):
    annual_turnover: Optional[str] = None
    annual_turnover_fy: Optional[str] = None
    percentage_in_cash: Optional[str] = None

class CreditAssessment(BaseModel):
    score: Optional[int] = None
    label: Optional[str] = None
    creditLimit: Optional[str] = None
    positiveFactors: Optional[List[str]] = None
    negativeFactors: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None

class FilingStatusItem(BaseModel):
    return_type: Optional[str] = None
    financial_year: Optional[str] = None
    tax_period: Optional[str] = None
    date_of_filing: Optional[str] = None
    status: Optional[str] = None

class BusinessData(BaseModel):
    businessInfo: Optional[BusinessInfo] = None
    contactInfo: Optional[ContactInfo] = None
    jurisdictionInfo: Optional[JurisdictionInfo] = None
    financialInfo: Optional[FinancialInfo] = None
    promoters: Optional[List[str]] = None
    creditAssessment: Optional[CreditAssessment] = None
    filingStatus: Optional[List[List[FilingStatusItem]]] = None

class SendBusinessEmailRequest(BaseModel):
    email: EmailStr
    businessName: str
    businessData: BusinessData

# ===== HELPER FUNCTIONS =====
# Moved to utils/html_generator.py

# ===== MAIN ENDPOINT =====
@router.post("/send-business-email")
async def send_business_email(request: SendBusinessEmailRequest):
    """Send business verification report via email"""
    try:
        email = request.email
        business_name = request.businessName
        business_data = request.businessData.model_dump()  # Convert to dict for htmlContent function       
        # Generate HTML content using the utility function
        html_content = htmlContent(business_data, business_name)

        # Send email
        email_data = EmailData(
            subject=f"Business Verification Report for {business_name}",
            recipients=[email],
            body="Please find the business verification report attached.",
            html_body=html_content
        )
        success = await mail_service.send_email(email_data)

        if success:
            return {"success": True, "message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send email")
