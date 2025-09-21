#!/usr/bin/env python3
"""
Test script for the send profile email endpoint
"""
import asyncio
import httpx
from routes.send_profile_email import SendProfileEmailRequest, PDFAttachment

async def test_send_profile_email():
    """Test the send profile email endpoint"""

    # Create sample profile data
    profile_data = {
        "personalInfo": {
            "fullName": "John Doe",
            "dateOfBirth": "1990-01-15",
            "gender": "Male"
        },
        "contactInfo": {
            "email": "john.doe@example.com",
            "mobile": "+91-9876543210",
            "address": "123 Main St, City, State 12345"
        },
        "digitalInfo": {
            "upiIds": ["john@upi", "johndoe@paytm"]
        },
        "employmentInfo": {
            "employmentHistory": [
                {
                    "company": "Tech Corp",
                    "designation": "Software Engineer",
                    "duration": "2 years"
                },
                {
                    "company": "Startup Inc",
                    "designation": "Senior Developer",
                    "duration": "1 year"
                }
            ]
        },
        "businessInfo": {
            "businessName": "Doe Enterprises",
            "gstin": "22AAAAA0000A1Z5"
        },
        "creditInfo": {
            "creditScore": 750,
            "creditReport": {
                "RetailAccountsSummary": {
                    "NoOfAccounts": 3
                }
            }
        },
        "drivingInfo": {
            "status": "success",
            "cov_details": ["MCWG", "LMV"]
        },
        "vehicleInfo": {
            "status": "success",
            "registrationNumber": "KA01AB1234"
        },
        "courtCases": {
            "casesFound": 0,
            "advancedAnalysis": {
                "statistics": {
                    "highConfidence": 0
                }
            }
        }
    }

    # Optional PDF attachment (commented out for testing without attachment)
    # pdf_attachment = PDFAttachment(
    #     filename="profile-report.pdf",
    #     content="base64_encoded_pdf_content_here",
    #     contentType="application/pdf"
    # )

    # Create request
    request_data = SendProfileEmailRequest(
        name="John Doe",
        profileData=profile_data,
        # pdfAttachment=pdf_attachment  # Uncomment to test with attachment
    )

    # Convert to dict for API call
    request_dict = request_data.model_dump()

    print("🧪 Testing Send Profile Email Endpoint")
    print("=" * 50)
    print(f"Profile Name: {request_data.name}")
    print(f"Sections in data: {len(request_data.profileData)}")
    print()

    try:
        # Make API call (assuming server is running on localhost:8000)
        # Note: This would require authentication, so it's commented out
        # You would need to include proper auth headers/cookies

        print("✅ Test data prepared successfully!")
        print("To test the actual endpoint:")
        print("1. Start the FastAPI server: uvicorn index:app --reload")
        print("2. Login to get authentication token")
        print("3. Make POST request to /api/send-profile-email with auth")
        print("4. Check your email for the verification report")

        # Uncomment below to test if server is running (but will fail without auth)
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/send-profile-email",
                json=request_dict,
                cookies={"auth_token": "your_jwt_token_here"},  # Add valid token
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✅ Profile email sent successfully!")
                    print(f"Message: {result.get('message')}")
                    print(f"Recipient: {result.get('recipientEmail')}")
                else:
                    print("❌ Failed to send profile email")
                    print(f"Error: {result.get('error')}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
        """

    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
        print("\nNote: Make sure the FastAPI server is running on localhost:8000")
        print("You can start it with: uvicorn index:app --reload")

if __name__ == "__main__":
    asyncio.run(test_send_profile_email())