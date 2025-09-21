from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.pdfService import PDFGenerationService
from utils.html_generator import htmlContent

pdfRouter = APIRouter()

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

class GeneratePDFRequest(BaseModel):
    businessName: str
    businessData: BusinessData

# ===== HELPER FUNCTIONS =====
# Moved to utils/html_generator.py

# ===== MAIN ENDPOINT =====
@pdfRouter.post("/generate-pdf")
async def generate_pdf(request: GeneratePDFRequest):
    """Generate PDF for business verification report"""
    try:
        business_name = request.businessName
        business_data = request.businessData.dict()  # Convert to dict for htmlContent function

        # Generate HTML content using the utility function
        html_content = htmlContent(business_data, business_name)

        # Generate PDF from HTML content
        filename = f"{business_name.replace(' ', '_')}_verification_report.pdf"
        pdf_bytes = await PDFGenerationService.generate_pdf(html_content, filename)

        # Return PDF as response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_bytes))
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@pdfRouter.get("/health")
async def health_check():
    """Health check endpoint for PDF generation service"""
    return {
        "status": "healthy",
        "service": "pdf-generation",
        "version": "1.0.0",
        "supportedTypes": ["business-verification"]
    }
