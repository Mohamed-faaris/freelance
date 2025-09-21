#!/usr/bin/env python3
"""
Simple test script for the Argus mailing service
"""
import asyncio
import os
from services.mailService import send_test_email, test_mail_service

async def main():
    """Test the mailing service"""
    print("🧪 Testing Argus Mailing Service")
    print("=" * 40)

    # Check environment variables
    smtp_user = os.getenv("USER")
    smtp_pass = os.getenv("PASS")
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    from_email = os.getenv("FROM_EMAIL")

    print(f"SMTP Server: {smtp_host or 'smtp.gmail.com'}")
    print(f"SMTP Port: {smtp_port or '587'}")
    print(f"Username: {smtp_user}")
    print(f"From Email: {from_email or smtp_user}")
    print(f"Mailing Enabled: {os.getenv('ENABLE_MAILING', 'true')}")
    print()

    if not smtp_user or not smtp_pass:
        print("❌ ERROR: USER and PASS environment variables are required!")
        print("Please set these in your .env file or environment variables.")
        return

    # Test mail service connection
    print("🔍 Testing mail service connection...")
    test_result = await test_mail_service()

    if test_result:
        print("✅ Mail service test successful!")
        print("📧 Test email sent to:", from_email or smtp_user)
    else:
        print("❌ Mail service test failed!")
        print("Please check your SMTP configuration.")

    print()
    print("📚 Usage Examples:")
    print("-" * 20)
    print("from services.mailService import send_test_email")
    print("await send_test_email('user@example.com')")
    print()
    print("from services.mailService import mail_service")
    print("await mail_service.send_test_email('user@example.com')")

if __name__ == "__main__":
    asyncio.run(main())