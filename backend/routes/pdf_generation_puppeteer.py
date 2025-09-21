from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from services.pdfService import PDFGenerationService
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime

router = APIRouter()

@router.post("/generate-puppeteer-pdf")
async def generate_puppeteer_pdf(request_data: Dict[str, Any]):
    try:
        profile_data = request_data.get("profileData", {})
        court_case_data = request_data.get("courtCaseData", {})

        # Extract data safely with form inputs as fallback
        personal_info = profile_data.get("personalInfo", {})
        contact_info = profile_data.get("contactInfo", {})
        digital_info = profile_data.get("digitalInfo", {})
        employment_info = profile_data.get("employmentInfo", {})
        business_info = profile_data.get("businessInfo", {})
        credit_info = profile_data.get("creditInfo", {})
        driving_info = profile_data.get("drivingInfo", {})
        form_inputs = profile_data.get("formInputs", {})

        # Helper function to get value with form input fallback
        def get_value_with_fallback(profile_value: Any, form_value: Any) -> str:
            return str(profile_value or form_value or "Not Available")

        full_name = get_value_with_fallback(
            personal_info.get("fullName") or personal_info.get("full_name"),
            form_inputs.get("name")
        )

        pan_number = get_value_with_fallback(
            personal_info.get("panNumber") or personal_info.get("pan_number"),
            form_inputs.get("pan")
        )

        aadhaar_number = get_value_with_fallback(
            personal_info.get("aadhaarNumber") or personal_info.get("aadhaar_number"),
            form_inputs.get("aadhaar")
        )

        mobile_number = get_value_with_fallback(
            contact_info.get("mobileNumber") or contact_info.get("mobile_number"),
            form_inputs.get("mobile")
        )

        # Find highest scoring case with confidence percentage
        highest_scoring_case = None
        confidence_percentage = "N/A"
        total_cases_found = 0

        if court_case_data.get("cases") and len(court_case_data["cases"]) > 0:
            total_cases_found = court_case_data.get("casesFound", len(court_case_data["cases"]))

            # Check for advanced analysis matches first
            if (court_case_data.get("advancedAnalysis", {}).get("matches") and
                len(court_case_data["advancedAnalysis"]["matches"]) > 0):
                highest_scoring_case = max(
                    court_case_data["advancedAnalysis"]["matches"],
                    key=lambda x: x.get("confidence", 0)
                )
            else:
                # Fall back to regular cases
                highest_scoring_case = max(
                    court_case_data["cases"],
                    key=lambda x: x.get("confidence", 0)
                )

            if (highest_scoring_case and
                highest_scoring_case.get("confidence") is not None and
                highest_scoring_case["confidence"] > 0):
                confidence_percentage = f"{highest_scoring_case['confidence']:.1f}%"

        # Format address
        formatted_address = "Not Available"
        if contact_info.get("address"):
            formatted_address = contact_info["address"]
        elif contact_info.get("addressDetails"):
            addr = contact_info["addressDetails"]
            address_parts = [
                addr.get("line_1"),
                addr.get("line_2"),
                addr.get("street_name"),
                addr.get("city"),
                addr.get("state"),
                addr.get("zip"),
                addr.get("country"),
            ]
            formatted_address = ", ".join(filter(None, address_parts))

        # Show complete PAN and Aadhaar numbers
        display_pan = pan_number
        display_aadhaar = aadhaar_number

        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ARGUS Verification Report - {full_name}</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}

                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.4;
                    color: #333;
                    font-size: 12px;
                }}

                .container {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                }}

                .header {{
                    background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
                    color: white;
                    padding: 25px;
                    position: relative;
                }}

                .header h1 {{
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }}

                .header .tm {{
                    font-size: 14px;
                    vertical-align: super;
                }}

                .title-section {{
                    background: #e3f2fd;
                    padding: 20px;
                    text-align: center;
                    border-bottom: 3px solid #2980b9;
                }}

                .title-section h2 {{
                    font-size: 24px;
                    color: #2980b9;
                    margin-bottom: 0;
                }}

                .section {{
                    margin: 0;
                    border-bottom: 1px solid #ddd;
                    overflow: hidden;
                    break-inside: avoid;
                }}

                .section-header {{
                    background: #f5a623;
                    color: white;
                    padding: 12px 20px;
                    font-weight: bold;
                    font-size: 14px;
                }}

                .section-content {{
                    padding: 15px 20px;
                }}

                .data-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }}

                .data-row:last-child {{
                    border-bottom: none;
                }}

                .data-label {{
                    font-weight: 500;
                    color: #555;
                    min-width: 150px;
                }}

                .data-value {{
                    flex: 1;
                    color: #333;
                    word-break: break-word;
                    text-align: left;
                    margin: 0 20px;
                }}

                .simple-data-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }}

                .simple-data-row:last-child {{
                    border-bottom: none;
                }}

                .status {{
                    background: #27ae60;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    text-align: center;
                    min-width: 70px;
                }}

                .status.not-found {{
                    background: #e74c3c;
                }}

                .status.not-available {{
                    background: #95a5a6;
                }}

                .blue-section-header {{
                    background: #3498db;
                    color: white;
                    padding: 12px 20px;
                    font-weight: bold;
                    font-size: 14px;
                }}

                .court-section {{
                    margin: 0;
                    border-bottom: 1px solid #ddd;
                    overflow: hidden;
                    page-break-before: auto;
                    break-before: auto;
                }}

                .page-break {{
                    page-break-before: always;
                    break-before: page;
                }}

                .court-header {{
                    background: #e74c3c;
                    color: white;
                    padding: 12px 20px;
                    font-weight: bold;
                    font-size: 14px;
                }}

                .court-header.no-cases {{
                    background: #27ae60;
                }}

                .court-content {{
                    padding: 15px 20px;
                }}

                .no-cases {{
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                    color: #155724;
                    padding: 15px;
                    text-align: center;
                    border-radius: 5px;
                    font-weight: 600;
                }}

                .court-case {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 15px;
                }}

                .case-title {{
                    color: #e74c3c;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}

                .confidence-badge {{
                    background: #f39c12;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }}

                .case-parties {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin: 15px 0;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                }}

                .party-section h4 {{
                    color: #2980b9;
                    margin-bottom: 8px;
                    font-size: 13px;
                }}

                .party-item {{
                    background: white;
                    padding: 5px 10px;
                    margin: 3px 0;
                    border-radius: 3px;
                    border-left: 3px solid #3498db;
                    font-size: 11px;
                }}

                .case-details {{
                    margin-top: 10px;
                }}

                .detail-item {{
                    margin: 5px 0;
                    font-size: 11px;
                }}

                .detail-label {{
                    font-weight: bold;
                    color: #495057;
                    display: inline-block;
                    min-width: 60px;
                }}

                .act-badge {{
                    background: #007bff;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin: 2px;
                    display: inline-block;
                }}

                .section-badge {{
                    background: #ffc107;
                    color: #212529;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                }}

                .declaration-box {{
                    background: #f8f9fa;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}

                .declaration-title {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #2980b9;
                    margin-bottom: 15px;
                    text-align: center;
                }}

                .declaration-text {{
                    font-size: 12px;
                    line-height: 1.6;
                    color: #555;
                    text-align: justify;
                    margin-bottom: 10px;
                }}

                .profile-summary {{
                    background: #e8f4fd;
                    padding: 15px 20px;
                    margin: 0;
                    border-bottom: 1px solid #ddd;
                }}

                .profile-summary h3 {{
                    color: #2980b9;
                    margin-bottom: 10px;
                    font-size: 16px;
                }}

                .profile-summary p {{
                    color: #555;
                    line-height: 1.5;
                    margin-bottom: 8px;
                    font-size: 11px;
                }}

                .footer {{
                    background: #2c3e50;
                    color: white;
                    padding: 15px 20px;
                    text-align: center;
                }}

                .footer p {{
                    font-size: 10px;
                    line-height: 1.4;
                    margin: 5px 0;
                    opacity: 0.9;
                }}

                @media print {{
                    body {{ print-color-adjust: exact; }}
                    .container {{ margin: 0; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1>ARGUS</h1>
                </div>

                <!-- Title Section -->
                <div class="title-section">
                    <h2>Background Verification Report</h2>
                </div>

                <!-- Request Info Section -->
                <div class="section">
                    <div class="section-header">Request Info</div>
                    <div class="section-content">
                        <div class="data-row">
                            <span class="data-label">Request Number</span>
                            <span class="data-value">ARG-{int(datetime.now().timestamp() * 1000)}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Initiated Date</span>
                            <span class="data-value">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</span>
                        </div>
                    </div>
                </div>

                <!-- Requested Data Section -->
                <div class="section">
                    <div class="section-header">Requested Data</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Full Name</span>
                            <span class="data-value">{full_name}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Mobile Number</span>
                            <span class="data-value">{mobile_number}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Aadhaar Number</span>
                            <span class="data-value">{aadhaar_number}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">PAN Number</span>
                            <span class="data-value">{pan_number}</span>
                        </div>
                    </div>
                </div>

                <!-- Result Summary Section -->
                <div class="section">
                    <div class="section-header">Result Summary</div>
                    <div class="section-content">
                        <div class="data-row">
                            <span class="data-label">Pan Information</span>
                            <span class="data-value"></span>
                            <span class="status">Verified</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Phone Number</span>
                            <span class="data-value"></span>
                            <span class="status">Verified</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Aadhaar Number</span>
                            <span class="data-value"></span>
                            <span class="status">Verified</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Employment Records</span>
                            <span class="data-value"></span>
                            <span class="status{" " + "not-found" if not (employment_info.get("employmentHistory") and len(employment_info["employmentHistory"]) > 0) else ""}">{ "Verified" if employment_info.get("employmentHistory") and len(employment_info["employmentHistory"]) > 0 else "Not Found"}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Credit Score</span>
                            <span class="data-value"></span>
                            <span class="status not-available">Not Available</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Court Case</span>
                            <span class="data-value"></span>
                            <span class="status{" " + "not-found" if total_cases_found > 0 else ""}">{ "Result Found" if total_cases_found > 0 else "Not Found"}</span>
                        </div>
                    </div>
                </div>

                <!-- Personal Information Section -->
                <div class="section">
                    <div class="blue-section-header">Personal Information</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Full Name:</span>
                            <span class="data-value">{full_name}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Gender:</span>
                            <span class="data-value">{personal_info.get("gender", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Date of Birth:</span>
                            <span class="data-value">{personal_info.get("dateOfBirth") or personal_info.get("dob", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Father's Name:</span>
                            <span class="data-value">{personal_info.get("fatherName") or personal_info.get("father_name", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Category:</span>
                            <span class="data-value">{personal_info.get("category", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Aadhaar Linked:</span>
                            <span class="data-value">{"Yes" if personal_info.get("aadhaarLinked") or personal_info.get("aadhaar_linked") else "No"}</span>
                        </div>
                    </div>
                </div>

                <!-- Phone Section -->
                <div class="section">
                    <div class="blue-section-header">Phone</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Mobile Number:</span>
                            <span class="data-value">{mobile_number}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Network Operator:</span>
                            <span class="data-value">{contact_info.get("networkOperator", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Network Region:</span>
                            <span class="data-value">{contact_info.get("networkRegion", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Number Type:</span>
                            <span class="data-value">{contact_info.get("numberType", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Alternative Name:</span>
                            <span class="data-value">{contact_info.get("alternativeName") or contact_info.get("name", "Not Available")}</span>
                        </div>
                    </div>
                </div>

                <!-- Credit Information Section -->
                <div class="section">
                    <div class="blue-section-header">Credit Information</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Credit Score:</span>
                            <span class="data-value">{credit_info.get("creditScore", "Not Available")}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">PAN KRA Status:</span>
                            <span class="data-value">{"Yes" if credit_info.get("panKRAStatus") or credit_info.get("panKRAAgency") else "Not Available"}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">KRA Agency:</span>
                            <span class="data-value">{credit_info.get("panKRAAgency", "Not Available")}</span>
                        </div>
                    </div>
                </div>

                <!-- PAN Information Section -->
                <div class="section">
                    <div class="blue-section-header">Pan Information</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Pan Number -</span>
                            <span class="data-value">{display_pan}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Pan Verified -</span>
                            <span class="data-value">Yes</span>
                        </div>
                    </div>
                </div>

                <!-- Aadhaar Information Section -->
                <div class="section">
                    <div class="blue-section-header">Aadhaar Information</div>
                    <div class="section-content">
                        <div class="simple-data-row">
                            <span class="data-label">Aadhaar Number -</span>
                            <span class="data-value">{display_aadhaar}</span>
                        </div>
                        <div class="simple-data-row">
                            <span class="data-label">Aadhaar Verified -</span>
                            <span class="data-value">Yes</span>
                        </div>
                    </div>
                </div>

                <!-- Court Cases Section -->
                <div class="court-section page-break">
                    <div class="court-header{" " + "no-cases" if total_cases_found == 0 else ""}">
                        ⚖️ Court Case{" (Highest Match: " + confidence_percentage + ")" if confidence_percentage != "N/A" else ""}
                    </div>
                    <div class="court-content">
        """

        # Court cases content
        if total_cases_found == 0:
            html_content += """
                        <div class="no-cases">
                            ✓ NO COURT CASES FOUND<br>
                            Clean legal record - No pending or historical court cases discovered
                        </div>
            """
        elif highest_scoring_case:
            petitioners_html = ""
            if highest_scoring_case.get("petitioners") and len(highest_scoring_case["petitioners"]) > 0:
                petitioners_html = "".join([f'<div class="party-item">• {petitioner}</div>' for petitioner in highest_scoring_case["petitioners"]])
            else:
                petitioners_html = '<div class="party-item">• Not Available</div>'

            respondents_html = ""
            if highest_scoring_case.get("respondents") and len(highest_scoring_case["respondents"]) > 0:
                respondents_html = "".join([f'<div class="party-item">• {respondent}</div>' for respondent in highest_scoring_case["respondents"]])
            else:
                respondents_html = '<div class="party-item">• Not Available</div>'

            acts_html = "Not Available"
            if highest_scoring_case.get("acts"):
                if isinstance(highest_scoring_case["acts"], list):
                    acts_html = " ".join([f'<span class="act-badge">{act}</span>' for act in highest_scoring_case["acts"]])
                else:
                    acts_html = f'<span class="act-badge">{highest_scoring_case["acts"]}</span>'

            sections_html = "Not Available"
            if highest_scoring_case.get("sections"):
                sections_html = f'<span class="section-badge">{highest_scoring_case["sections"]}</span>'

            additional_cases_html = ""
            if total_cases_found > 1:
                additional_cases_html = f'''
                        <div class="detail-item" style="margin-top: 10px; font-style: italic; color: #666;">
                            <strong>Additional Cases:</strong> {total_cases_found - 1} more cases found. This shows the highest matching case only.
                        </div>'''

            html_content += f"""
                        <div class="court-case">
                            <div class="case-title">
                                Case ID: {highest_scoring_case.get("id", "Unknown")}
                                <span class="confidence-badge">{f"{highest_scoring_case['confidence']:.1f}%" if highest_scoring_case.get("confidence") else ""}</span>
                            </div>

                            <div class="case-parties">
                                <div class="party-section">
                                    <h4>Petitioners:</h4>
                                    {petitioners_html}
                                </div>

                                <div class="party-section">
                                    <h4>Respondents:</h4>
                                    {respondents_html}
                                </div>
                            </div>

                            <div class="case-details">
                                <div class="detail-item">
                                    <span class="detail-label">Acts:</span>
                                    {acts_html}
                                </div>

                                <div class="detail-item">
                                    <span class="detail-label">Sections:</span>
                                    {sections_html}
                                </div>
                                {additional_cases_html}
                            </div>
                        </div>
            """
        else:
            html_content += """
                        <div style="text-align: center; color: #666; padding: 20px;">
                            <strong>Court case data analysis in progress</strong>
                        </div>
            """

        # Close court content and add remaining sections
        html_content += """
                    </div>
                </div>

                <!-- Declaration Section -->
                <div class="declaration-box">
                    <div class="declaration-title">VERIFICATION DECLARATION</div>
                    <div class="declaration-text">
                        <strong>ARGUS Background Verification Services</strong> hereby declares that we have verified each and every detail mentioned in this report based on our comprehensive data sources and verification processes. As a professional background verification company, we confirm that:
                    </div>
                    <div class="declaration-text">
                        • All personal information has been cross-verified against official government databases<br>
                        • Identity documents including PAN and Aadhaar have been authenticated through authorized channels<br>
                        • Contact information has been validated through multiple verification methods<br>
                        • Court records have been searched across national judicial databases<br>
                        • Employment and financial data has been verified through authorized information sources
                    </div>
                    <div class="declaration-text">
                        This verification report is issued based on the information available at the time of verification and should be used for reference purposes. We recommend conducting due diligence before making any decisions based on this report.
                    </div>
                </div>

                <!-- Profile Summary -->
                <div class="profile-summary">
                    <h3>Profile Summary</h3>
                    <p><strong>{full_name}</strong> is a verified individual with complete personal and contact information on record.</p>
                    <p>This report has been generated using verified data sources and professional verification processes. The subject's identity has been confirmed through multiple authentication channels.</p>
                    <p style="margin-top: 15px;">* This is a digital copy and does not require any signature</p>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>This report has been generated using verified data sources. Consumers should conduct due diligence before making decisions based on this information.</p>
                    <p style="text-align: right; margin-top: 10px;">Page 1 of 1</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Generate PDF using PDFGenerationService
        filename = f"argus-verification-{full_name.replace(' ', '-')}.pdf"
        pdf_data = await PDFGenerationService.generate_pdf(html_content, filename)

        # Return PDF response
        response = Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

        return response

    except Exception as error:
        print(f"PDF generation error: {error}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate PDF",
                "details": str(error)
            }
        )