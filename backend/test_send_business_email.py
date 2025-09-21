#!/usr/bin/env python3
"""
Test script for the send business email endpoint
"""
import asyncio
import httpx
from routes.send_business_email import SendBusinessEmailRequest

async def test_send_business_email():
    """Test the send business email endpoint"""

    # Create sample business data as dictionary
    business_data = {
        "businessInfo": {
            "business_name": "Sample Business Pvt Ltd",
            "legal_name": "Sample Business Private Limited",
            "gstin": "22AAAAA0000A1Z5",
            "pan_number": "AAAAA0000A",
            "constitution_of_business": "Private Limited Company",
            "taxpayer_type": "Regular",
            "gstin_status": "Active",
            "date_of_registration": "2020-01-15",
            "nature_bus_activities": ["Manufacturing", "Trading"],
            "nature_of_core_business_activity_description": "Manufacturing of electronic components"
        },
        "contactInfo": {
            "principal": {
                "address": "123 Business Street, City, State 12345",
                "email": "contact@samplebusiness.com",
                "mobile": "+91-9876543210",
                "nature_of_business": "Manufacturing and Trading"
            }
        },
        "jurisdictionInfo": {
            "center_jurisdiction": "Mumbai",
            "state_jurisdiction": "Maharashtra"
        },
        "financialInfo": {
            "annual_turnover": "₹5,00,00,000",
            "annual_turnover_fy": "2023-24",
            "percentage_in_cash": "30%"
        },
        "promoters": ["John Doe", "Jane Smith"],
        "creditAssessment": {
            "score": 85,
            "label": "Excellent",
            "creditLimit": "₹10,00,000",
            "positiveFactors": ["Consistent GST filings", "Good payment history", "Strong financials"],
            "negativeFactors": ["Recent increase in debt"],
            "recommendations": ["Monitor debt levels", "Continue good payment practices"]
        },
        "filingStatus": [
            [
                {
                    "return_type": "GSTR-3B",
                    "financial_year": "2023-24",
                    "tax_period": "Jan-2024",
                    "date_of_filing": "2024-02-15T10:30:00Z",
                    "status": "Filed"
                },
                {
                    "return_type": "GSTR-1",
                    "financial_year": "2023-24",
                    "tax_period": "Jan-2024",
                    "date_of_filing": "2024-02-10T14:20:00Z",
                    "status": "Filed"
                }
            ]
        ]
    }

    # Create request
    request_data = SendBusinessEmailRequest(
        email="test@example.com",  # Replace with actual test email
        businessName="Sample Business Pvt Ltd",
        businessData=business_data
    )

    # Convert to dict for API call
    request_dict = request_data.model_dump()

    print("🧪 Testing Send Business Email Endpoint")
    print("=" * 50)
    print(f"Email: {request_data.email}")
    print(f"Business: {request_data.businessName}")
    print()

    try:
        # Make API call (assuming server is running on localhost:8000)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/send-business-email",
                json=request_dict,
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✅ Business email sent successfully!")
                    print(f"Message: {result.get('message')}")
                else:
                    print("❌ Failed to send business email")
                    print(f"Error: {result.get('error')}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
        print("\nNote: Make sure the FastAPI server is running on localhost:8000")
        print("You can start it with: uvicorn main:app --reload")

if __name__ == "__main__":
    asyncio.run(test_send_business_email())