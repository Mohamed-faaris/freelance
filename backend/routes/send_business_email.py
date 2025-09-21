from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.mailService import mail_service, EmailData

router = APIRouter()

# ===== REQUEST MODELS =====
class SendBusinessEmailRequest(BaseModel):
    email: EmailStr
    businessName: str
    businessData: Dict[str, Any]

# ===== HELPER FUNCTIONS =====
def format_data_row(label: str, value: Any) -> str:
    """Format a data row for HTML table"""
    if value is None or value == "":
        return ""

    if isinstance(value, bool):
        value = "Yes" if value else "No"

    return f"""<tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 35%;">{label}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{value}</td>
              </tr>"""

def create_section(title: str, content: str) -> str:
    """Create an HTML section"""
    if not content:
        return ""

    return f"""
        <div style="margin-top: 20px;">
          <h2 style="color: #5D4FBF; border-bottom: 2px solid #EDE9FE; padding-bottom: 8px;">{title}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            {content}
          </table>
        </div>
      """

# ===== MAIN ENDPOINT =====
@router.post("/send-business-email")
async def send_business_email(request: SendBusinessEmailRequest):
    """Send business verification report via email"""
    try:
        email = request.email
        business_name = request.businessName
        business_data = request.businessData

        # Format Business Information Section
        business_info_content = ""
        if business_data.get("businessInfo"):
            info = business_data["businessInfo"]
            business_info_content += format_data_row("Business Name", info.get("business_name"))
            business_info_content += format_data_row("Legal Name", info.get("legal_name"))
            business_info_content += format_data_row("GSTIN", info.get("gstin"))
            business_info_content += format_data_row("PAN Number", info.get("pan_number"))
            business_info_content += format_data_row("Constitution of Business", info.get("constitution_of_business"))
            business_info_content += format_data_row("Taxpayer Type", info.get("taxpayer_type"))
            business_info_content += format_data_row("GSTIN Status", info.get("gstin_status"))
            business_info_content += format_data_row("Date of Registration", info.get("date_of_registration"))

            if info.get("nature_bus_activities") and len(info["nature_bus_activities"]) > 0:
                activities = ", ".join(info["nature_bus_activities"])
                business_info_content += format_data_row("Nature of Business Activities", activities)

            business_info_content += format_data_row("Core Business Activity", info.get("nature_of_core_business_activity_description"))
        # print(business_info_content)
        # Format Contact Information Section
        contact_info_content = ""
        if business_data.get("contactInfo") and business_data["contactInfo"].get("principal"):
            info = business_data["contactInfo"]["principal"]
            contact_info_content += format_data_row("Address", info.get("address"))
            contact_info_content += format_data_row("Email", info.get("email"))
            contact_info_content += format_data_row("Mobile", info.get("mobile"))
            contact_info_content += format_data_row("Nature of Business", info.get("nature_of_business"))
        # print(contact_info_content)
        # Format Jurisdiction Information Section
        jurisdiction_info_content = ""
        if business_data.get("jurisdictionInfo"):
            info = business_data["jurisdictionInfo"]
            jurisdiction_info_content += format_data_row("Center Jurisdiction", info.get("center_jurisdiction"))
            jurisdiction_info_content += format_data_row("State Jurisdiction", info.get("state_jurisdiction"))

        # Format Financial Information Section
        financial_info_content = ""
        if business_data.get("financialInfo"):
            info = business_data["financialInfo"]
            financial_info_content += format_data_row("Annual Turnover", info.get("annual_turnover"))
            financial_info_content += format_data_row("Annual Turnover FY", info.get("annual_turnover_fy"))
            financial_info_content += format_data_row("Percentage in Cash", info.get("percentage_in_cash"))

        # Format Promoters Section
        promoters_content = ""
        if business_data.get("promoters") and len(business_data["promoters"]) > 0:
            promoters_list_items = "".join([f'<li style="margin-bottom: 5px;">{name}</li>' for name in business_data["promoters"]])

            promoters_content += f"""
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Promoters/Directors</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <ul style="margin: 0; padding-left: 20px;">
              {promoters_list_items}
            </ul>
          </td>
        </tr>
      """

        # Format Credit Assessment Section
        credit_assessment_content = ""
        if business_data.get("creditAssessment"):
            info = business_data["creditAssessment"]

            # Score with color-coded box
            score = info.get("score", 0)
            if score >= 80:
                score_color_class = "score-high"
            elif score >= 65:
                score_color_class = "score-medium"
            else:
                score_color_class = "score-low"

            credit_assessment_content += f"""
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Credit Score</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <span class="credit-score {score_color_class}">{score}%</span> - {info.get('label', '')}
          </td>
        </tr>
      """

            credit_assessment_content += format_data_row("Recommended Credit Limit", info.get("creditLimit"))

            # Positive factors with green highlights
            if info.get("positiveFactors") and len(info["positiveFactors"]) > 0:
                factors = "".join([f'<li style="margin-bottom: 5px;"><span class="positive-factor">{factor}</span></li>' for factor in info["positiveFactors"]])

                credit_assessment_content += f"""
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Positive Factors</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <ul style="margin: 0; padding-left: 20px;">
                {factors}
              </ul>
            </td>
          </tr>
        """

            # Negative factors with red highlights
            if info.get("negativeFactors") and len(info["negativeFactors"]) > 0:
                factors = "".join([f'<li style="margin-bottom: 5px;"><span class="negative-factor">{factor}</span></li>' for factor in info["negativeFactors"]])

                credit_assessment_content += f"""
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Negative Factors</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <ul style="margin: 0; padding-left: 20px;">
                {factors}
              </ul>
            </td>
          </tr>
        """

            # Recommendations
            if info.get("recommendations") and len(info["recommendations"]) > 0:
                recommendations = "".join([f'<li style="margin-bottom: 5px;">{rec}</li>' for rec in info["recommendations"]])

                credit_assessment_content += f"""
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Recommendations</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <ul style="margin: 0; padding-left: 20px;">
                {recommendations}
              </ul>
            </td>
          </tr>
        """

        # Format Filing Status Section
        filing_status_content = ""
        if (business_data.get("filingStatus") and
            isinstance(business_data["filingStatus"], list) and
            len(business_data["filingStatus"]) > 0 and
            business_data["filingStatus"][0] and
            len(business_data["filingStatus"][0]) > 0):

            # Show at most 10 recent filings
            recent_filings = business_data["filingStatus"][0][:10]

            filing_rows = ""
            for index, filing in enumerate(recent_filings):
                is_even = index % 2 == 0
                row_color = 'background-color: #F8F8FF;' if is_even else ""
                status = filing.get("status", "Unknown")
                status_color = "color: #27AE60;" if status in ["Filed", "Active"] else "color: #E74C3C;"

                # Handle date formatting
                date_of_filing = filing.get("date_of_filing", "")
                if date_of_filing:
                    try:
                        # Assuming date_of_filing is a string or datetime
                        if isinstance(date_of_filing, str):
                            parsed_date = datetime.fromisoformat(date_of_filing.replace('Z', '+00:00'))
                        else:
                            parsed_date = date_of_filing
                        formatted_date = parsed_date.strftime('%m/%d/%Y')
                    except:
                        formatted_date = str(date_of_filing)
                else:
                    formatted_date = ""

                filing_rows += f"""
          <tr style="{row_color}">
            <td style="padding: 8px; border: 1px solid #ddd;">{filing.get('return_type', '')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{filing.get('financial_year', '')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{filing.get('tax_period', '')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{formatted_date}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; {status_color}">{status}</td>
          </tr>
        """

            filing_status_content = f"""
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="background-color: #EDE9FE;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Return Type</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Financial Year</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tax Period</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Filing Date</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            {filing_rows}
          </tbody>
        </table>
      """
        # Debug: Print sections to verify content
        # print("Business Info Section:")
        # Create the complete HTML content for the email
        html_content = f"""
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Business Verification Report for {business_name}</title>
          <style>
            body {{
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }}
            .header {{
              background: linear-gradient(to right, #5D4FBF, #7E57C2);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              margin-bottom: 0;
              text-align: center;
            }}
            .subheader {{
              background-color: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-top: none;
              border-radius: 0 0 8px 8px;
              padding: 15px;
              margin-bottom: 20px;
            }}
            .subheader p {{
              margin: 5px 0;
            }}
            h2 {{
              color: #5D4FBF;
              border-bottom: 2px solid #EDE9FE;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 10px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }}
            td, th {{
              padding: 10px;
              border: 1px solid #E5E7EB;
            }}
            th, td:first-child {{
              background-color: #F9FAFB;
              font-weight: bold;
            }}
            .footer {{
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              text-align: center;
              font-size: 12px;
              color: #6B7280;
            }}
            .credit-score {{
              display: inline-block;
              padding: 5px 10px;
              color: white;
              font-weight: bold;
              border-radius: 4px;
            }}
            .score-high {{
              background-color: #27AE60;
            }}
            .score-medium {{
              background-color: #2980B9;
            }}
            .score-low {{
              background-color: #E74C3C;
            }}
            .positive-factor {{
              color: #27AE60;
              font-weight: bold;
            }}
            .negative-factor {{
              color: #E74C3C;
              font-weight: bold;
            }}
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Business Verification Report</h1>
            <p style="margin: 5px 0 0 0;">{business_name}</p>
          </div>

          <div class="subheader">
            <p><strong>GSTIN:</strong> {business_data.get('businessInfo', {}).get('gstin', 'Not Available')}</p>
            <p><strong>PAN:</strong> {business_data.get('businessInfo', {}).get('pan_number', 'Not Available')}</p>
            <p><strong>Date of Registration:</strong> {business_data.get('businessInfo', {}).get('date_of_registration', 'Not Available')}</p>
          </div>

          {create_section("Credit Assessment", credit_assessment_content)}
          {create_section("Business Information", business_info_content)}
          {create_section("Contact Information", contact_info_content)}
          {create_section("Jurisdiction Information", jurisdiction_info_content)}
          {create_section("Promoters/Directors", promoters_content)}
          {create_section("Financial Information", financial_info_content)}

          {f'<div style="margin-top: 20px;"><h2 style="color: #5D4FBF; border-bottom: 2px solid #EDE9FE; padding-bottom: 8px;">Filing Status</h2>{filing_status_content}</div>' if filing_status_content else ''}

          <div class="footer">
            <p>This report was generated on {datetime.now().strftime('%m/%d/%Y')}</p>
            <p>This email contains confidential information. Please do not forward it.</p>
          </div>
        </body>
      </html>
    """

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
