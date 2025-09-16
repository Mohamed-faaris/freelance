from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from bson import ObjectId
from config.db import userCollection
from models.user import User
import jwt
import os
import io
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import asyncio
from dataclasses import dataclass
from enum import Enum

# Load environment variables
load_dotenv()

pdfRouter = APIRouter()

# Environment variables with validation
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

# ===== CONFIGURATION =====
class Config:
    JWT_SECRET = JWT_SECRET
    PDF_TIMEOUT = 30000  # 30 seconds
    VIEWPORT = {"width": 1200, "height": 1600}
    PDF_OPTIONS = {
        "format": "A4",
        "print_background": True,
        "margin": {
            "top": "0.5in",
            "right": "0.5in",
            "bottom": "0.5in",
            "left": "0.5in",
        },
    }

# ===== TYPE DEFINITIONS =====
class ReportType(str, Enum):
    COMPANY = "company"
    BUSINESS = "business"

class CompanyStatus(BaseModel):
    summary: str
    basic: str

class CompanyData(BaseModel):
    summary: Optional[Dict[str, Any]] = None
    basic: Optional[Dict[str, Any]] = None
    cin: str
    errors: Optional[List[str]] = None
    status: Optional[CompanyStatus] = None

class BusinessContactDetails(BaseModel):
    principal: Dict[str, Any]
    additional: List[Dict[str, Any]]

class BusinessData(BaseModel):
    contact_details: BusinessContactDetails
    promoters: List[str]
    annual_turnover: str
    annual_turnover_fy: str
    percentage_in_cash_fy: str
    percentage_in_cash: str
    aadhaar_validation: str
    aadhaar_validation_date: str
    address_details: Dict[str, Any]
    gstin: str
    pan_number: str
    business_name: str
    legal_name: str
    center_jurisdiction: str
    state_jurisdiction: str
    date_of_registration: str
    constitution_of_business: str
    taxpayer_type: str
    gstin_status: str
    date_of_cancellation: str
    field_visit_conducted: str
    nature_bus_activities: List[str]
    nature_of_core_business_activity_code: str
    nature_of_core_business_activity_description: str
    filing_status: List[List[Dict[str, Any]]]
    address: Dict[str, Any]
    hsn_info: Dict[str, Any]
    filing_frequency: List[Dict[str, Any]]

class PDFRequest(BaseModel):
    data: Union[CompanyData, BusinessData]
    type: ReportType
    filename: Optional[str] = None

# ===== AUTHENTICATION SERVICE =====
class AuthService:
    @staticmethod
    def authenticate(request: Request) -> Dict[str, Any]:
        try:
            token = request.cookies.get("auth_token")
            if not token:
                return {"authenticated": False, "error": "Not authenticated"}

            decoded = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            return {"authenticated": True, "user": decoded}
        except Exception as e:
            return {"authenticated": False, "error": f"Invalid token: {str(e)}"}

# ===== UTILITY FUNCTIONS =====
class DataUtils:
    @staticmethod
    def calculate_company_age(date_string: str) -> str:
        if not date_string:
            return "N/A"

        try:
            incorporation_date = datetime.strptime(date_string, "%Y-%m-%d")
            current_date = datetime.now()

            if incorporation_date > current_date:
                return "N/A"

            age_in_years = current_date.year - incorporation_date.year
            month_diff = current_date.month - incorporation_date.month

            if month_diff < 0 or (month_diff == 0 and current_date.day < incorporation_date.day):
                age_in_years -= 1

            return f"{max(0, age_in_years)} Years"
        except:
            return "N/A"

    @staticmethod
    def format_currency(amount: Union[str, int, float]) -> str:
        if not amount or amount == "null" or amount == "N/A":
            return "N/A"

        try:
            num_amount = float(amount) if isinstance(amount, str) else amount
            if num_amount < 0:
                return "N/A"

            if num_amount >= 10000000:
                return f"₹{(num_amount / 10000000):.2f} Cr"
            elif num_amount >= 100000:
                return f"₹{(num_amount / 100000):.2f} Lakhs"
            elif num_amount >= 1000:
                return f"₹{(num_amount / 1000):.2f}K"
            else:
                return f"₹{num_amount:,.0f}"
        except:
            return "N/A"

    @staticmethod
    def format_number(amount: Union[str, int, float]) -> str:
        if not amount or amount == "null" or amount == "N/A":
            return "0"

        try:
            num_amount = float(amount) if isinstance(amount, str) else amount
            return f"{num_amount:,.0f}"
        except:
            return "0"

    @staticmethod
    def sanitize_string(text: str) -> str:
        if not text:
            return ""
        return (text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace('"', "&quot;")
                   .replace("'", "&#x27;"))

# ===== BUSINESS LOGIC SERVICES =====
class TrustScoreService:
    WEIGHTS = {
        "GSTIN_STATUS": 20,
        "FILING_COMPLIANCE": 25,
        "BUSINESS_STRUCTURE": 15,
        "VERIFICATION": 15,
        "PROMOTERS": 10,
        "TURNOVER": 10,
        "BUSINESS_AGE": 5,
    }

    @classmethod
    def calculate(cls, data: BusinessData) -> int:
        score = 0

        # GSTIN Status (20 points)
        if data.gstin_status == "Active":
            score += cls.WEIGHTS["GSTIN_STATUS"]

        # Filing Compliance (25 points)
        if data.filing_status and len(data.filing_status) > 0:
            filed_returns = sum(1 for filing in data.filing_status[0]
                              if isinstance(filing, dict) and filing.get("status") == "Filed")
            score += min(filed_returns, cls.WEIGHTS["FILING_COMPLIANCE"])

        # Business Structure (15 points)
        structure = data.constitution_of_business
        if structure and "Private Limited" in structure:
            score += cls.WEIGHTS["BUSINESS_STRUCTURE"]
        elif structure and "LLP" in structure:
            score += int(cls.WEIGHTS["BUSINESS_STRUCTURE"] * 0.8)
        elif structure and "Partnership" in structure:
            score += int(cls.WEIGHTS["BUSINESS_STRUCTURE"] * 0.5)

        # Verification (15 points)
        if data.aadhaar_validation == "Yes":
            score += 8
        if data.field_visit_conducted == "Yes":
            score += 7

        # Promoters (10 points)
        if data.promoters and len(data.promoters) >= 2:
            score += cls.WEIGHTS["PROMOTERS"]
        elif data.promoters and len(data.promoters) == 1:
            score += int(cls.WEIGHTS["PROMOTERS"] * 0.6)

        # Annual Turnover (10 points)
        turnover = data.annual_turnover
        if turnover and "above 5 Cr." in turnover:
            score += cls.WEIGHTS["TURNOVER"]
        elif turnover and "1.5 Cr. to 5 Cr." in turnover:
            score += int(cls.WEIGHTS["TURNOVER"] * 0.7)
        elif turnover and "50 Lakhs to 1.5 Cr." in turnover:
            score += int(cls.WEIGHTS["TURNOVER"] * 0.5)

        # Business Age (5 points)
        if data.date_of_registration:
            try:
                registration_date = datetime.strptime(data.date_of_registration, "%Y-%m-%d")
                age_in_years = (datetime.now() - registration_date).days / 365.25

                if age_in_years >= 5:
                    score += cls.WEIGHTS["BUSINESS_AGE"]
                elif age_in_years >= 3:
                    score += 3
                elif age_in_years >= 1:
                    score += 1
            except:
                pass

        return min(score, 100)

class CreditAssessmentService:
    @staticmethod
    def calculate_credit_limit(data: BusinessData, trust_score: int) -> float:
        def estimate_turnover_from_slab(turnover_slab: str) -> float:
            mappings = {
                "above 5 Cr.": 7500000,
                "1.5 Cr. to 5 Cr.": 3250000,
                "50 Lakhs to 1.5 Cr.": 1000000,
            }

            for key, value in mappings.items():
                if key in turnover_slab:
                    return value
            return 250000

        estimated_turnover = estimate_turnover_from_slab(data.annual_turnover or "")

        multipliers = {
            "excellent": 0.25,  # 80+ score
            "good": 0.15,       # 65-79 score
            "fair": 0.1,        # 50-64 score
            "poor": 0.05        # <50 score
        }

        if trust_score >= 80:
            return estimated_turnover * multipliers["excellent"]
        elif trust_score >= 65:
            return estimated_turnover * multipliers["good"]
        elif trust_score >= 50:
            return estimated_turnover * multipliers["fair"]
        else:
            return estimated_turnover * multipliers["poor"]

    @staticmethod
    def get_credit_score_class(score: int) -> str:
        if score >= 80:
            return "low-risk"
        elif score >= 65:
            return "moderate-risk"
        else:
            return "high-risk"

    @staticmethod
    def get_credit_label(score: int) -> str:
        if score >= 80:
            return "Low Risk"
        elif score >= 65:
            return "Moderate Risk"
        else:
            return "High Risk"

# ===== CONTENT GENERATORS =====
class ContentGenerator:
    @staticmethod
    def generate_financial_highlights(financials: List[Dict[str, Any]]) -> str:
        if not financials:
            return "<p>No financial data available</p>"

        latest_financial = financials[0]
        highlights = [
            {"label": "Total Income", "value": DataUtils.format_number(latest_financial.get("TotalIncome", 0))},
            {"label": "Total Expense", "value": DataUtils.format_number(latest_financial.get("TotalExpense", 0))},
            {"label": "Profit After Tax", "value": DataUtils.format_number(latest_financial.get("ProfitAfterTax", 0))},
            {"label": "Net Worth", "value": DataUtils.format_number(latest_financial.get("NetWorth", 0))}
        ]

        return f"""
        <div class="financial-highlights">
          {"".join(f'''
            <div class="financial-card">
              <div class="label">{item["label"]}</div>
              <div class="value">₹{item["value"]}</div>
            </div>
          ''' for item in highlights)}
        </div>
        """

    @staticmethod
    def generate_directors_information(directors: List[Dict[str, Any]]) -> str:
        if not directors:
            return "<p>No directors information available</p>"

        return "".join(f'''
          <div class="director-card">
            <div class="director-name">{index + 1}. {DataUtils.sanitize_string(director.get("DirectorName", "N/A"))}</div>
            <div class="director-details">
              <div class="director-detail">
                <span class="label">DIN:</span> {director.get("DirectorDin", "N/A")}
              </div>
              <div class="director-detail">
                <span class="label">Designation:</span> {DataUtils.sanitize_string(director.get("DirectorDesignation", "N/A"))}
              </div>
              <div class="director-detail">
                <span class="label">Appointment Date:</span> {director.get("DirectorDateOfAppnt", "N/A")}
              </div>
              <div class="director-detail">
                <span class="label">PAN:</span> {director.get("DirectorPANNumber", "N/A")}
              </div>
              <div class="director-detail">
                <span class="label">Email:</span> {director.get("DirectorEmail", "N/A")}
              </div>
            </div>
          </div>
        ''' for index, director in enumerate(directors))

    @staticmethod
    def generate_risk_factors(data: BusinessData) -> str:
        positive, negative = ContentGenerator._analyze_risk_factors(data)

        def render_factors(factors: List[Dict[str, str]], factor_type: str) -> str:
            if not factors:
                return ""

            icon = "✅" if factor_type == "positive" else "⚠️"
            header = "Positive Factors" if factor_type == "positive" else "Risk Factors"

            return f"""
            <h4>{icon} {header}</h4>
            {"".join(f'''
              <div class="risk-item {factor_type}">
                <div class="risk-icon">{icon}</div>
                <div class="risk-content">
                  <div class="risk-title">{DataUtils.sanitize_string(factor["title"])}</div>
                  <div class="risk-description">{DataUtils.sanitize_string(factor["description"])}</div>
                </div>
              </div>
            ''' for factor in factors)}
            """

        return f"""
          <div class="risk-factors">
            {render_factors(positive, "positive")}
            {render_factors(negative, "negative")}
          </div>
        """

    @staticmethod
    def _analyze_risk_factors(data: BusinessData) -> tuple:
        positive = []
        negative = []

        # Positive factors analysis
        if data.gstin_status == "Active":
            positive.append({
                "title": "Active GSTIN Status",
                "description": "Business is currently registered and compliant with GST regulations"
            })

        if data.filing_status and len(data.filing_status) > 0 and len(data.filing_status[0]) >= 15:
            positive.append({
                "title": "Excellent Filing Compliance",
                "description": "All expected GST returns have been filed, demonstrating strong financial discipline"
            })

        if data.promoters and len(data.promoters) >= 2:
            positive.append({
                "title": "Multiple Promoters/Directors",
                "description": "Having multiple promoters indicates shared business responsibility and expertise"
            })

        if data.constitution_of_business == "Private Limited Company":
            positive.append({
                "title": "Private Limited Company Structure",
                "description": "Provides good regulatory framework and liability protection"
            })

        # Business age analysis
        if data.date_of_registration:
            try:
                registration_date = datetime.strptime(data.date_of_registration, "%Y-%m-%d")
                age_in_years = (datetime.now() - registration_date).days / 365.25

                if age_in_years >= 3:
                    positive.append({
                        "title": "Established Business History",
                        "description": "The company has been operating for 3+ years, showing business stability"
                    })
                else:
                    negative.append({
                        "title": "Recent Business Registration",
                        "description": "The business has been operating for less than 3 years, indicating limited track record"
                    })
            except:
                pass

        # Negative factors analysis
        if data.aadhaar_validation != "Yes":
            negative.append({
                "title": "No Aadhaar Validation",
                "description": "Lack of Aadhaar validation reduces the verification level of the business"
            })

        if data.field_visit_conducted != "Yes":
            negative.append({
                "title": "No Field Verification",
                "description": "No physical verification has been conducted, which increases risk assessment"
            })

        return positive, negative

# ===== HTML TEMPLATE GENERATORS =====
class TemplateGenerator:
    @staticmethod
    def generate_company_html(data: CompanyData) -> str:
        company_info = data.summary.get("InstaSummary", {}).get("CompanyMasterSummary", {}) if data.summary else {}
        basic_info = data.basic.get("InstaBasic", {}).get("CompanyMasterSummary", {}) if data.basic else {}
        directors = (data.summary.get("InstaSummary", {}).get("DirectorSignatoryMasterSummary", {}).get("DirectorCurrentMasterSummary", {}).get("Director", [])
                    if data.summary else [])
        financials = (data.summary.get("InstaSummary", {}).get("FinancialsSummary", {}).get("FinancialsYearWise", [])
                     if data.summary else [])

        company_name = (company_info.get("CompanyName") or
                       basic_info.get("CompanyName") or
                       f"Company ({data.cin})")
        company_cin = (company_info.get("CompanyCIN") or
                      basic_info.get("CompanyCin") or
                      data.cin)

        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Financial Analysis Report - {DataUtils.sanitize_string(company_name)}</title>
            <style>{StyleGenerator.get_common_styles()}</style>
        </head>
        <body>
            {TemplateGenerator._generate_cover_page(company_name, "Detailed Financial Analysis Report")}
            {TemplateGenerator._generate_index_page(company_name)}
            {TemplateGenerator._generate_company_highlights_page(company_name, company_info, basic_info, directors, financials, company_cin)}
            {TemplateGenerator._generate_directors_page(company_name, directors)}
            {TemplateGenerator._generate_financials_page(company_name, financials) if financials else ""}
            {TemplateGenerator._generate_data_status_page(company_name, data)}
        </body>
        </html>
        """

    @staticmethod
    def generate_business_html(data: BusinessData) -> str:
        trust_score = TrustScoreService.calculate(data)
        credit_limit = CreditAssessmentService.calculate_credit_limit(data, trust_score)
        business_name = data.business_name or data.legal_name

        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Business Verification Report - {DataUtils.sanitize_string(business_name)}</title>
            <style>{StyleGenerator.get_common_styles()}</style>
        </head>
        <body>
            {TemplateGenerator._generate_cover_page(business_name, "Business Verification Report", data.gstin)}
            {TemplateGenerator._generate_business_highlights_page(data, trust_score, credit_limit)}
            {TemplateGenerator._generate_promoters_page(data)}
            {TemplateGenerator._generate_filing_status_page(data)}
            {TemplateGenerator._generate_risk_assessment_page(data)}
        </body>
        </html>
        """

    @staticmethod
    def _generate_cover_page(company_name: str, report_type: str, gstin: str = None) -> str:
        current_date = datetime.now().strftime("%B %d, %Y")
        company_info = {
            "name": "SYT SOLUTIONS PVT LTD",
            "location": "GURUGRAM-122001",
            "website": "https://www.sytsolutions.co.in/",
            "contact": "9220688543"
        }

        gstin_info = f'<p>GSTIN: {gstin}</p>' if gstin else ''

        return f"""
          <div class="page cover-page">
              <div class="header-info">
                  <div class="company-info">
                      <strong>{report_type}</strong><br>
                      <span class="company-name">{DataUtils.sanitize_string(company_name)}</span><br>
                      {gstin_info}
                      Report Date: {current_date}<br><br>
                      Report prepared by:<br>
                      <strong>{company_info["name"]}</strong><br>
                      {company_info["location"]}<br>
                      Website: {company_info["website"]}<br>
                      Contact: {company_info["contact"]}
                  </div>
              </div>

              <div class="logo-container">
                  <div class="logo">
                      <div class="logo-icon">
                          <img src="https://symbiosisinfrabucket.s3.ap-south-1.amazonaws.com/logoa.webp" alt="Argus Logo" width="60" height="60" />
                      </div>
                      <div class="logo-text">Argus</div>
                      <div class="logo-subtitle">BUSINESS DATA INTELLIGENCE</div>
                  </div>
              </div>

              <div class="cover-title">
                  <h1>{report_type}</h1>
                  <h2>{DataUtils.sanitize_string(company_name)}</h2>
                  <p>Report Date: {current_date}</p>
              </div>

              <div class="footer-info">
                  <p>Report prepared by:</p>
                  <strong>{company_info["name"]}</strong><br>
                  {company_info["location"]}<br>
                  Website: {company_info["website"]}<br>
                  Contact: {company_info["contact"]}
              </div>
          </div>
        """

    @staticmethod
    def _generate_index_page(company_name: str) -> str:
        index_items = [
            {"number": "1.", "title": "Company Highlights", "page": "3", "subitems": [
                {"number": "1.1.", "title": "Basic Information", "page": "3"},
                {"number": "1.2.", "title": "KYC Information", "page": "3"},
                {"number": "1.3.", "title": "Corporate Information", "page": "3"}
            ]},
            {"number": "2.", "title": "Financial Highlights", "page": "3"},
            {"number": "3.", "title": "Financial Statements", "page": "5"},
            {"number": "4.", "title": "Directors Detail", "page": "8"},
            {"number": "5.", "title": "Directors Information", "page": "10"}
        ]

        return f"""
          <div class="page index-page">
              {TemplateGenerator._generate_page_header(company_name)}
              <h2 class="section-title">INDEX</h2>
              <div class="index-content">
                  {"".join(f'''
                    <div class="index-item">
                        <span class="index-number">{item["number"]}</span>
                        <span class="index-title">{item["title"]}</span>
                        <span class="dots"></span>
                        <span class="page-num">{item["page"]}</span>
                    </div>
                    {"".join(f'''
                      <div class="index-subitem">
                          <span class="index-number">{subitem["number"]}</span>
                          <span class="index-title">{subitem["title"]}</span>
                          <span class="dots"></span>
                          <span class="page-num">{subitem["page"]}</span>
                      </div>
                    ''' for subitem in item["subitems"])}
                  ''' for item in index_items)}
              </div>
          </div>
        """

    @staticmethod
    def _generate_page_header(company_name: str) -> str:
        return f"""
          <div class="page-header">
              <div class="logo-small">
                  <img src="https://symbiosisinfrabucket.s3.ap-south-1.amazonaws.com/logoa.webp" alt="Argus Logo" width="24" height="24" />
              </div>
              <div class="company-name-header">{DataUtils.sanitize_string(company_name)}</div>
          </div>
        """

    @staticmethod
    def _generate_company_highlights_page(company_name: str, company_info: Dict[str, Any],
                                        basic_info: Dict[str, Any], directors: List[Dict[str, Any]],
                                        financials: List[Dict[str, Any]], company_cin: str) -> str:
        return f"""
          <div class="page">
              {TemplateGenerator._generate_page_header(company_name)}
              <h2 class="section-title">1. Company Highlights</h2>

              <h3 class="subsection-title">1.1. Basic Information</h3>
              <table class="info-table">
                  <tr>
                      <td class="label">Age (Incorp. Date)</td>
                      <td>{DataUtils.calculate_company_age(company_info.get("CompanyDateOfInc") or basic_info.get("CompanyDateOfInc"))} ({company_info.get("CompanyDateOfInc") or basic_info.get("CompanyDateOfInc") or "N/A"})</td>
                      <td class="label">Company Status</td>
                      <td>{company_info.get("CompanyMcaStatus") or basic_info.get("CompanyMcaStatus") or "N/A"}</td>
                  </tr>
                  <tr>
                      <td class="label">Company Type</td>
                      <td>{company_info.get("CompanyClass") or basic_info.get("CompanyClass") or "N/A"}</td>
                      <td class="label">Paid up Capital</td>
                      <td>{DataUtils.format_currency(company_info.get("CompanyPaidUpCapital") or basic_info.get("CompanyPaidUpCapital"))}</td>
                  </tr>
                  <tr>
                      <td class="label">Company SubCategory</td>
                      <td>{company_info.get("CompanyCategory") or basic_info.get("CompanyCategory") or "N/A"}</td>
                      <td class="label">Directors</td>
                      <td>Current: {len(directors)} Directors</td>
                  </tr>
                  <tr>
                      <td class="label">Company Website</td>
                      <td>{company_info.get("CompanyWebSite") or basic_info.get("CompanyWebSite") or "N/A"}</td>
                      <td class="label">Industry</td>
                      <td>{company_info.get("CompanyMcaIndustry") or basic_info.get("CompanyMcaIndustry") or "N/A"}</td>
                  </tr>
              </table>

              <h2 class="section-title">2. Financial Highlights</h2>
              {ContentGenerator.generate_financial_highlights(financials)}
          </div>
        """

    @staticmethod
    def _generate_directors_page(company_name: str, directors: List[Dict[str, Any]]) -> str:
        return f"""
          <div class="page">
              {TemplateGenerator._generate_page_header(company_name)}
              <h2 class="section-title">4. Directors Detail</h2>

              <h3 class="subsection-title">4.1. Current Directors</h3>
              <table class="directors-table">
                  <thead>
                      <tr>
                          <th>Company Directors</th>
                          <th>Director DIN</th>
                          <th>Designation</th>
                          <th>Appointment Date</th>
                          <th>Email</th>
                      </tr>
                  </thead>
                  <tbody>
                      {"".join(f'''
                          <tr>
                              <td>{DataUtils.sanitize_string(director.get("DirectorName", "N/A"))}</td>
                              <td>{director.get("DirectorDin", "N/A")}</td>
                              <td>{DataUtils.sanitize_string(director.get("DirectorDesignation", "N/A"))}</td>
                              <td>{director.get("DirectorDateOfAppnt", "N/A")}</td>
                              <td>{director.get("DirectorEmail", "N/A")}</td>
                          </tr>
                      ''' for director in directors)}
                  </tbody>
              </table>

              <h2 class="section-title">5. Directors Information</h2>
              {ContentGenerator.generate_directors_information(directors)}
          </div>
        """

    @staticmethod
    def _generate_financials_page(company_name: str, financials: List[Dict[str, Any]]) -> str:
        return f"""
          <div class="page">
              {TemplateGenerator._generate_page_header(company_name)}
              <h2 class="section-title">3. Financial Statements</h2>

              <h3 class="subsection-title">3.1. Financial Summary</h3>
              <table class="financial-table">
                  <thead>
                      <tr>
                          <th>Financial Year</th>
                          <th>Total Income</th>
                          <th>Total Expense</th>
                          <th>Profit Before Tax</th>
                          <th>Profit After Tax</th>
                          <th>Net Worth</th>
                      </tr>
                  </thead>
                  <tbody>
                      {"".join(f'''
                          <tr>
                              <td>{financial.get("FinancialYear", "N/A")}</td>
                              <td>₹{DataUtils.format_number(financial.get("TotalIncome", 0))}</td>
                              <td>₹{DataUtils.format_number(financial.get("TotalExpense", 0))}</td>
                              <td>₹{DataUtils.format_number(financial.get("ProfitBeforeTax", 0))}</td>
                              <td>₹{DataUtils.format_number(financial.get("ProfitAfterTax", 0))}</td>
                              <td>₹{DataUtils.format_number(financial.get("NetWorth", 0))}</td>
                          </tr>
                      ''' for financial in financials)}
                  </tbody>
              </table>
          </div>
        """

    @staticmethod
    def _generate_data_status_page(company_name: str, data: CompanyData) -> str:
        return f"""
          <div class="page">
              {TemplateGenerator._generate_page_header(company_name)}
              <h2 class="section-title">Data Availability Status</h2>

              <table class="info-table">
                  <tr>
                      <td class="label">Summary API Status</td>
                      <td class="{"status-success" if data.summary else "status-failed"}">
                          {"✓ Available" if data.summary else "✗ Failed"}
                      </td>
                  </tr>
                  <tr>
                      <td class="label">Basic API Status</td>
                      <td class="{"status-success" if data.basic else "status-failed"}">
                          {"✓ Available" if data.basic else "✗ Failed"}
                      </td>
                  </tr>
                  <tr>
                      <td class="label">Report Generated On</td>
                      <td>{datetime.now().strftime("%B %d, %Y")}</td>
                  </tr>
              </table>

              {"".join(f'''
                <h3 class="subsection-title">Errors and Warnings</h3>
                <div class="error-section">
                    {"".join(f'<div class="error-item">⚠️ {DataUtils.sanitize_string(error)}</div>' for error in data.errors)}
                </div>
              ''' if data.errors else "")}

              {TemplateGenerator._generate_disclaimer()}
          </div>
        """

    @staticmethod
    def _generate_business_highlights_page(data: BusinessData, trust_score: int, credit_limit: float) -> str:
        business_name = data.business_name or data.legal_name

        return f"""
          <div class="page">
              <div class="page-header">
                  <div class="logo-small">Argus</div>
                  <div class="company-name-header">{DataUtils.sanitize_string(business_name)}</div>
              </div>

              <h2 class="section-title">1. Business Highlights</h2>

              <!-- Credit Assessment -->
              <div class="credit-assessment">
                  <h3 class="subsection-title">Credit Assessment</h3>
                  <div class="credit-score {CreditAssessmentService.get_credit_score_class(trust_score)}">
                      <div class="score-circle">
                          <span class="score-number">{trust_score}%</span>
                      </div>
                      <div class="score-details">
                          <div class="score-label">{CreditAssessmentService.get_credit_label(trust_score)}</div>
                          <div class="credit-limit">Recommended Credit Limit: {DataUtils.format_currency(credit_limit)}</div>
                      </div>
                  </div>
              </div>

              <h3 class="subsection-title">1.1. Basic Information</h3>
              <table class="info-table">
                  <tr>
                      <td class="label">Business Name</td>
                      <td>{DataUtils.sanitize_string(data.business_name or "N/A")}</td>
                      <td class="label">Legal Name</td>
                      <td>{DataUtils.sanitize_string(data.legal_name or "N/A")}</td>
                  </tr>
                  <tr>
                      <td class="label">GSTIN</td>
                      <td>{data.gstin or "N/A"}</td>
                      <td class="label">PAN Number</td>
                      <td>{data.pan_number or "N/A"}</td>
                  </tr>
                  <tr>
                      <td class="label">Constitution of Business</td>
                      <td>{DataUtils.sanitize_string(data.constitution_of_business or "N/A")}</td>
                      <td class="label">Taxpayer Type</td>
                      <td>{DataUtils.sanitize_string(data.taxpayer_type or "N/A")}</td>
                  </tr>
                  <tr>
                      <td class="label">GSTIN Status</td>
                      <td class="{"status-success" if data.gstin_status == "Active" else "status-inactive"}">
                          {data.gstin_status or "N/A"}
                      </td>
                      <td class="label">Date of Registration</td>
                      <td>{data.date_of_registration or "N/A"}</td>
                  </tr>
              </table>

              <h3 class="subsection-title">1.2. Financial Information</h3>
              <table class="info-table">
                  <tr>
                      <td class="label">Annual Turnover</td>
                      <td>{DataUtils.sanitize_string(data.annual_turnover or "N/A")}</td>
                      <td class="label">Annual Turnover FY</td>
                      <td>{data.annual_turnover_fy or "N/A"}</td>
                  </tr>
                  <tr>
                      <td class="label">Percentage in Cash</td>
                      <td>{data.percentage_in_cash or "N/A"}</td>
                      <td class="label">Aadhaar Validation</td>
                      <td class="{"status-success" if data.aadhaar_validation == "Yes" else "status-failed"}">
                          {data.aadhaar_validation or "N/A"}
                      </td>
                  </tr>
              </table>
          </div>
        """

    @staticmethod
    def _generate_promoters_page(data: BusinessData) -> str:
        business_name = data.business_name or data.legal_name

        return f"""
          <div class="page">
              <div class="page-header">
                  <div class="logo-small">Argus</div>
                  <div class="company-name-header">{DataUtils.sanitize_string(business_name)}</div>
              </div>

              <h2 class="section-title">2. Promoters/Directors</h2>

              {"".join(f'''
                <table class="directors-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Promoter/Director Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {"".join(f'''
                            <tr>
                                <td>{index + 1}</td>
                                <td>{DataUtils.sanitize_string(promoter)}</td>
                            </tr>
                        ''' for index, promoter in enumerate(data.promoters))}
                    </tbody>
                </table>
              ''' if data.promoters else '<p>No promoter information available</p>')}

              <h2 class="section-title">3. Business Activities</h2>

              {"".join(f'''
                <div class="business-activities">
                    <h3 class="subsection-title">Nature of Business Activities:</h3>
                    <ul>
                        {"".join(f'<li>{DataUtils.sanitize_string(activity)}</li>' for activity in data.nature_bus_activities)}
                    </ul>
                </div>
              ''' if data.nature_bus_activities else '<p>No business activities information available</p>')}

              <div class="core-activity">
                  <h3 class="subsection-title">Core Business Activity:</h3>
                  <p><strong>Code:</strong> {data.nature_of_core_business_activity_code or "N/A"}</p>
                  <p><strong>Description:</strong> {DataUtils.sanitize_string(data.nature_of_core_business_activity_description or "N/A")}</p>
              </div>
          </div>
        """

    @staticmethod
    def _generate_filing_status_page(data: BusinessData) -> str:
        business_name = data.business_name or data.legal_name

        if not data.filing_status or len(data.filing_status) == 0 or len(data.filing_status[0]) == 0:
            return ""

        return f"""
          <div class="page">
              <div class="page-header">
                  <div class="logo-small">Argus</div>
                  <div class="company-name-header">{DataUtils.sanitize_string(business_name)}</div>
              </div>

              <h2 class="section-title">4. Filing Status</h2>

              <table class="filing-table">
                  <thead>
                      <tr>
                          <th>Return Type</th>
                          <th>Financial Year</th>
                          <th>Tax Period</th>
                          <th>Filing Date</th>
                          <th>Status</th>
                          <th>Mode</th>
                      </tr>
                  </thead>
                  <tbody>
                      {"".join(f'''
                          <tr>
                              <td>{DataUtils.sanitize_string(filing.get("return_type", "N/A"))}</td>
                              <td>{filing.get("financial_year", "N/A")}</td>
                              <td>{filing.get("tax_period", "N/A")}</td>
                              <td>{datetime.strptime(filing.get("date_of_filing"), "%Y-%m-%d").strftime("%b %d, %Y") if filing.get("date_of_filing") else "N/A"}</td>
                              <td class="{"status-success" if filing.get("status") == "Filed" else "status-failed"}">
                                  {filing.get("status", "N/A")}
                              </td>
                              <td>{filing.get("mode_of_filing", "N/A")}</td>
                          </tr>
                      ''' for filing in data.filing_status[0][:20])}
                  </tbody>
              </table>
          </div>
        """

    @staticmethod
    def _generate_risk_assessment_page(data: BusinessData) -> str:
        business_name = data.business_name or data.legal_name

        return f"""
          <div class="page">
              <div class="page-header">
                  <div class="logo-small">Argus</div>
                  <div class="company-name-header">{DataUtils.sanitize_string(business_name)}</div>
              </div>

              <h2 class="section-title">5. Risk Assessment</h2>

              {ContentGenerator.generate_risk_factors(data)}

              <div class="recommendations">
                  <h3 class="subsection-title">Recommendations:</h3>
                  <ul>
                      <li>Complete Aadhaar validation for all promoters</li>
                      <li>Arrange for field verification to strengthen credibility</li>
                      <li>Provide audited financial statements for better assessment</li>
                      <li>Share details of existing loans and banking relationships</li>
                  </ul>
              </div>

              {TemplateGenerator._generate_disclaimer()}
              {TemplateGenerator._generate_copyright()}
          </div>
        """

    @staticmethod
    def _generate_disclaimer() -> str:
        return """
          <div class="disclaimer">
              <h3>DISCLAIMER</h3>
              <p>This report has been prepared by Syt Solutions Private Limited ("Company") under its product name Argus, solely on the basis of information procured from publicly available sources and, where necessary, in consultation with subject matter experts. The contents of this report are provided for general informational purposes only and do not constitute professional advice, opinion, or recommendation of any kind.</p>

              <p>While due care and skill have been exercised in collating the information and preparing this report, the Company does not, in any manner, represent, warrant, or guarantee the accuracy, adequacy, completeness, reliability, timeliness, non-infringement, merchantability, or fitness of the report for any particular purpose.</p>

              <p>The recipient is advised to exercise independent judgment and obtain appropriate professional consultation before placing reliance upon any part of this report.</p>
          </div>
        """

    @staticmethod
    def _generate_copyright() -> str:
        return """
          <div class="copyright-section">
              <h3>COPYRIGHT</h3>
              <p>© Syt Solutions Private Limited. This report is prepared, owned and distributed by Syt Solutions Private Limited. The report is meant for the sole and exclusive use of the recipient to whom it is addressed by Syt Solutions Private Limited. This report either in full or in part, cannot be redistributed and/or reproduced in any form either electronic or physical, without written consent of the owner.</p>
          </div>
        """

# ===== STYLE GENERATOR =====
class StyleGenerator:
    @staticmethod
    def get_common_styles() -> str:
        return """
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
        }

        .page {
            page-break-after: always;
            min-height: 100vh;
            padding: 20px;
            position: relative;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        /* Cover Page Styles */
        .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
        }

        .header-info {
            text-align: left;
            font-size: 10px;
            line-height: 1.5;
        }

        .company-name {
            font-size: 14px;
            font-weight: bold;
        }

        .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
        }

        .logo {
            background: rgba(255, 255, 255, 0.2);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .logo-text {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .logo-icon {
            margin-bottom: 15px;
        }

        .logo-subtitle {
            font-size: 12px;
            letter-spacing: 2px;
            opacity: 0.9;
        }

        .cover-title h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 300;
        }

        .cover-title h2 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #f0f0f0;
        }

        .cover-title p {
            font-size: 14px;
            opacity: 0.9;
        }

        .footer-info {
            text-align: center;
            font-size: 10px;
            line-height: 1.5;
        }

        /* Page Header */
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .logo-small {
            background: #667eea;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo-small img {
            width: 24px;
            height: 24px;
        }

        .company-name-header {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }

        /* Section Titles */
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }

        .subsection-title {
            font-size: 14px;
            font-weight: bold;
            color: #555;
            margin: 15px 0 10px 0;
            background: #f5f5f5;
            padding: 8px 12px;
            border-left: 4px solid #667eea;
        }

        /* Tables */
        .info-table, .directors-table, .financial-table, .filing-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .info-table td, .directors-table td, .directors-table th,
        .financial-table td, .financial-table th,
        .filing-table td, .filing-table th {
            border: 1px solid #ddd;
            padding: 8px;
            vertical-align: top;
        }

        .info-table .label {
            background: #f8f9fa;
            font-weight: bold;
            width: 25%;
            color: #555;
        }

        .directors-table th, .financial-table th, .filing-table th {
            background: #667eea;
            color: white;
            font-weight: bold;
            text-align: center;
        }

        .directors-table tr:nth-child(even),
        .financial-table tr:nth-child(even),
        .filing-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        /* Credit Assessment */
        .credit-assessment {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .credit-score {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .score-number {
            font-size: 20px;
            font-weight: bold;
        }

        .score-details {
            flex-grow: 1;
        }

        .score-label {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .credit-limit {
            font-size: 14px;
            opacity: 0.9;
        }

        .credit-score.low-risk .score-circle {
            background: rgba(39, 174, 96, 0.3);
        }

        .credit-score.moderate-risk .score-circle {
            background: rgba(52, 152, 219, 0.3);
        }

        .credit-score.high-risk .score-circle {
            background: rgba(231, 76, 60, 0.3);
        }

        /* Status Indicators */
        .status-success {
            color: #27ae60;
            font-weight: bold;
        }

        .status-failed, .status-inactive {
            color: #e74c3c;
            font-weight: bold;
        }

        /* Financial Highlights */
        .financial-highlights {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .financial-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .financial-card .label {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
        }

        .financial-card .value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }

        /* Directors Information */
        .director-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }

        .director-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }

        .director-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }

        .director-detail {
            font-size: 10px;
        }

        .director-detail .label {
            font-weight: bold;
            color: #666;
        }

        /* Risk Factors */
        .risk-factors {
            margin-bottom: 20px;
        }

        .risk-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
        }

        .risk-item.positive {
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
        }

        .risk-item.negative {
            background: #fdeaea;
            border-left: 4px solid #e74c3c;
        }

        .risk-icon {
            margin-right: 10px;
            font-size: 14px;
        }

        .risk-content {
            flex-grow: 1;
        }

        .risk-title {
            font-weight: bold;
            margin-bottom: 3px;
        }

        .risk-description {
            font-size: 10px;
            color: #666;
        }

        /* Business Activities */
        .business-activities ul {
            list-style-type: disc;
            margin-left: 20px;
        }

        .business-activities li {
            margin-bottom: 5px;
        }

        .core-activity {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
        }

        /* Recommendations */
        .recommendations {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .recommendations ul {
            list-style-type: disc;
            margin-left: 20px;
        }

        .recommendations li {
            margin-bottom: 5px;
        }

        /* Index Page */
        .index-page {
            padding: 30px;
        }

        .index-content {
            margin-top: 30px;
        }

        .index-item, .index-subitem {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .index-subitem {
            margin-left: 20px;
            font-size: 11px;
        }

        .index-number {
            min-width: 30px;
            font-weight: bold;
        }

        .index-title {
            flex-grow: 1;
        }

        .dots {
            flex-grow: 1;
            border-bottom: 1px dotted #ccc;
            margin: 0 10px;
            height: 1px;
        }

        .page-num {
            min-width: 20px;
            text-align: right;
            font-weight: bold;
        }

        /* Error Section */
        .error-section {
            background: #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .error-item {
            margin-bottom: 5px;
            font-size: 10px;
        }

        /* Disclaimer & Copyright */
        .disclaimer, .copyright-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 9px;
            line-height: 1.5;
            border: 1px solid #ddd;
        }

        .disclaimer h3, .copyright-section h3 {
            font-size: 12px;
            margin-bottom: 10px;
            color: #333;
            text-align: center;
            font-weight: bold;
        }

        .disclaimer p, .copyright-section p {
            margin-bottom: 10px;
            text-align: justify;
            text-indent: 20px;
        }

        /* Print Optimizations */
        @media print {
            .page {
                margin: 0;
                padding: 15px;
            }

            body {
                font-size: 10px;
            }

            .page-header {
                display: flex !important;
            }

            .logo-small, .credit-assessment, .cover-page {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
        """

# ===== PDF GENERATION SERVICE =====
class PDFGenerationService:
    @staticmethod
    async def generate_pdf(html_content: str, filename: str) -> bytes:
        """Generate PDF from HTML content using weasyprint"""
        try:
            # Import weasyprint here to handle cases where it might not be installed
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration

            # Create font configuration
            font_config = FontConfiguration()

            # Create HTML object
            html_doc = HTML(string=html_content)

            # Generate PDF with custom CSS for better rendering
            css = CSS(string="""
                @page {
                    size: A4;
                    margin: 0.5in;
                }
                body {
                    font-family: Arial, sans-serif;
                }
            """)

            # Generate PDF
            pdf_bytes = html_doc.write_pdf(stylesheets=[css], font_config=font_config)

            return pdf_bytes

        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PDF generation library not installed. Please install weasyprint: pip install weasyprint"
            )
        except Exception as error:
            print(f"PDF Generation Error: {error}")
            raise HTTPException(
                status_code=500,
                detail=f"PDF generation failed: {str(error)}"
            )

# ===== ERROR HANDLING =====
class APIError(Exception):
    def __init__(self, message: str, status_code: int = 500, code: str = None):
        self.message = message
        self.status_code = status_code
        self.code = code or "INTERNAL_ERROR"
        super().__init__(message)

# ===== MAIN ROUTE HANDLERS =====
@pdfRouter.post("/generate-pdf")
async def generate_pdf(request: Request, data: PDFRequest):
    """Generate PDF report from business/company data"""
    try:
        # Authenticate user
        auth = AuthService.authenticate(request)
        if not auth["authenticated"]:
            raise APIError(auth["error"], 401, "UNAUTHORIZED")

        print(f"Generating {data.type.value} PDF for user {auth['user']['id']}")

        # Generate HTML content based on type
        if data.type == ReportType.COMPANY:
            html_content = TemplateGenerator.generate_company_html(data.data)
        else:  # BUSINESS
            html_content = TemplateGenerator.generate_business_html(data.data)

        # Generate PDF
        pdf_bytes = await PDFGenerationService.generate_pdf(
            html_content,
            data.filename or f"{data.type.value}-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        # Set response headers
        filename = data.filename or f"{data.type.value}-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        headers = {
            "Content-Type": "application/pdf",
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Content-Length": str(len(pdf_bytes)),
            "Cache-Control": "no-cache, no-store, must-revalidate",
        }

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers=headers
        )

    except APIError as e:
        return Response(
            content=f'{{"error": "{e.message}", "code": "{e.code}"}}',
            status_code=e.status_code,
            media_type="application/json"
        )
    except Exception as error:
        print(f"PDF Generation Error: {error}")
        return Response(
            content=f'{{"error": "Failed to generate PDF", "code": "INTERNAL_ERROR", "details": "{str(error)}"}}',
            status_code=500,
            media_type="application/json"
        )

@pdfRouter.get("/health")
async def health_check(request: Request):
    """Health check endpoint"""
    try:
        # Authenticate user
        auth = AuthService.authenticate(request)
        if not auth["authenticated"]:
            raise APIError(auth["error"], 401, "UNAUTHORIZED")

        return {
            "message": "PDF Generation API is running",
            "version": "2.0.0",
            "supportedTypes": ["company", "business"],
            "features": {
                "authentication": True,
                "validation": True,
                "errorHandling": True,
                "sanitization": True,
            },
            "status": "healthy"
        }

    except APIError as e:
        return Response(
            content=f'{{"error": "{e.message}", "code": "{e.code}"}}',
            status_code=e.status_code,
            media_type="application/json"
        )
    except Exception as error:
        return Response(
            content='{"error": "Health check failed"}',
            status_code=500,
            media_type="application/json"
        )
