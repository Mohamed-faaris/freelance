import { useState, FormEvent, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { utils, writeFile } from "xlsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  DollarSign,
  Users,
  BarChart2,
  Percent,
  ClipboardCheck,
  CreditCard,
  FileDigit,
  Hash,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  FileClock,
  FileCheck,
  FileX,
  Check,
  Info,
  Download,
  Sheet,
  Send,
  X,
  Gavel,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import CourtCaseTab from "./CourtCaseTab";
import { API_URL } from "config";

interface BusinessProfileData {
  contact_details: {
    principal: {
      address: string;
      email: string;
      mobile: string;
      nature_of_business: string;
    };
    additional: any[];
  };
  promoters: string[];
  annual_turnover: string;
  annual_turnover_fy: string;
  percentage_in_cash_fy: string;
  percentage_in_cash: string;
  aadhaar_validation: string;
  aadhaar_validation_date: string;
  address_details: any;
  gstin: string;
  pan_number: string;
  business_name: string;
  legal_name: string;
  center_jurisdiction: string;
  state_jurisdiction: string;
  date_of_registration: string;
  constitution_of_business: string;
  taxpayer_type: string;
  gstin_status: string;
  date_of_cancellation: string;
  field_visit_conducted: string;
  nature_bus_activities: string[];
  nature_of_core_business_activity_code: string;
  nature_of_core_business_activity_description: string;
  filing_status: any[][];
  address: any;
  hsn_info: any;
  filing_frequency: any[];
}

interface CompanyData {
  summary: any;
  basic: any;
  cin: string;
  errors?: string[] | null;
  status?: {
    summary: string;
    basic: string;
  };
}

interface FilingRecord {
  return_type: string;
  financial_year: string;
  tax_period: string;
  date_of_filing: string;
  status: string;
  mode_of_filing: string;
  filing_status?: FilingRecord[][];
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  darkMode: boolean;
  isSending?: boolean;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  darkMode,
  isSending = false,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isSending
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    onSubmit(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 w-full">
      <div
        ref={modalRef}
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } p-6 rounded-lg shadow-xl w-full max-w-md transition-all border`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Send Business Verification
          </h3>
          <button
            onClick={onClose}
            className={`${
              darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-gray-800"
            } transition-colors`}
            disabled={isSending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail
                  className={`h-4 w-4 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className={`w-full pl-10 py-2.5 rounded-md border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors ${
                  error ? (darkMode ? "border-red-500" : "border-red-500") : ""
                }`}
                placeholder="recipient@example.com"
                required
                disabled={isSending}
              />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex space-x-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } ${isSending ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center">
                {isSending ? (
                  <>
                    <svg
                      className="animate-spin mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Report
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function BusinessProfilePage() {
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [mobile, setMobile] = useState("");
  const [cin, setCin] = useState("");
  const [businessData, setBusinessData] = useState<BusinessProfileData | null>(
    null
  );
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeService, setActiveService] = useState("gstin");

  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();
  const [selectedReturnType, setSelectedReturnType] = useState<string | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000); // 2 seconds

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Set correct active tab when data changes
  useEffect(() => {
    if (companyData && !businessData) {
      setActiveTab("company");
    } else if (businessData && !companyData) {
      setActiveTab("overview");
    }
  }, [businessData, companyData]);

  // Updated PDF export functions for BusinessProfilePage.tsx

  // Replace the existing exportBusinessPDF function with this:
  const exportBusinessPDF = async () => {
    if (!businessData) {
      setToastMessage({
        message: "No business data available to export",
        type: "error",
      });
      return;
    }

    try {
      setToastMessage({
        message: "Generating business verification PDF...",
        type: "success",
      });

      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: businessData,
          type: "business",
          filename: `business-verification-${
            businessData.business_name?.replace(/\s+/g, "-") || "report"
          }.pdf`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `business-verification-${
        businessData.business_name?.replace(/\s+/g, "-") || "report"
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToastMessage({
        message: "Business verification PDF downloaded successfully",
        type: "success",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      setToastMessage({
        message: `Failed to generate PDF: ${error.message}`,
        type: "error",
      });
    }
  };

  // Replace the existing exportInstaFinancialsPDF function with this:
  const exportInstaFinancialsPDF = async () => {
    if (!companyData) {
      setToastMessage({
        message: "No company data available to export",
        type: "error",
      });
      return;
    }

    try {
      setToastMessage({
        message: "Generating PDF report...",
        type: "success",
      });

      const { summary, basic, cin } = companyData;
      const companyInfo = summary?.InstaSummary?.CompanyMasterSummary || {};
      const basicInfo = basic?.InstaBasic?.CompanyMasterSummary || {};
      const companyName =
        companyInfo.CompanyName || basicInfo.CompanyName || `Company-${cin}`;

      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: companyData,
          type: "company",
          filename: `Detailed_Analysis_Report_${companyName.replace(
            /\s+/g,
            "-"
          )}.pdf`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Detailed_Analysis_Report_${companyName.replace(
        /\s+/g,
        "-"
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToastMessage({
        message: "PDF report downloaded successfully",
        type: "success",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      setToastMessage({
        message: `Failed to generate PDF: ${error.message}`,
        type: "error",
      });
    }
  };

  const exportBusinessExcel = () => {
    if (!businessData) return;

    const wb = utils.book_new();

    // Function to prepare data for Excel
    const prepareDataForExcel = (
      section: BusinessProfileData,
      sectionName: string
    ) => {
      const flatData: { [key: string]: string | number } = {};

      // Special handling for each section
      switch (sectionName) {
        case "Overview":
          flatData["Business Name"] = section.business_name || "N/A";
          flatData["Legal Name"] = section.legal_name || "N/A";
          flatData["GSTIN"] = section.gstin || "N/A";
          flatData["PAN Number"] = section.pan_number || "N/A";
          flatData["Constitution of Business"] =
            section.constitution_of_business || "N/A";
          flatData["Taxpayer Type"] = section.taxpayer_type || "N/A";
          flatData["GSTIN Status"] = section.gstin_status || "N/A";
          flatData["Date of Registration"] =
            section.date_of_registration || "N/A";
          flatData["Core Business Activity"] =
            section.nature_of_core_business_activity_description || "N/A";

          const score = calculateTrustScore(section);
          flatData["Credit Score"] = `${score}%`;
          flatData["Risk Level"] =
            score >= 80
              ? "Low Risk"
              : score >= 65
              ? "Moderate Risk"
              : "High Risk";

          const creditLimit = calculateCreditLimit(section);
          flatData["Recommended Credit Limit"] = formatCurrency(creditLimit);
          break;

        case "Promoters":
          if (section.promoters && section.promoters.length > 0) {
            flatData["Number of Promoters"] = section.promoters.length;
            section.promoters.forEach((promoter, index) => {
              flatData[`Promoter ${index + 1}`] = promoter;
            });
          } else {
            flatData["Promoters"] = "No promoters found";
          }
          break;

        case "Financial":
          flatData["Annual Turnover"] = section.annual_turnover || "N/A";
          flatData["Financial Year"] = section.annual_turnover_fy || "N/A";
          flatData["Percentage in Cash"] = section.percentage_in_cash || "N/A";
          break;

        case "Contact":
          if (section.contact_details && section.contact_details.principal) {
            flatData["Address"] =
              section.contact_details.principal.address || "N/A";
            flatData["Email"] =
              section.contact_details.principal.email || "N/A";
            flatData["Mobile"] =
              section.contact_details.principal.mobile || "N/A";
            flatData["Nature of Business"] =
              section.contact_details.principal.nature_of_business || "N/A";
          } else {
            flatData["Contact Information"] = "Not available";
          }
          break;

        case "Jurisdiction":
          flatData["Center Jurisdiction"] =
            section.center_jurisdiction || "N/A";
          flatData["State Jurisdiction"] = section.state_jurisdiction || "N/A";
          break;

        case "RiskFactors":
          // Positive factors
          const positiveFactors = [];
          if (section.gstin_status === "Active")
            positiveFactors.push("Active GSTIN status");
          if (section.promoters && section.promoters.length >= 2)
            positiveFactors.push("Multiple promoters/directors");
          if (section.constitution_of_business === "Private Limited Company")
            positiveFactors.push("Private limited company structure");
          if (
            section.filing_status &&
            section.filing_status[0] &&
            section.filing_status[0].length >= 15
          )
            positiveFactors.push("Excellent filing compliance");

          flatData["Positive Factors"] = positiveFactors.join(", ") || "None";

          // Negative factors
          const negativeFactors = [];
          if (section.aadhaar_validation !== "Yes")
            negativeFactors.push("No Aadhaar validation");
          if (section.field_visit_conducted !== "Yes")
            negativeFactors.push("No field verification");

          flatData["Negative Factors"] = negativeFactors.join(", ") || "None";

          // Recommendations
          flatData["Recommendations"] = [
            "Complete Aadhaar validation for all promoters",
            "Arrange for field verification to strengthen credibility",
            "Provide audited financial statements for better assessment",
            "Share details of existing loans and banking relationships",
          ].join("; ");
          break;
      }

      return flatData;
    };

    // Create an overview sheet with all data
    const overviewData = prepareDataForExcel(businessData, "Overview");
    const mainWorksheet = utils.json_to_sheet([overviewData]);
    utils.book_append_sheet(wb, mainWorksheet, "Business Verification");

    // Add individual sheets for each section
    // Promoters Sheet
    if (businessData.promoters && businessData.promoters.length > 0) {
      const promotersData = businessData.promoters.map((name, index) => ({
        "No.": index + 1,
        Name: name,
      }));
      const promotersWS = utils.json_to_sheet(promotersData);
      utils.book_append_sheet(wb, promotersWS, "Promoters");
    }

    // Financial Sheet
    const financialData = [
      {
        "Annual Turnover": businessData.annual_turnover || "N/A",
        "Annual Turnover FY": businessData.annual_turnover_fy || "N/A",
        "Percentage in Cash": businessData.percentage_in_cash || "N/A",
      },
    ];
    const financialWS = utils.json_to_sheet(financialData);
    utils.book_append_sheet(wb, financialWS, "Financial Info");

    // Contact Sheet
    if (
      businessData.contact_details &&
      businessData.contact_details.principal
    ) {
      const contactData = [
        {
          Address: businessData.contact_details.principal.address || "N/A",
          Email: businessData.contact_details.principal.email || "N/A",
          Mobile: businessData.contact_details.principal.mobile || "N/A",
          "Nature of Business":
            businessData.contact_details.principal.nature_of_business || "N/A",
        },
      ];
      const contactWS = utils.json_to_sheet(contactData);
      utils.book_append_sheet(wb, contactWS, "Contact");
    }

    // Jurisdiction Sheet
    const jurisdictionData = [
      {
        "Center Jurisdiction": businessData.center_jurisdiction || "N/A",
        "State Jurisdiction": businessData.state_jurisdiction || "N/A",
      },
    ];
    const jurisdictionWS = utils.json_to_sheet(jurisdictionData);
    utils.book_append_sheet(wb, jurisdictionWS, "Jurisdiction");

    // Risk Factors Sheet
    const riskFactorsData = prepareDataForExcel(businessData, "RiskFactors");
    const riskFactorsWS = utils.json_to_sheet([riskFactorsData]);
    utils.book_append_sheet(wb, riskFactorsWS, "Risk Assessment");

    // Filing Status Sheet
    if (
      businessData.filing_status &&
      businessData.filing_status[0] &&
      businessData.filing_status[0].length > 0
    ) {
      const filingData = businessData.filing_status[0].map((filing) => ({
        "Return Type": filing.return_type || "N/A",
        "Financial Year": filing.financial_year || "N/A",
        "Tax Period": filing.tax_period || "N/A",
        "Filing Date": filing.date_of_filing || "N/A",
        Status: filing.status || "N/A",
        Mode: filing.mode_of_filing || "N/A",
      }));
      const filingWS = utils.json_to_sheet(filingData);
      utils.book_append_sheet(wb, filingWS, "Filing Status");
    }

    // Save the Excel file
    writeFile(
      wb,
      `business-profile-${
        businessData.business_name?.replace(/\s+/g, "-") || "report"
      }.xlsx`
    );
  };

  // Helper function to calculate credit limit
  const calculateCreditLimit = (data: BusinessProfileData | null) => {
    const score = data ? calculateTrustScore(data) : 0;
    const estimatedTurnover = data
      ? estimateTurnoverFromSlab(data.annual_turnover || "")
      : 0;

    if (score >= 80) return estimatedTurnover * 0.25;
    else if (score >= 65) return estimatedTurnover * 0.15;
    else if (score >= 50) return estimatedTurnover * 0.1;
    else return estimatedTurnover * 0.05;
  };

  const handleSendBusinessEmail = async (email: any) => {
    setIsSendingEmail(true);
    try {
      // Get risk factors
      const trustScore = businessData ? calculateTrustScore(businessData) : 0;
      const positiveFactors = [];
      const negativeFactors = [];

      // Fill positive factors
      if (businessData && businessData.gstin_status === "Active") {
        positiveFactors.push("Active GSTIN status");
      }
      if (
        businessData &&
        businessData.filing_status &&
        businessData.filing_status[0] &&
        businessData.filing_status[0].length >= 15
      ) {
        positiveFactors.push("Excellent filing compliance");
      } else if (
        businessData &&
        businessData.filing_status &&
        businessData.filing_status[0] &&
        businessData.filing_status[0].length >= 8
      ) {
        positiveFactors.push("Good filing compliance");
      }
      if (
        businessData &&
        businessData.promoters &&
        businessData.promoters.length >= 2
      ) {
        positiveFactors.push("Multiple promoters/directors");
      }
      if (
        businessData &&
        businessData.constitution_of_business === "Private Limited Company"
      ) {
        positiveFactors.push("Private limited company structure");
      }
      if (businessData && businessData.date_of_registration) {
        const registrationDate = new Date(businessData.date_of_registration);
        const currentDate = new Date();
        const ageInYears =
          (currentDate.getTime() - registrationDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        if (ageInYears >= 3) {
          positiveFactors.push("Established business history");
        } else {
          negativeFactors.push("Recent business registration");
        }
      }
      if (
        businessData &&
        businessData.center_jurisdiction &&
        businessData.state_jurisdiction
      ) {
        positiveFactors.push("Clear jurisdiction information");
      }

      // Fill negative factors
      if (businessData && businessData.aadhaar_validation !== "Yes") {
        negativeFactors.push("No Aadhaar validation");
      }
      if (businessData && businessData.field_visit_conducted !== "Yes") {
        negativeFactors.push("No field verification");
      }
      if (
        businessData &&
        businessData.annual_turnover &&
        typeof businessData.annual_turnover === "string" &&
        businessData.annual_turnover.includes("1.5 Cr. to 5 Cr.")
      ) {
        negativeFactors.push("Moderate annual turnover");
      }

      // Get credit limit
      const creditLimit = calculateCreditLimit(businessData);

      // Send to API
      const response = await fetch(`${API_URL}/send-business-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          businessName: businessData?.business_name || "",
          businessData: {
            businessInfo: {
              business_name: businessData?.business_name || "",
              legal_name: businessData?.legal_name || "",
              gstin: businessData?.gstin || "",
              pan_number: businessData?.pan_number || "",
              constitution_of_business:
                businessData?.constitution_of_business || "",
              taxpayer_type: businessData?.taxpayer_type || "",
              gstin_status: businessData?.gstin_status || "",
              date_of_registration: businessData?.date_of_registration || "",
              nature_bus_activities: businessData?.nature_bus_activities || [],
              nature_of_core_business_activity_description:
                businessData?.nature_of_core_business_activity_description ||
                "",
            },
            contactInfo: businessData?.contact_details || {},
            jurisdictionInfo: {
              center_jurisdiction: businessData?.center_jurisdiction || "",
              state_jurisdiction: businessData?.state_jurisdiction || "",
            },
            financialInfo: {
              annual_turnover: businessData?.annual_turnover || "",
              annual_turnover_fy: businessData?.annual_turnover_fy || "",
              percentage_in_cash: businessData?.percentage_in_cash || "",
            },
            promoters: businessData?.promoters || [],
            filingStatus: businessData?.filing_status || [],
            creditAssessment: {
              score: trustScore,
              label:
                trustScore >= 80
                  ? "Low Risk"
                  : trustScore >= 65
                  ? "Moderate Risk"
                  : "High Risk",
              creditLimit: formatCurrency(creditLimit),
              positiveFactors: positiveFactors,
              negativeFactors: negativeFactors,
              recommendations: [
                "Complete Aadhaar validation for all promoters",
                "Arrange for field verification to strengthen credibility",
                "Provide audited financial statements for better assessment",
                "Share details of existing loans and banking relationships",
              ],
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");
      setToastMessage({
        message: "Business Verification report has been sent to the email",
        type: "success",
      });
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      setToastMessage({
        message: "Failed to send email. Please try again.",
        type: "error",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    if (businessData?.filing_status?.[0]?.length) {
      const filings = businessData.filing_status[0];

      // Find latest filing date across all return types
      let latestDate = new Date(0);
      let latestReturnType = "";

      filings.forEach((filing) => {
        const filingDate = new Date(filing.date_of_filing);
        if (filingDate > latestDate) {
          latestDate = filingDate;
          latestReturnType = filing.return_type;
        }
      });

      // Set the return type with latest filing as default
      if (latestReturnType) {
        setSelectedReturnType(latestReturnType);
      }
    }
  }, [businessData]); // Add businessData as dependency

  const groupFilingsByType = (filings: FilingRecord[]) => {
    const grouped: { [key: string]: FilingRecord[] } = {};

    filings.forEach((filing) => {
      if (!grouped[filing.return_type]) {
        grouped[filing.return_type] = [];
      }
      grouped[filing.return_type].push(filing);
    });

    // Sort each group by date descending
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort(
        (a, b) =>
          new Date(b.date_of_filing).getTime() -
          new Date(a.date_of_filing).getTime()
      );
    });

    return grouped;
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return "gray";
    const statusMap: { [key: string]: string } = {
      Active: "green",
      Filed: "green",
      Cancelled: "red",
      Suspended: "yellow",
      Provisional: "blue",
      "Not Filed": "red",
    };
    return statusMap[status] || "gray";
  };

  // Calculate Trust Score (Enhanced Version)
  const calculateTrustScore = (
    data: BusinessProfileData,
    companyInfo?: any
  ): number => {
    // Initialize category weights and scores
    const categories = {
      gstinStatus: { weight: 10, score: 0 },
      filingCompliance: { weight: 20, score: 0 },
      annualTurnover: { weight: 15, score: 0 },
      businessStructure: { weight: 10, score: 0 },
      promoters: { weight: 10, score: 0 },
      verification: { weight: 10, score: 0 },
      businessNature: { weight: 10, score: 0 },
      companyAge: { weight: 5, score: 0 },
      financialData: { weight: 5, score: 0 },
      jurisdictionClarity: { weight: 5, score: 0 },
    };

    // 1. GSTIN Status (10 points)
    if (data.gstin_status === "Active") {
      categories.gstinStatus.score = 10;
    }

    // 2. Filing Compliance (20 points)
    if (data.filing_status && data.filing_status.length > 0) {
      const filingStatuses = data.filing_status[0] || [];
      const filedReturns = filingStatuses.filter(
        (filing) => filing.status === "Filed"
      ).length;
      const filingScore = Math.min(filedReturns, 20); // Cap at 20 points
      categories.filingCompliance.score = filingScore / 2; // Convert to score out of 10
    }

    // 3. Annual Turnover (15 points)
    const turnoverSlab = data.annual_turnover || "";
    if (turnoverSlab.includes("above 5 Cr.")) {
      categories.annualTurnover.score = 10;
    } else if (turnoverSlab.includes("1.5 Cr. to 5 Cr.")) {
      categories.annualTurnover.score = 7;
    } else if (turnoverSlab.includes("50 Lakhs to 1.5 Cr.")) {
      categories.annualTurnover.score = 5;
    } else {
      categories.annualTurnover.score = 3;
    }

    // 4. Business Structure (10 points)
    const businessType = data.constitution_of_business || "";
    if (businessType.includes("Public Limited")) {
      categories.businessStructure.score = 10;
    } else if (businessType.includes("Private Limited")) {
      categories.businessStructure.score = 8;
    } else if (businessType.includes("LLP")) {
      categories.businessStructure.score = 7;
    } else if (businessType.includes("Partnership")) {
      categories.businessStructure.score = 6;
    } else if (businessType.includes("Proprietorship")) {
      categories.businessStructure.score = 4;
    }

    // 5. Promoters (10 points)
    const promoterCount = (data.promoters || []).length;
    if (promoterCount >= 3) {
      categories.promoters.score = 7;
    } else if (promoterCount === 2) {
      categories.promoters.score = 7;
    } else if (promoterCount === 1) {
      categories.promoters.score = 6;
    }

    // 6. Verification (10 points)
    let verificationScore = 0;
    if (data.aadhaar_validation === "Yes") verificationScore += 5;
    if (data.field_visit_conducted === "Yes") verificationScore += 5;
    categories.verification.score = verificationScore;

    // 7. Business Nature (10 points)
    const businessNature =
      data.nature_of_core_business_activity_description || "";
    if (businessNature.includes("Manufacturing")) {
      categories.businessNature.score = 9;
    } else if (
      businessNature.includes("Trader") ||
      businessNature.includes("Wholesaler")
    ) {
      categories.businessNature.score = 8;
    } else if (businessNature.includes("Services")) {
      categories.businessNature.score = 8;
    } else {
      categories.businessNature.score = 6;
    }

    // 8. Company Age (5 points)
    const registrationDate = new Date(data.date_of_registration);
    const currentDate = new Date();
    const ageInYears =
      (currentDate.getTime() - registrationDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    if (ageInYears >= 5) {
      categories.companyAge.score = 10;
    } else if (ageInYears >= 3) {
      categories.companyAge.score = 8;
    } else if (ageInYears >= 1) {
      categories.companyAge.score = 7;
    } else {
      categories.companyAge.score = 4;
    }

    // 9. Financial Data (5 points) - if company info available
    if (companyInfo && companyInfo.paidUpCapital) {
      const paidUpCapital = parseInt(companyInfo.paidUpCapital);
      const estimatedTurnover = estimateTurnoverFromSlab(data.annual_turnover);

      if (estimatedTurnover > 0) {
        const capitalRatio = paidUpCapital / estimatedTurnover;
        if (capitalRatio >= 0.2) {
          categories.financialData.score = 10;
        } else if (capitalRatio >= 0.1) {
          categories.financialData.score = 8;
        } else if (capitalRatio >= 0.05) {
          categories.financialData.score = 6;
        } else {
          categories.financialData.score = 4;
        }
      } else {
        categories.financialData.score = 5;
      }
    } else {
      categories.financialData.score = 5;
    }

    // 10. Jurisdiction Clarity (5 points)
    if (data.center_jurisdiction && data.state_jurisdiction) {
      categories.jurisdictionClarity.score = 8;
    } else {
      categories.jurisdictionClarity.score = 5;
    }

    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;

    for (const category in categories) {
      // @ts-ignore
      totalScore += categories[category].score * categories[category].weight;
      // @ts-ignore
      totalWeight += categories[category].weight;
    }

    // Return normalized score out of 100
    return Math.round((totalScore / (totalWeight * 10)) * 100);
  };

  // Helper function to estimate turnover from slab
  function estimateTurnoverFromSlab(turnoverSlab: string): number {
    if (turnoverSlab.includes("above 5 Cr.")) {
      return 7500000; // Rs. 7.5 Cr
    } else if (turnoverSlab.includes("1.5 Cr. to 5 Cr.")) {
      return 3250000; // Rs. 3.25 Cr
    } else if (turnoverSlab.includes("50 Lakhs to 1.5 Cr.")) {
      return 1000000; // Rs. 1 Cr
    } else if (turnoverSlab.includes("20 Lakhs to 50 Lakhs")) {
      return 350000; // Rs. 35 Lakhs
    } else {
      return 250000; // Default
    }
  }

  // Render Trust Score
  const renderTrustScore = (
    score: number,
    companyName: string,
    gstin: string
  ) => {
    let icon = <Shield className="h-6 w-6 mr-2" />;
    let color = "text-blue-500";
    let label = "Moderate Risk";

    if (score >= 80) {
      icon = <CheckCircle className="h-6 w-6 mr-2" />;
      color = "text-green-500";
      label = "Low Risk";
    } else if (score >= 65 && score < 80) {
      icon = <Shield className="h-6 w-6 mr-2" />;
      color = "text-blue-500";
      label = "Moderate Risk";
    } else if (score < 65) {
      icon = <XCircle className="h-6 w-6 mr-2" />;
      color = "text-red-500";
      label = "High Risk";
    }

    // Use the actual business data to calculate the turnover
    const estimatedTurnover = businessData
      ? estimateTurnoverFromSlab(businessData.annual_turnover)
      : 0;
    let creditLimit = 0;

    if (score >= 80) {
      creditLimit = estimatedTurnover * 0.25; // 25% of turnover
    } else if (score >= 65) {
      creditLimit = estimatedTurnover * 0.15; // 15% of turnover
    } else if (score >= 50) {
      creditLimit = estimatedTurnover * 0.1; // 10% of turnover
    } else {
      creditLimit = estimatedTurnover * 0.05; // 5% of turnover
    }

    const formattedCreditLimit = formatCurrency(creditLimit);

    return (
      <div className="space-y-4">
        {/* Company Name and GSTIN */}
        <div className="space-y-2">
          <h2
            className={`text-2xl font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {companyName}
          </h2>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            GSTIN: {gstin}
          </p>
        </div>

        {/* Trust Score */}
        <div className={`flex items-center ${color}`}>
          {icon}
          <span className={`text-xl font-semibold ${color}`}>
            Credit Score: {score}% - {label}
          </span>
        </div>
      </div>
    );
  };

  // Helper function to format currency
  function formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      // 1 crore or more
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      // 1 lakh or more
      return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    } else {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
  }

  // Render Analytics
  const renderAnalytics = (data: BusinessProfileData) => {
    const positiveFactors = [];
    const negativeFactors = [];
    const explanations: { [key: string]: string } = {
      // Positive Factors Explanations
      "Active GSTIN status":
        "An active GSTIN indicates the business is currently registered and compliant with GST regulations.",
      "Excellent filing compliance":
        "All expected GST returns have been filed, demonstrating strong financial discipline.",
      "Good filing compliance":
        "Most expected GST returns have been filed, showing good financial discipline.",
      "Multiple promoters/directors":
        "Having multiple promoters indicates shared business responsibility and expertise.",
      "Established business history":
        "The company has been operating for 3+ years, showing business stability.",
      "Private limited company structure":
        "Private limited structure provides a good regulatory framework and liability protection.",
      "Clear jurisdiction information":
        "Well-defined jurisdiction indicates proper registration and compliance.",

      // Negative Factors Explanations
      "Inactive GSTIN status":
        "An inactive GSTIN may suggest compliance issues or business discontinuation.",
      "Low filing compliance":
        "Missing or delayed GST returns indicates potential compliance issues.",
      "No Aadhaar validation":
        "Lack of Aadhaar validation reduces the verification level of the business.",
      "No field verification":
        "No physical verification has been conducted, which increases risk assessment.",
      "Low paid-up capital":
        "The paid-up capital is relatively low compared to business turnover, indicating potential financial risk.",
      "Moderate annual turnover":
        "Limited annual turnover may restrict credit capacity and business scalability.",
      "Recent business registration":
        "The business has been operating for less than 3 years, indicating limited track record.",
    };

    // GSTIN Status Check
    if (data.gstin_status === "Active") {
      positiveFactors.push("Active GSTIN status");
    } else {
      negativeFactors.push("Inactive GSTIN status");
    }

    // Filing Status
    if (
      data.filing_status &&
      data.filing_status.length > 0 &&
      data.filing_status[0]
    ) {
      const filedReturns = data.filing_status[0].filter(
        (filing) => filing.status === "Filed"
      );
      if (filedReturns.length >= 20) {
        positiveFactors.push("Excellent filing compliance");
      } else if (filedReturns.length >= 10) {
        positiveFactors.push("Good filing compliance");
      } else {
        negativeFactors.push("Low filing compliance");
      }
    }

    // Verification
    if (data.aadhaar_validation !== "Yes") {
      negativeFactors.push("No Aadhaar validation");
    }

    if (data.field_visit_conducted !== "Yes") {
      negativeFactors.push("No field verification");
    }

    // Promoters
    if (data.promoters && data.promoters.length >= 2) {
      positiveFactors.push("Multiple promoters/directors");
    }

    // Business Structure
    if (data.constitution_of_business === "Private Limited Company") {
      positiveFactors.push("Private limited company structure");
    }

    // Business Age
    if (data.date_of_registration) {
      const registrationDate = new Date(data.date_of_registration);
      const currentDate = new Date();
      const ageInYears =
        (currentDate.getTime() - registrationDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365);

      if (ageInYears >= 3) {
        positiveFactors.push("Established business history");
      } else {
        negativeFactors.push("Recent business registration");
      }
    }

    // Turnover
    if (
      data.annual_turnover &&
      typeof data.annual_turnover === "string" &&
      data.annual_turnover.includes("1.5 Cr. to 5 Cr.")
    ) {
      negativeFactors.push("Moderate annual turnover");
    }

    // Jurisdiction
    if (data.center_jurisdiction && data.state_jurisdiction) {
      positiveFactors.push("Clear jurisdiction information");
    }

    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Key Factors</h3>

        {positiveFactors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-500">
                Positive Factors
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              {positiveFactors?.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start bg-green-50 dark:bg-green-900/30 p-3 rounded-md"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-green-800 dark:text-green-300 block mb-1">
                      {factor}
                    </span>
                    <p className="text-green-700 dark:text-green-200 text-xs">
                      {explanations[factor] ||
                        "Additional positive business attribute."}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {negativeFactors.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <ThumbsDown className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-500">
                Negative Factors
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              {negativeFactors?.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start bg-red-50 dark:bg-red-900/30 p-3 rounded-md"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-red-800 dark:text-red-300 block mb-1">
                      {factor}
                    </span>
                    <p className="text-red-700 dark:text-red-200 text-xs">
                      {explanations[factor] ||
                        "Potential area of concern for the business."}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            Recommendations:
          </h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-200 space-y-1">
            {data.aadhaar_validation !== "Yes" && (
              <li>Complete Aadhaar validation for all promoters</li>
            )}
            {data.field_visit_conducted !== "Yes" && (
              <li>Arrange for field verification to strengthen credibility</li>
            )}
            <li>Provide audited financial statements for better assessment</li>
            <li>Share details of existing loans and banking relationships</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderFilingDetails = (data: BusinessProfileData) => {
    if (
      !data.filing_status ||
      data.filing_status.length === 0 ||
      !data.filing_status[0]
    ) {
      return (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No filing history available
        </div>
      );
    }

    const filingData = data.filing_status[0];
    const groupedFilings = groupFilingsByType(filingData);
    const returnTypes = Object.keys(groupedFilings);

    if (!selectedReturnType && returnTypes.length > 0) {
      return (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Loading filing history...
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg p-6 shadow-sm`}
        >
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto">
              {returnTypes?.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedReturnType(type)}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedReturnType === type
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </nav>
          </div>

          {selectedReturnType ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Financial Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tax Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date Filed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Mode
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {groupedFilings[selectedReturnType]?.map((filing, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                        {filing.financial_year}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                        {filing.tax_period}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                        {new Date(filing.date_of_filing).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(
                            filing.status
                          )}-100 text-${getStatusColor(
                            filing.status
                          )}-800 dark:bg-${getStatusColor(
                            filing.status
                          )}-800/30 dark:text-${getStatusColor(
                            filing.status
                          )}-400`}
                        >
                          {filing.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 capitalize text-sm text-gray-900 dark:text-gray-200">
                        {filing.mode_of_filing?.toLowerCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              Select a return type to view filing history
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update your tabs configuration
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "promoters",
      label: "Promoters",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "financial",
      label: "Financial",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      id: "filing",
      label: "Filing",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "contact",
      label: "Contact",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      id: "jurisdiction",
      label: "Jurisdiction",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      id: "court",
      label: "Court Cases",
      icon: <Gavel className="h-4 w-4" />,
    },
  ];

  // Render Tab Content
  const renderTabContent = (data: BusinessProfileData | CompanyData) => {
    // Check if this is company data (from )
    if (activeTab === "company" && companyData) {
      const currentCompanyData = companyData;

      if (!currentCompanyData) {
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <p className="text-center text-gray-500">
              No company data available
            </p>
          </div>
        );
      }

      const companyInfo =
        currentCompanyData.summary?.InstaSummary?.CompanyMasterSummary || {};
      const directors =
        currentCompanyData.summary?.InstaSummary?.DirectorSignatoryMasterSummary
          ?.DirectorCurrentMasterSummary?.Director || [];

      return (
        <div className="space-y-6">
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Company Name
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyName || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  CIN
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyCIN || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyMcaStatus || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Class
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyClass || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Date of Incorporation
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyDateOfInc || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  ROC
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyRocCity || "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Authorized Capital
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyAuthCapital &&
                  companyInfo.CompanyAuthCapital !== "null"
                    ? `₹${parseInt(
                        companyInfo.CompanyAuthCapital
                      ).toLocaleString()}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Paid Up Capital
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyPaidUpCapital &&
                  companyInfo.CompanyPaidUpCapital !== "null"
                    ? `₹${parseInt(
                        companyInfo.CompanyPaidUpCapital
                      ).toLocaleString()}`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Address Information
            </h3>
            <div className="space-y-3">
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Registered Address
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {companyInfo.CompanyFullAddress || "N/A"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    State
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {companyInfo.CompanyRegState || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    City
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {companyInfo.CompanyRegCity || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    PIN Code
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {companyInfo.CompanyRegPinCode || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Directors Information */}
          {directors.length > 0 && (
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } shadow-md rounded-lg p-6 mb-6 border`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Directors Information
              </h3>
              <div className="space-y-4">
                {directors.map((director: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium text-lg">
                          {director.DirectorName || "N/A"}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          DIN: {director.DirectorDin || "N/A"}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Designation: {director.DirectorDesignation || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Appointment Date:{" "}
                          {director.DirectorDateOfAppnt || "N/A"}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          PAN: {director.DirectorPANNumber || "N/A"}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Email: {director.DirectorEmail || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {currentCompanyData.summary?.InstaSummary?.FinancialsSummary
            ?.FinancialsYearWise?.length > 0 && (
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } shadow-md rounded-lg p-6 mb-6 border`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Financial Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Year
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total Income
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total Expense
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        PAT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Net Worth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {currentCompanyData.summary.InstaSummary.FinancialsSummary.FinancialsYearWise.map(
                      (financial: any, idx: number) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50 dark:bg-gray-800/50"
                          }
                        >
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            {financial.FinancialYear}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            ₹
                            {parseInt(
                              financial.TotalIncome || 0
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            ₹
                            {parseInt(
                              financial.TotalExpense || 0
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            ₹
                            {parseInt(
                              financial.ProfitAfterTax || 0
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            ₹
                            {parseInt(financial.NetWorth || 0).toLocaleString()}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Handle business data (GSTIN) tabs
    const businessData = data as BusinessProfileData;

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Trust Score */}
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } shadow-md rounded-lg p-6 mb-6 border`}
            >
              {renderTrustScore(
                calculateTrustScore(businessData),
                businessData.business_name,
                businessData.gstin
              )}
            </div>

            {/* Analytics */}
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } shadow-md rounded-lg p-6 mb-6 border`}
            >
              {renderAnalytics(businessData)}
            </div>

            {/* Business Details */}
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } shadow-md rounded-lg p-6 mb-6 border`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                <Briefcase className="inline-block w-6 h-6 mr-2" />
                Business Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Business Name
                    </p>
                    <p
                      className={` capitalize ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.business_name?.toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Legal Name
                    </p>
                    <p
                      className={` capitalize ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.legal_name?.toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      PAN Number
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.pan_number}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      GSTIN
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.gstin}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Constitution of Business
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.constitution_of_business}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Taxpayer Type
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.taxpayer_type}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      GSTIN Status
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.gstin_status}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Nature of Business Activities
                    </p>
                    <ul
                      className={`capitalize list-disc list-inside ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {businessData.nature_bus_activities?.map(
                        (activity, index) => (
                          <li key={index}>{activity.toLocaleLowerCase()}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <DollarSign className="inline-block w-6 h-6 mr-2" />
              Financial Details
            </h2>
            <div className="space-y-4">
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Annual Turnover
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {businessData.annual_turnover}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Annual Turnover FY
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {businessData.annual_turnover_fy}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Percentage in Cash
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {businessData.percentage_in_cash}
                </p>
              </div>
            </div>
          </div>
        );

      case "filing":
        return renderFilingDetails(businessData);

      case "contact":
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <Phone className="inline-block w-6 h-6 mr-2" />
              Contact Details
            </h2>
            <div className="space-y-4">
              {businessData.contact_details &&
                businessData.contact_details.principal && (
                  <>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Address
                      </p>
                      <p
                        className={`capitalize ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {businessData.contact_details.principal.address
                          ? businessData.contact_details.principal.address?.toLowerCase()
                          : "Address not available"}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {businessData.contact_details.principal.email
                          ? businessData.contact_details.principal.email?.toLowerCase()
                          : "Email not available"}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Mobile
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {businessData.contact_details.principal.mobile ||
                          "Mobile not available"}
                      </p>
                    </div>
                  </>
                )}
              {(!businessData.contact_details ||
                !businessData.contact_details.principal) && (
                <p
                  className={`text-center ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No contact information available
                </p>
              )}
            </div>
          </div>
        );

      case "promoters":
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <Users className="inline-block w-6 h-6 mr-2" />
              Promoters/Directors
            </h2>
            {businessData.promoters && businessData.promoters.length > 0 ? (
              <ul className="space-y-3">
                {businessData.promoters?.map((promoter, index) => (
                  <li
                    key={index}
                    className={`flex items-center p-3 rounded-md ${
                      darkMode
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <Users className="h-5 w-5 mr-3 text-blue-500" />
                    <span className="capitalize">
                      {promoter.trim()?.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No promoter information available
              </p>
            )}
          </div>
        );

      case "jurisdiction":
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <MapPin className="inline-block w-6 h-6 mr-2" />
              Jurisdiction Details
            </h2>
            <div className="space-y-4">
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Center Jurisdiction
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {businessData.center_jurisdiction || "Not available"}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  State Jurisdiction
                </p>
                <p
                  className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {businessData.state_jurisdiction || "Not available"}
                </p>
              </div>
            </div>
          </div>
        );

      case "court":
        return (
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md rounded-lg p-6 mb-6 border`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <Gavel className="inline-block w-6 h-6 mr-2" />
              Court Case Search
            </h2>

            {/* Create a simplified profile format for the CourtCaseTab */}
            <CourtCaseTab
              profileData={{
                personalInfo: {
                  full_name:
                    businessData.business_name || businessData.legal_name,
                  pan_number: businessData.pan_number,
                },
                contactInfo: businessData.contact_details?.principal,
                rawProfileData: {
                  personalInfo: {
                    fullName:
                      businessData.business_name || businessData.legal_name,
                    panNumber: businessData.pan_number,
                  },
                  contactInfo: businessData.contact_details?.principal,
                },
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (activeService === "gstin") {
      if (!gstin) {
        alert("GSTIN is required");
        return;
      }

      setIsLoading(true);
      setBusinessData(null);
      setCompanyData(null);

      try {
        const response = await fetch(`${API_URL}}/verification-business`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: "gstin-advanced",
            gstin,
            pan,
            mobile,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch Business Verification data");
        }

        const data = await response.json();
        setBusinessData(data.data);
      } catch (error) {
        console.error("Error fetching Business Verification data:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (activeService === "cin") {
      if (!cin) {
        alert("CIN is required");
        return;
      }

      setIsLoading(true);
      setBusinessData(null);
      setCompanyData(null);

      try {
        const response = await fetch(`${API_URL}/insta-financials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cin }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch company data");
        }

        const data = await response.json();
        setCompanyData(data.data);

        // Show success message even with partial failures
        const { errors, status } = data.data;
        if (errors && errors.length > 0) {
          setToastMessage({
            message: `Company report generated with some warnings: ${errors.join(
              ", "
            )}`,
            type: "warning",
          });
        } else {
          setToastMessage({
            message: "Company report generated successfully",
            type: "success",
          });
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
        setToastMessage({
          message: `Company report generation failed: ${error.message}`,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto lg:p-10 p-5">
      {/* Export buttons */}
      <div className="flex space-x-3 mb-6">
        {businessData && (
          <>
            <button
              onClick={exportBusinessPDF}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportBusinessExcel}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Sheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Send className="w-4 h-4" />
              Email
            </button>
          </>
        )}

        {companyData && (
          <button
            onClick={exportInstaFinancialsPDF}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        )}
      </div>

      {/* Toast Messages */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 transition-opacity duration-300 ${
            toastMessage.type === "success"
              ? "bg-green-500 text-white"
              : toastMessage.type === "warning"
              ? "bg-yellow-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toastMessage.message}
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:bg-white hover:bg-opacity-20 rounded px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Render email modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleSendBusinessEmail}
        darkMode={darkMode}
        isSending={isSendingEmail}
      />

      <div className="mx-auto lg:p-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Sidebar with Form */}
          <div className="w-full mb-4 lg:mb-0">
            <div
              className={`${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              } shadow-xl rounded-lg p-6  h-full sticky border top-20 transition-colors duration-200`}
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  className={`w-12 h-12 ${
                    darkMode ? "bg-blue-900" : "bg-blue-100"
                  } rounded-full flex items-center justify-center mr-3`}
                >
                  <Briefcase
                    className={`h-6 w-6 ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Business Verification
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className={`space-y-6 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {/* Service Switcher */}
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveService("gstin")}
                      className={`px-3 py-2 text-sm rounded-md ${
                        activeService === "gstin"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Company Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveService("cin")}
                      className={`px-3 py-2 text-sm rounded-md ${
                        activeService === "cin"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Company Due Diligence Report
                    </button>
                  </div>
                </div>

                {/* GSTIN Form */}
                {activeService === "gstin" && (
                  <div className="space-y-6">
                    <div className="space-y-2 w-full">
                      <label
                        htmlFor="gstin"
                        className={`block text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        GST Identification Number
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase
                            className={`h-4 w-4 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <input
                          type="text"
                          id="gstin"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          className={`w-full pl-10 py-2.5 rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                              : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                          } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                          placeholder="Enter GST Number"
                          pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CIN Form */}
                {activeService === "cin" && (
                  <div className="space-y-6">
                    <div className="space-y-2 w-full">
                      <label
                        htmlFor="cin"
                        className={`block text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Company Identification Number (CIN)
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase
                            className={`h-4 w-4 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <input
                          type="text"
                          id="cin"
                          value={cin}
                          onChange={(e) => setCin(e.target.value)}
                          className={`w-full pl-10 py-2.5 rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                              : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                          } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                          placeholder="Enter CIN Number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full mt-6 flex justify-center py-3 px-6 border border-transparent rounded-md shadow-md text-base font-medium text-white ${
                    darkMode
                      ? "bg-blue-700 hover:bg-blue-600 focus:ring-blue-600"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Profile...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Generate Profile
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side - Profile Result */}
          <div className="md:col-span-2">
            {businessData ? (
              <div className="space-y-6">
                {/* Tabs for GSTIN data */}
                <div
                  className={`${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  } shadow-md rounded-lg p-4 mb-6 border`}
                >
                  <nav className="flex gap-2 flex-wrap">
                    {tabs
                      ?.filter((tab) => tab.id !== "company")
                      .map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? darkMode
                                ? "bg-blue-700 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center">
                            {tab.icon}
                            <span className="ml-2">{tab.label}</span>
                          </div>
                        </button>
                      ))}
                  </nav>
                </div>
                {renderTabContent(businessData)}
              </div>
            ) : companyData ? (
              <div className="space-y-6">
                {/* Tabs for Company data */}
                <div
                  className={`${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  } shadow-md rounded-lg p-4 mb-6 border`}
                >
                  <nav className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab("company")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === "company"
                          ? darkMode
                            ? "bg-blue-700 text-white"
                            : "bg-blue-600 text-white"
                          : darkMode
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4" />
                        <span className="ml-2">Company Info</span>
                      </div>
                    </button>
                  </nav>
                </div>
                {renderTabContent(companyData)}
              </div>
            ) : (
              <div
                className={`${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                } shadow-xl rounded-lg p-8 text-center border transition-colors duration-200 h-full`}
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative mb-4">
                    <div
                      className={`w-20 h-20 ${
                        darkMode ? "bg-gray-700" : "bg-blue-100"
                      } rounded-full flex items-center justify-center`}
                    >
                      <Briefcase
                        className={`h-10 w-10 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h2
                    className={`text-2xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    } mb-2`}
                  >
                    Business Verification
                  </h2>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } max-w-md mx-auto mb-4`}
                  >
                    Choose between GSTIN verification for GST compliance
                    checking or Company Report for comprehensive financial
                    analysis using CIN.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
