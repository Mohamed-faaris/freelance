from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# ===== MAIL SERVICE CONFIGURATION =====
class MailConfig:
    """Mail service configuration"""

    # SMTP Configuration
    SMTP_SERVER = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("USER")
    SMTP_PASSWORD = os.getenv("PASS")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "false").lower() == "true"  # Gmail port 465 uses SSL, not TLS
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "true").lower() == "true"   # Gmail port 465 uses SSL

    # Email Configuration
    FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
    FROM_NAME = os.getenv("FROM_NAME", "Argus")

    # Service Configuration
    ENABLE_MAILING = os.getenv("ENABLE_MAILING", "true").lower() == "true"

# ===== FASTAPI MAIL CONFIGURATION =====
def create_fastapi_mail_config() -> ConnectionConfig:
    """Create FastAPI-Mail configuration"""
    return ConnectionConfig(
        MAIL_USERNAME=MailConfig.SMTP_USERNAME,
        MAIL_PASSWORD=MailConfig.SMTP_PASSWORD,
        MAIL_FROM=MailConfig.FROM_EMAIL,
        MAIL_PORT=MailConfig.SMTP_PORT,
        MAIL_SERVER=MailConfig.SMTP_SERVER,
        MAIL_FROM_NAME=MailConfig.FROM_NAME,
        MAIL_STARTTLS=False,  # For SSL, set to False
        MAIL_SSL_TLS=True,    # For Gmail port 465 SSL
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )

# ===== EMAIL MODELS =====
class EmailData(BaseModel):
    subject: str
    recipients: List[EmailStr]
    body: str
    html_body: Optional[str] = None

# ===== MAIL SERVICE CLASS =====
class MailService:
    """Simple mailing service for testing"""

    def __init__(self):
        self.config = create_fastapi_mail_config()
        self.fastmail = FastMail(self.config)

        # Validate configuration
        self._validate_config()

    def _validate_config(self):
        """Validate mail service configuration"""
        if not MailConfig.ENABLE_MAILING:
            logger.warning("Mailing service is disabled")
            return

        if not MailConfig.SMTP_USERNAME or not MailConfig.SMTP_PASSWORD:
            raise ValueError("USER and PASS environment variables are required")

        logger.info("Mail service initialized successfully")

    async def send_email(self, email_data: EmailData) -> bool:
        """Send email using SMTP"""
        if not MailConfig.ENABLE_MAILING:
            logger.info("Mailing disabled, skipping email send")
            return True

        try:
            message = MessageSchema(
                subject=email_data.subject,
                recipients=email_data.recipients,
                body= email_data.body + email_data.html_body,
                subtype="html"
            )

            await self.fastmail.send_message(message)
            logger.info(f"Email sent successfully to {len(email_data.recipients)} recipients")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_business_verification_email(self, email_data: dict) -> bool:
        """Send business verification email with GST and FSSAI data"""
        try:
            recipient_email = email_data.get("recipient_email")
            business_data = email_data.get("business_data", {})
            gst_info = email_data.get("gst_info", {})
            fssai_info = email_data.get("fssai_info", {})
            addresses = email_data.get("addresses", [])
            user_name = email_data.get("user_name", "Valued Customer")

            # Create HTML email content
            html_body = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .section {{ margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }}
                    .section h3 {{ color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }}
                    .status-active {{ color: #28a745; font-weight: bold; }}
                    .status-inactive {{ color: #dc3545; font-weight: bold; }}
                    .risk-moderate {{ color: #ffc107; font-weight: bold; }}
                    .table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                    .table th, .table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    .table th {{ background-color: #f8f9fa; font-weight: bold; }}
                    .footer {{ text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏢 Business Verification Report</h1>
                        <p>Comprehensive compliance verification for your business</p>
                    </div>

                    <div class="content">
                        <p>Dear {user_name},</p>
                        <p>Here is your comprehensive business verification report:</p>

                        <!-- GST Information Section -->
                        {f'''
                        <div class="section">
                            <h3>📋 GST Information</h3>
                            <table class="table">
                                <tr><th>Field</th><th>Value</th></tr>
                                <tr><td>GSTIN</td><td>{gst_info.get('gstin', 'N/A')}</td></tr>
                                <tr><td>Legal Name</td><td>{gst_info.get('lgnm', 'N/A')}</td></tr>
                                <tr><td>Trade Name</td><td>{gst_info.get('tradeNam', 'N/A')}</td></tr>
                                <tr><td>Status</td><td><span class="status-{'active' if gst_info.get('sts') == 'Active' else 'inactive'}">{gst_info.get('sts', 'N/A')}</span></td></tr>
                                <tr><td>Registration Date</td><td>{gst_info.get('rgdt', 'N/A')}</td></tr>
                                <tr><td>Last Updated</td><td>{gst_info.get('lstupdt', 'N/A')}</td></tr>
                                <tr><td>State Jurisdiction</td><td>{gst_info.get('stj', 'N/A')}</td></tr>
                                <tr><td>Center Jurisdiction</td><td>{gst_info.get('ctj', 'N/A')}</td></tr>
                                <tr><td>Taxpayer Type</td><td>{gst_info.get('dty', 'N/A')}</td></tr>
                                <tr><td>E-invoice Status</td><td>{gst_info.get('einvoiceStatus', 'N/A')}</td></tr>
                            </table>

                            {f'''
                            <h4>Nature of Business Activities:</h4>
                            <ul>
                                {"".join(f"<li>{activity}</li>" for activity in gst_info.get('nba', []))}
                            </ul>
                            ''' if gst_info.get('nba') else ''}
                        </div>
                        ''' if gst_info else ''}

                        <!-- FSSAI Information Section -->
                        {f'''
                        <div class="section">
                            <h3>🍽️ FSSAI License Information</h3>
                            <table class="table">
                                <tr><th>Field</th><th>Value</th></tr>
                                <tr><td>FSSAI ID</td><td>{fssai_info.get('fssai_id', 'N/A')}</td></tr>
                                <tr><td>License Status</td><td>{fssai_info.get('status', 'N/A')}</td></tr>
                                <tr><td>Valid Until</td><td>{fssai_info.get('valid_until', 'N/A')}</td></tr>
                                <tr><td>License Type</td><td>{fssai_info.get('license_type', 'N/A')}</td></tr>
                            </table>
                        </div>
                        ''' if fssai_info else ''}

                        <!-- Trust Assessment Section -->
                        {f'''
                        <div class="section">
                            <h3>🔍 Trust Assessment</h3>
                            <table class="table">
                                <tr><th>Metric</th><th>Value</th></tr>
                                <tr><td>Risk Level</td><td><span class="risk-moderate">{gst_info.get('trustAssessment', {}).get('label', 'N/A')}</span></td></tr>
                                <tr><td>Risk Score</td><td>{gst_info.get('trustAssessment', {}).get('score', 'N/A')}/100</td></tr>
                            </table>

                            {f'''
                            <h4>Positive Factors:</h4>
                            <ul>
                                {"".join(f"<li>{factor}</li>" for factor in gst_info.get('trustAssessment', {}).get('positiveFactors', []))}
                            </ul>
                            ''' if gst_info.get('trustAssessment', {}).get('positiveFactors') else ''}

                            {f'''
                            <h4>Recommendations:</h4>
                            <ul>
                                {"".join(f"<li>{rec}</li>" for rec in gst_info.get('trustAssessment', {}).get('recommendations', []))}
                            </ul>
                            ''' if gst_info.get('trustAssessment', {}).get('recommendations') else ''}
                        </div>
                        ''' if gst_info.get('trustAssessment') else ''}

                        <!-- Business Information Section -->
                        {f'''
                        <div class="section">
                            <h3>🏢 Business Details</h3>
                            <table class="table">
                                <tr><th>Field</th><th>Value</th></tr>
                                <tr><td>Business Name</td><td>{business_data.get('businessName', 'N/A')}</td></tr>
                                <tr><td>Constitution of Business</td><td>{business_data.get('ctb', 'N/A')}</td></tr>
                            </table>
                        </div>
                        ''' if business_data else ''}

                        <!-- Addresses Section -->
                        {f'''
                        <div class="section">
                            <h3>📍 Registered Addresses</h3>
                            {"".join(f"""
                            <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                                <h4>Address {i+1}</h4>
                                <p><strong>Full Address:</strong> {addr.get('addr', {}).get('bnm', '')} {addr.get('addr', {}).get('st', '')} {addr.get('addr', {}).get('loc', '')} {addr.get('addr', {}).get('bno', '')} {addr.get('addr', {}).get('stcd', '')} {addr.get('addr', {}).get('pncd', '')}</p>
                                <p><strong>Nature:</strong> {addr.get('ntr', 'N/A')}</p>
                            </div>
                            """ for i, addr in enumerate(addresses))}
                        </div>
                        ''' if addresses else ''}

                        <div class="footer">
                            <p>This report was generated by Argus Business Verification Service.</p>
                            <p>For any questions or concerns, please contact our support team.</p>
                            <p>© 2025 Argus. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

            email_data_obj = EmailData(
                subject="🏢 Your Business Verification Report - Argus",
                recipients=[recipient_email],
                body="Your comprehensive business verification report is attached. Please check the HTML version for full details.",
                html_body=html_body
            )

            return await self.send_email(email_data_obj)

        except Exception as e:
            logger.error(f"Failed to send business verification email: {e}")
            return False
        """Send a test email"""
        try:
            html_body = """
            <html>
            <body>
                <h2>Argus Mail Service Test</h2>
                <p>This is a test email from Argus mailing service.</p>
                <p>If you received this email, the mail service is working correctly!</p>
                <br>
                <p>Best regards,<br>Argus Team</p>
            </body>
            </html>
            """

            email_data = EmailData(
                subject="Argus Mail Service Test",
                recipients=[to_email],
                body="This is a test email from Argus mailing service. If you received this, the service is working!",
                html_body=html_body
            )

            return await self.send_email(email_data)

        except Exception as e:
            logger.error(f"Failed to send test email: {e}")
            return False

# ===== GLOBAL MAIL SERVICE INSTANCE =====
mail_service = MailService()

# ===== UTILITY FUNCTIONS =====
async def send_test_email(to_email: EmailStr) -> bool:
    """Send a test email"""
    return await mail_service.send_test_email(to_email)

async def send_business_verification_email(email_data: dict) -> bool:
    """Send business verification email with GST and FSSAI data"""
    return await mail_service.send_business_verification_email(email_data)

async def test_mail_service() -> bool:
    """Test mail service connection"""
    if not MailConfig.FROM_EMAIL:
        logger.error("FROM_EMAIL not configured for testing")
        return False

    return await mail_service.send_test_email(MailConfig.FROM_EMAIL)
