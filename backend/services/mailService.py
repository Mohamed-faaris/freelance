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

    async def send_test_email(self, to_email: EmailStr) -> bool:
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

async def test_mail_service() -> bool:
    """Test mail service connection"""
    if not MailConfig.FROM_EMAIL:
        logger.error("FROM_EMAIL not configured for testing")
        return False

    return await mail_service.send_test_email(MailConfig.FROM_EMAIL)
