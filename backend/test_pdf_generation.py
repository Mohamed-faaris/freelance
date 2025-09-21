#!/usr/bin/env python3
"""
Test script for PDF Generation API
This script demonstrates how to use the PDF generation endpoint
"""

import json
import requests

# Example data for testing
company_data = {
    "cin": "L12345MH2021PLC123456",
    "summary": {
        "InstaSummary": {
            "CompanyMasterSummary": {
                "CompanyName": "Example Technologies Ltd",
                "CompanyCIN": "L12345MH2021PLC123456",
                "CompanyDateOfInc": "2021-05-15",
                "CompanyMcaStatus": "Active",
                "CompanyPaidUpCapital": "1000000",
                "CompanyClass": "Public",
                "CompanyCategory": "Company limited by shares",
                "CompanyWebSite": "https://example.com",
                "CompanyMcaIndustry": "Information Technology"
            },
            "DirectorSignatoryMasterSummary": {
                "DirectorCurrentMasterSummary": {
                    "Director": [
                        {
                            "DirectorName": "John Doe",
                            "DirectorDin": "1234567",
                            "DirectorDesignation": "Director",
                            "DirectorDateOfAppnt": "2021-05-15",
                            "DirectorPANNumber": "ABCDE1234F",
                            "DirectorEmail": "john@example.com"
                        }
                    ]
                }
            },
            "FinancialsSummary": {
                "FinancialsYearWise": [
                    {
                        "FinancialYear": "2022-23",
                        "TotalIncome": "5000000",
                        "TotalExpense": "3000000",
                        "ProfitBeforeTax": "2000000",
                        "ProfitAfterTax": "1500000",
                        "NetWorth": "8000000"
                    }
                ]
            }
        }
    },
    "basic": {
        "InstaBasic": {
            "CompanyMasterSummary": {
                "CompanyName": "Example Technologies Ltd",
                "CompanyCIN": "L12345MH2021PLC123456",
                "CompanyDateOfInc": "2021-05-15",
                "CompanyMcaStatus": "Active"
            }
        }
    },
    "status": {
        "summary": "Available",
        "basic": "Available"
    }
}

business_data = {
    "contact_details": {
        "principal": {
            "address": "123 Business Street, Mumbai, Maharashtra",
            "email": "contact@example.com",
            "mobile": "9876543210",
            "nature_of_business": "IT Services"
        },
        "additional": []
    },
    "promoters": ["John Doe", "Jane Smith"],
    "annual_turnover": "50 Lakhs to 1.5 Cr.",
    "annual_turnover_fy": "2022-23",
    "percentage_in_cash_fy": "30%",
    "percentage_in_cash": "25%",
    "aadhaar_validation": "Yes",
    "aadhaar_validation_date": "2023-01-15",
    "address_details": {},
    "gstin": "22AAAAA0000A1Z5",
    "pan_number": "ABCDE1234F",
    "business_name": "Example Business Solutions",
    "legal_name": "Example Business Solutions Pvt Ltd",
    "center_jurisdiction": "Mumbai",
    "state_jurisdiction": "Maharashtra",
    "date_of_registration": "2020-03-15",
    "constitution_of_business": "Private Limited Company",
    "taxpayer_type": "Regular",
    "gstin_status": "Active",
    "date_of_cancellation": "",
    "field_visit_conducted": "Yes",
    "nature_bus_activities": ["Software Development", "IT Consulting"],
    "nature_of_core_business_activity_code": "6201",
    "nature_of_core_business_activity_description": "Computer programming activities",
    "filing_status": [
        [
            {
                "return_type": "GSTR-3B",
                "financial_year": "2022-23",
                "tax_period": "Jan-2023",
                "date_of_filing": "2023-02-15",
                "status": "Filed",
                "mode_of_filing": "Online"
            }
        ]
    ],
    "address": "123 Business Street, Mumbai, Maharashtra - 400001",
    "hsn_info": {},
    "filing_frequency": []
}

def test_pdf_generation():
    """Test the PDF generation API"""

    # API endpoint
    base_url = "http://localhost:8000"  # Adjust if your server runs on different port
    endpoint = "/api/generate-pdf"

    # Test data
    test_payload = {
        "data": business_data,  # or company_data for company reports
        "type": "business",     # or "company" for company reports
        "filename": "test-business-report.pdf"
    }

    try:
        print("Testing PDF Generation API...")
        print(f"Endpoint: {base_url}{endpoint}")
        print(f"Payload type: {test_payload['type']}")

        # Note: This would require authentication in a real scenario
        # You would need to include auth_token cookie or Authorization header

        response = requests.post(
            f"{base_url}{endpoint}",
            json=test_payload,
            # headers={"Authorization": "Bearer your-token-here"}  # Add auth if needed
        )

        if response.status_code == 200:
            print("✅ PDF generated successfully!")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Content-Length: {response.headers.get('content-length')} bytes")

            # Save the PDF
            with open("test-report.pdf", "wb") as f:
                f.write(response.content)
            print("📄 PDF saved as 'test-report.pdf'")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the FastAPI server is running")
        print("Start the server with: uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_health_check():
    """Test the health check endpoint"""

    base_url = "http://localhost:8000"
    endpoint = "/api/health"

    try:
        print("\nTesting Health Check...")
        response = requests.get(f"{base_url}{endpoint}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Health check successful!")
            print(f"Status: {data.get('status')}")
            print(f"Version: {data.get('version')}")
            print(f"Supported types: {data.get('supportedTypes')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the FastAPI server is running")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 PDF Generation API Test Script")
    print("=" * 50)

    test_health_check()
    test_pdf_generation()

    print("\n" + "=" * 50)
    print("📝 Notes:")
    print("- Make sure your FastAPI server is running")
    print("- Install weasyprint: pip install weasyprint")
    print("- Add authentication headers if required")
    print("- Check server logs for detailed error messages")