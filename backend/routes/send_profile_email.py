from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.mailService import mail_service, EmailData
from utils.auth import authenticate_request, get_authenticated_user
import logging
import base64

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ===== REQUEST MODELS =====
class PDFAttachment(BaseModel):
    filename: Optional[str] = None
    content: str  # base64 encoded
    contentType: Optional[str] = "application/pdf"

class SendProfileEmailRequest(BaseModel):
    name: str
    profileData: Dict[str, Any]
    pdfAttachment: Optional[PDFAttachment] = None

# ===== HELPER FUNCTIONS =====
def safe_get(obj: Any, path: str, default_value: Any = "Not Available") -> Any:
    """Safely get nested property from object"""
    if not obj:
        return default_value

    try:
        for part in path.split('.'):
            if isinstance(obj, dict):
                obj = obj.get(part, default_value)
            else:
                return default_value
        return obj if obj is not None else default_value
    except:
        return default_value

# ===== MAIN ENDPOINT =====
@router.post("/send-profile-email")
async def send_profile_email(request: Request, req: SendProfileEmailRequest):
    """Send profile verification report via email"""
    try:
        # 🔑 Verify user is authenticated
        user = authenticate_request(request)
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Get user details from database
        user_doc = await get_authenticated_user(request)
        user_email = user_doc.get("email")
        user_username = user_doc.get("username") or user_doc.get("name") or "Valued User"

        if not user_email:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "User email not found. Please ensure your account has a valid email.",
                    "code": "EMAIL_NOT_FOUND"
                }
            )

        logger.info(f"📧 Sending email to: {user_email} ({user_username})")

        name = req.name
        profile_data = req.profileData
        pdf_attachment = req.pdfAttachment

        # Extract key information for email summary
        personal_info = profile_data.get("personalInfo", {})
        contact_info = profile_data.get("contactInfo", {})
        digital_info = profile_data.get("digitalInfo", {})
        employment_info = profile_data.get("employmentInfo", {})
        business_info = profile_data.get("businessInfo", {})
        credit_info = profile_data.get("creditInfo", {})
        driving_info = profile_data.get("drivingInfo", {})
        vehicle_info = profile_data.get("vehicleInfo", {})
        court_cases = profile_data.get("courtCases", {})

        # Count available sections and create summary
        sections_found = 0
        sections = []

        # Personal Information
        if personal_info and len(personal_info) > 0:
            sections_found += 1
            sections.append("👤 Personal Information - Verified")

        # Contact Information
        if contact_info and len(contact_info) > 0:
            sections_found += 1
            sections.append("📞 Contact Information - Verified")

        # Digital Information
        if digital_info and len(digital_info) > 0:
            sections_found += 1
            upi_count = len(digital_info.get("upiIds", []))
            sections.append(f"💳 Digital Information - {upi_count} UPI IDs found")

        # Employment History
        if employment_info and employment_info.get("employmentHistory") and len(employment_info["employmentHistory"]) > 0:
            sections_found += 1
            job_count = len(employment_info["employmentHistory"])
            sections.append(f"💼 Employment History - {job_count} job(s) found")

        # Business Information
        if business_info and len(business_info) > 0:
            sections_found += 1
            sections.append("🏢 Business Information - Verified")

        # Credit Information
        if credit_info and (credit_info.get("creditScore") or credit_info.get("creditReport")):
            sections_found += 1
            score = credit_info.get("creditScore", "N/A")
            accounts = safe_get(credit_info, "creditReport.RetailAccountsSummary.NoOfAccounts", 0)
            sections.append(f"💳 Credit Information - Score: {score}, {accounts} accounts")

        # Driving License
        if (driving_info and
            driving_info.get("status") != "error" and
            len(driving_info) > 0):
            sections_found += 1
            categories = len(driving_info.get("cov_details", []))
            sections.append(f"🚗 Driving License - {categories} categories verified")

        # Vehicle Information
        if (vehicle_info and
            vehicle_info.get("status") != "error" and
            len(vehicle_info) > 0):
            sections_found += 1
            sections.append("🚙 Vehicle Information - Verified")

        # Court Cases Analysis
        court_cases_found = court_cases.get("casesFound", 0)
        high_confidence_count = safe_get(court_cases, "advancedAnalysis.statistics.highConfidence", 0)

        if court_cases_found == 0:
            sections.append("⚖️ Legal Background Check - Clean")
        else:
            sections.append("⚖️ Legal Background Check - Completed")

        # Generate HTML content
        sections_html = "".join([f"<li>{section}</li>" for section in sections])

        court_section_html = ""
        if court_cases_found > 0:
            court_section_html = """
            <div class="court-section">
              <h4>⚖️ Legal Background Information</h4>
              <p>Legal background check completed as part of comprehensive verification. Detailed analysis available in the attached PDF report.</p>
            </div>
            """
        else:
            court_section_html = """
            <div class="court-section">
              <h4>⚖️ Legal Background Check</h4>
              <p><strong>✅ Background Check Complete</strong></p>
              <p>Legal background verification completed successfully as part of your comprehensive profile analysis.</p>
            </div>
            """

        attachment_section_html = ""
        if pdf_attachment:
            filename = pdf_attachment.filename or "verification-report.pdf"
            attachment_section_html = f"""
            <div class="attachment-note">
              <strong>📎 PDF Report Attached</strong><br>
              Your detailed verification report is attached: <strong>{filename}</strong>
              <br><br>
              This comprehensive document includes:
              <ul style="margin-top: 10px; margin-left: 20px;">
                <li>Complete identity verification results</li>
                <li>Legal background check analysis</li>
                <li>Employment and credit history</li>
                <li>Vehicle and license verification</li>
                <li>Data source references</li>
              </ul>
            </div>
            """
        else:
            attachment_section_html = f"""
            <div class="attachment-note">
              <strong>📄 Report Summary</strong><br>
              Your verification covers {sections_found} categories with comprehensive background analysis including legal record verification.
            </div>
            """

        # Enhanced HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ARGUS Personal Verification Report</title>
            <style>
              * {{ margin: 0; padding: 0; box-sizing: border-box; }}
              body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; }}
              .container {{ max-width: 600px; margin: 0 auto; background: white; }}
              .header {{ background: linear-gradient(135deg, #2980b9 0%, #3498db 100%); color: white; padding: 30px; text-align: center; }}
              .header h1 {{ font-size: 28px; font-weight: bold; margin-bottom: 5px; }}
              .header .tm {{ font-size: 12px; vertical-align: super; }}
              .content {{ padding: 30px; }}
              .greeting {{ font-size: 18px; color: #2c3e50; margin-bottom: 20px; }}
              .summary {{ background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }}
              .summary h3 {{ color: #2980b9; margin-bottom: 15px; }}
              .sections {{ margin: 20px 0; }}
              .sections li {{ margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; list-style: none; font-size: 14px; }}
              .court-section {{ background: #e3f2fd; border: 1px solid #2196f3; color: #0d47a1; padding: 15px; border-radius: 6px; margin: 20px 0; }}
              .attachment-note {{ background: #e3f2fd; border: 1px solid #2196f3; color: #0d47a1; padding: 15px; border-radius: 6px; margin: 20px 0; }}
              .footer {{ background: #34495e; color: white; padding: 20px; text-align: center; font-size: 13px; }}
              .badge {{ display: inline-block; background: #27ae60; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 10px 0; }}
              .stats-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }}
              .stat-item {{ text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px; }}
              .stat-number {{ font-size: 20px; font-weight: bold; color: #2980b9; }}
              .stat-label {{ font-size: 12px; color: #666; }}
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ARGUS<span class="tm">™</span></h1>
                <p>Background Verification Services</p>
                <div class="badge">✓ REPORT READY</div>
              </div>

              <div class="content">
                <div class="greeting">
                  Dear {user_username},
                </div>

                <p>Your comprehensive background verification report for <strong>{name}</strong> has been successfully generated{" and is attached to this email" if pdf_attachment else ""}.</p>

                <div class="summary">
                  <h3>📋 Verification Summary</h3>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-number">{sections_found}</div>
                      <div class="stat-label">Sections Verified</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">✓</div>
                      <div class="stat-label">Background Check</div>
                    </div>
                  </div>
                  <p><strong>Profile Name:</strong> {safe_get(personal_info, "fullName", safe_get(personal_info, "full_name", name))}</p>
                  <p><strong>Generated:</strong> {datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')}</p>
                  <p><strong>Status:</strong> ✅ Verification Complete</p>
                </div>

                <h4>🔍 Verification Categories:</h4>
                <ul class="sections">
                  {sections_html}
                </ul>

                {court_section_html}

                {attachment_section_html}

                <h4>🔒 Important Notes</h4>
                <ul style="margin-left: 20px; font-size: 14px;">
                  <li>This report contains sensitive personal information</li>
                  <li>Legal background check included in comprehensive analysis</li>
                  <li>All data sourced from verified government databases</li>
                  <li>Report generated on {datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')}</li>
                </ul>

                <p style="margin-top: 25px;">Thank you for using ARGUS for your verification needs.</p>

                <p style="margin-top: 15px;">
                  Best regards,<br>
                  <strong>The ARGUS Team</strong>
                </p>
              </div>

              <div class="footer">
                <p><strong>ARGUS™ - Background Verification Services</strong></p>
                <p>📧 {user_email} | 📅 {datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')}</p>
                <p style="margin-top: 10px; font-size: 11px;">Automated verification report - Do not reply</p>
              </div>
            </div>
          </body>
        </html>
        """

        # Enhanced text version
        sections_text = "\n".join([f"• {section.replace('👤', '').replace('📞', '').replace('💳', '').replace('💼', '').replace('🏢', '').replace('🚗', '').replace('🚙', '').replace('⚖️', '')}" for section in sections])

        attachment_text = ""
        if pdf_attachment:
            filename = pdf_attachment.filename or "verification-report.pdf"
            attachment_text = f"""PDF ATTACHMENT: {filename}
This comprehensive document contains detailed verification results, court case analysis, and data source references."""
        else:
            attachment_text = f"This summary covers all available verification categories with detailed analysis."

        text_content = f"""ARGUS™ Background Verification Report

Dear {user_username},

Your comprehensive background verification report for {name} has been successfully generated.

VERIFICATION SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Profile Name: {safe_get(personal_info, "fullName", safe_get(personal_info, "full_name", name))}
• Generated: {datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')}
• Sections Verified: {sections_found}
• Background Check: Complete
• Status: Verification Complete

VERIFICATION CATEGORIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{sections_text}

LEGAL BACKGROUND CHECK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Legal background verification completed as part of comprehensive background check.
Detailed analysis and findings available in the attached PDF report.

{attachment_text}

IMPORTANT NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Contains sensitive personal information
• Legal background check completed as part of verification
• Data sourced from verified government databases
• Handle with appropriate care and confidentiality

Best regards,
The ARGUS Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARGUS™ - Background Verification Services
📧 {user_email} | 📅 {datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""

        # Prepare email data
        email_data = EmailData(
            subject=f"✅ ARGUS Background Verification Report - {name}",
            recipients=[user_email],
            body=text_content,
            html_body=html_content
        )

        # Send email
        logger.info("📤 Sending email...")
        success = await mail_service.send_email(email_data)

        if success:
            logger.info("✅ Email sent successfully")
            return {
                "success": True,
                "message": "Report sent successfully to registered email",
                "recipientEmail": user_email,
                "recipientUsername": user_username,
                "sectionsIncluded": sections_found,
                "backgroundCheckComplete": True,
                "attachmentIncluded": pdf_attachment is not None
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending profile email: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": str(e),
                "details": "Please check your SMTP configuration and try again."
            }
        )
