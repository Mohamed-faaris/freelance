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
  Award,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import CourtCaseTab from "./CourtCaseTab";

const API_URL = import.meta.env.VITE_API_URL 

interface GSTBasicData {
  stjCd: string;
  lgnm: string;
  stj: string;
  dty: string;
  adadr: any[];
  cxdt: string;
  gstin: string;
  nba: string[];
  lstupdt: string;
  rgdt: string;
  ctb: string;
  pradr: {
    addr: {
      bnm: string;
      st: string;
      loc: string;
      bno: string;
      dst: string;
      lt: string;
      locality: string;
      pncd: string;
      landMark: string;
      stcd: string;
      geocodelvl: string;
      flno: string;
      lg: string;
    };
    ntr: string;
  };
  tradeNam: string;
  ctjCd: string;
  sts: string;
  ctj: string;
  einvoiceStatus: string;
}

interface FSSAIDetail {
  address_premises: string;
  status_desc: string;
  district_name: string;
  fbo_id: number;
  display_ref_id: string;
  taluk_name: string;
  company_name: string;
  state_premises: string | null;
  district_premises: string | null;
  app_type_desc: string;
  taluk_premises: string | null;
  state_name: string;
  license_category_name: string;
  app_type: string | null;
  app_submission_date: string;
  last_updated_on: string;
  pincode: string | null;
  ref_id: number;
}

interface FSSAIData {
  id_number: string;
  application_number: string;
  fssai_number: string;
  details: FSSAIDetail[];
  firm_name?: string;
  company_name?: string;
  business_name?: string;
  applicant_name?: string;
  license_holder_name?: string;
  license_number?: string;
  fssai_id?: string;
  validityDate?: string;
  validity_date?: string;
}

interface BusinessVerificationData {
  gstData?: GSTBasicData;
  fssaiData?: FSSAIData;
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
            Send FSSAI Verification Report
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

export default function FSSAIProfilePage() {
  const [gstin, setGstin] = useState("");
  const [fssaiId, setFssaiId] = useState("");
  const [businessData, setBusinessData] =
    useState<BusinessVerificationData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Calculate Trust Score based on GST and FSSAI data
  const calculateTrustScore = (data: BusinessVerificationData): number => {
    let score = 0;
    let maxScore = 100;

    // GST Status (40 points)
    if (data.gstData) {
      if (data.gstData.sts === "Active") score += 25;
      if (data.gstData.ctb === "Private Limited Company") score += 10;
      if (data.gstData.einvoiceStatus === "Yes") score += 5;

      // Registration age (older = better)
      if (data.gstData.rgdt) {
        const regDate = new Date(
          data.gstData.rgdt.split("/").reverse().join("-")
        );
        const ageInYears =
          (Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageInYears >= 5) score += 15;
        else if (ageInYears >= 3) score += 10;
        else if (ageInYears >= 1) score += 5;
      }
    }

    // FSSAI Compliance (30 points)
    if (data.fssaiData && data.fssaiData.details.length > 0) {
      const detail = data.fssaiData.details[0];
      if (detail.status_desc === "License Issued") score += 20;
      if (detail.license_category_name === "Central License") score += 10;
    }

    // Business Nature (30 points)
    if (data.gstData?.nba && data.gstData.nba.length > 0) {
      score += Math.min(data.gstData.nba.length * 10, 30);
    }

    return Math.min(score, maxScore);
  };

  // PDF Export Function
  const exportFSSAIPDF = () => {
    if (!businessData) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPos = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    const checkPageBreak = (height = 10) => {
      if (yPos + height > 270) {
        doc.addPage();
        yPos = 15;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`FSSAI Verification Report (continued)`, margin, 10);
      }
    };

    // Helper function to get business name
    const getBusinessName = () => {
      const fssaiData = businessData.fssaiData as any;
      return (
        businessData.gstData?.lgnm ||
        businessData.gstData?.tradeNam ||
        fssaiData?.company_name ||
        fssaiData?.firm_name ||
        fssaiData?.business_name ||
        fssaiData?.applicant_name ||
        fssaiData?.license_holder_name ||
        "FSSAI Business"
      );
    };

    // Header
    doc.setFillColor(89, 65, 169);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FSSAI Verification Report", pageWidth / 2, 12, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text(getBusinessName(), pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    if (businessData.gstData?.gstin) {
      doc.text(`GSTIN: ${businessData.gstData.gstin}`, pageWidth / 2, 26, {
        align: "center",
      });
    }

    yPos = 40;

    const addSectionHeader = (title: string) => {
      checkPageBreak(12);
      doc.setFillColor(89, 65, 169);
      doc.setDrawColor(70, 50, 145);
      doc.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 3, yPos + 1.5);
      yPos += 12;
    };

    const addDataRow = (key: string, value: any, indent = 0) => {
      if (value === undefined || value === null || value === "") return;

      checkPageBreak(6);

      if (Array.isArray(value)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(89, 65, 169);
        doc.text(`${key}:`, margin + indent, yPos);
        yPos += 5;

        value.forEach((item) => {
          checkPageBreak(5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(`• ${item}`, margin + indent + 5, yPos);
          yPos += 5;
        });
        return;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(89, 65, 169);
      doc.text(`${key}:`, margin + indent, yPos);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      let displayValue = String(value);

      if (displayValue.length > 40) {
        const splitText = doc.splitTextToSize(
          displayValue,
          contentWidth - indent - 45
        );
        doc.text(splitText, margin + indent + 45, yPos);
        yPos += (splitText.length - 1) * 5 + 5;
      } else {
        doc.text(displayValue, margin + indent + 45, yPos);
        yPos += 6;
      }
    };

    // Trust Score Section
    const trustScore = calculateTrustScore(businessData);
    const trustLabel =
      trustScore >= 80
        ? "Low Risk"
        : trustScore >= 65
        ? "Moderate Risk"
        : "High Risk";

    addSectionHeader("Trust Assessment");

    // Score indicator
    let scoreColor: [number, number, number];
    if (trustScore >= 80) scoreColor = [39, 174, 96];
    else if (trustScore >= 65) scoreColor = [41, 128, 185];
    else scoreColor = [231, 76, 60];

    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin, yPos - 5, 50, 20, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`${trustScore}%`, margin + 25, yPos + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`${trustLabel}`, margin + 60, yPos + 5);
    yPos += 25;

    // Business Overview
    if (businessData.gstData || businessData.fssaiData) {
      addSectionHeader("Business Overview");

      if (businessData.gstData) {
        addDataRow("Legal Name", businessData.gstData.lgnm);
        addDataRow("Trade Name", businessData.gstData.tradeNam);
        addDataRow("GSTIN", businessData.gstData.gstin);
        addDataRow("Business Type", businessData.gstData.ctb);
        addDataRow("GST Status", businessData.gstData.sts);
        addDataRow("Registration Date", businessData.gstData.rgdt);
        addDataRow("Business Activities", businessData.gstData.nba);
      }

      const fssaiData = businessData.fssaiData as any;
      if (fssaiData) {
        addDataRow("FSSAI Number", fssaiData.fssai_number);
        addDataRow("Application Number", fssaiData.application_number);
        if (fssaiData.company_name)
          addDataRow("Company Name", fssaiData.company_name);
        if (fssaiData.firm_name) addDataRow("Firm Name", fssaiData.firm_name);
        if (fssaiData.license_number)
          addDataRow("License Number", fssaiData.license_number);
        if (fssaiData.validityDate)
          addDataRow("Validity Date", fssaiData.validityDate);
      }
      yPos += 5;
    }

    // FSSAI License Details
    if (businessData.fssaiData && businessData.fssaiData.details.length > 0) {
      addSectionHeader("FSSAI License Details");

      businessData.fssaiData.details.forEach((detail, index) => {
        if (index > 0) yPos += 10;

        addDataRow("Company Name", detail.company_name);
        addDataRow("License Status", detail.status_desc);
        addDataRow("License Category", detail.license_category_name);
        addDataRow("State", detail.state_name);
        addDataRow("District", detail.district_name);
        addDataRow("Address", detail.address_premises);
        addDataRow("Application Date", detail.app_submission_date);
        addDataRow("Last Updated", detail.last_updated_on);
      });
      yPos += 5;
    }

    // Contact Information
    if (businessData.gstData?.pradr) {
      addSectionHeader("Contact Information");
      const addr = businessData.gstData.pradr.addr;
      const fullAddress = `${addr.bno}, ${addr.st}, ${addr.loc}, ${addr.dst}, ${addr.stcd} - ${addr.pncd}`;
      addDataRow("Principal Address", fullAddress);
      addDataRow("Nature of Business", businessData.gstData.pradr.ntr);
      yPos += 5;
    }

    // Compliance Analysis
    addSectionHeader("Compliance Analysis");

    const positiveFactors = [];
    const negativeFactors = [];

    if (businessData.gstData) {
      if (businessData.gstData.sts === "Active") {
        positiveFactors.push("Active GST registration");
      } else {
        negativeFactors.push("Inactive GST status");
      }

      if (businessData.gstData.ctb === "Private Limited Company") {
        positiveFactors.push("Private Limited Company structure");
      }

      if (businessData.gstData.einvoiceStatus === "Yes") {
        positiveFactors.push("E-invoice enabled");
      }
    }

    if (businessData.fssaiData && businessData.fssaiData.details.length > 0) {
      const detail = businessData.fssaiData.details[0];
      if (detail.status_desc === "License Issued") {
        positiveFactors.push("Valid FSSAI license");
      } else {
        negativeFactors.push("FSSAI license issues");
      }
    }

    if (positiveFactors.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(39, 174, 96);
      doc.text("Positive Factors:", margin, yPos);
      yPos += 6;

      positiveFactors.forEach((factor) => {
        checkPageBreak(5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(`• ${factor}`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    if (negativeFactors.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(231, 76, 60);
      doc.text("Risk Factors:", margin, yPos);
      yPos += 6;

      negativeFactors.forEach((factor) => {
        checkPageBreak(5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(`• ${factor}`, margin + 5, yPos);
        yPos += 5;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(89, 65, 169);
      doc.line(margin, 280, pageWidth - margin, 280);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, margin, 285);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 285, {
        align: "right",
      });
    }

    doc.save(
      `fssai-verification-${getBusinessName().replace(/\s+/g, "-")}.pdf`
    );
  };

  // Excel Export Function
  const exportFSSAIExcel = () => {
    if (!businessData) return;

    const wb = utils.book_new();

    // Helper function to get business name
    const getBusinessName = () => {
      const fssaiData = businessData.fssaiData as any;
      return (
        businessData.gstData?.lgnm ||
        businessData.gstData?.tradeNam ||
        fssaiData?.company_name ||
        fssaiData?.firm_name ||
        fssaiData?.business_name ||
        "FSSAI Business"
      );
    };

    // Overview Sheet
    const overviewData: Record<string, string> = {
      "Business Name": getBusinessName(),
      "Trust Score": `${calculateTrustScore(businessData)}%`,
      "Report Generated": new Date().toLocaleDateString(),
    };

    if (businessData.gstData) {
      overviewData["GSTIN"] = businessData.gstData.gstin;
      overviewData["GST Status"] = businessData.gstData.sts;
      overviewData["Business Type"] = businessData.gstData.ctb;
      overviewData["Registration Date"] = businessData.gstData.rgdt;
    }

    const fssaiData = businessData.fssaiData as any;
    if (fssaiData) {
      overviewData["FSSAI Number"] = fssaiData.fssai_number;
      overviewData["Application Number"] = fssaiData.application_number;
      if (fssaiData.license_number)
        overviewData["License Number"] = fssaiData.license_number;
      if (fssaiData.validityDate)
        overviewData["Validity Date"] = fssaiData.validityDate;
    }

    const overviewWS = utils.json_to_sheet([overviewData]);
    utils.book_append_sheet(wb, overviewWS, "Overview");

    // GST Details Sheet
    if (businessData.gstData) {
      const gstData: Record<string, string> = {
        GSTIN: businessData.gstData.gstin,
        "Legal Name": businessData.gstData.lgnm,
        "Trade Name": businessData.gstData.tradeNam,
        Status: businessData.gstData.sts,
        "Business Type": businessData.gstData.ctb,
        "Taxpayer Type": businessData.gstData.dty,
        "Registration Date": businessData.gstData.rgdt,
        "Last Updated": businessData.gstData.lstupdt,
        "E-invoice Status": businessData.gstData.einvoiceStatus,
        "Business Activities": businessData.gstData.nba.join(", "),
      };

      if (businessData.gstData.pradr) {
        const addr = businessData.gstData.pradr.addr;
        gstData[
          "Address"
        ] = `${addr.bno}, ${addr.st}, ${addr.loc}, ${addr.dst}, ${addr.stcd} - ${addr.pncd}`;
        gstData["Nature of Business at Address"] =
          businessData.gstData.pradr.ntr;
      }

      const gstWS = utils.json_to_sheet([gstData]);
      utils.book_append_sheet(wb, gstWS, "GST Details");
    }

    // FSSAI Details Sheet
    if (businessData.fssaiData && businessData.fssaiData.details.length > 0) {
      const fssaiDetailsData = businessData.fssaiData.details.map(
        (detail, index) => ({
          "License #": index + 1,
          "Company Name": detail.company_name,
          Status: detail.status_desc,
          "License Category": detail.license_category_name,
          State: detail.state_name,
          District: detail.district_name,
          Address: detail.address_premises,
          "Application Date": detail.app_submission_date,
          "Last Updated": detail.last_updated_on,
          "Application Type": detail.app_type_desc,
        })
      );

      const fssaiWS = utils.json_to_sheet(fssaiDetailsData);
      utils.book_append_sheet(wb, fssaiWS, "FSSAI License Details");
    }

    // Compliance Analysis Sheet
    const positiveFactors = [];
    const negativeFactors = [];

    if (businessData.gstData) {
      if (businessData.gstData.sts === "Active") {
        positiveFactors.push("Active GST registration");
      } else {
        negativeFactors.push("Inactive GST status");
      }

      if (businessData.gstData.ctb === "Private Limited Company") {
        positiveFactors.push("Private Limited Company structure");
      }

      if (businessData.gstData.einvoiceStatus === "Yes") {
        positiveFactors.push("E-invoice enabled");
      }
    }

    if (businessData.fssaiData && businessData.fssaiData.details.length > 0) {
      const detail = businessData.fssaiData.details[0];
      if (detail.status_desc === "License Issued") {
        positiveFactors.push("Valid FSSAI license");
      } else {
        negativeFactors.push("FSSAI license issues");
      }
    }

    const complianceData = {
      "Trust Score": `${calculateTrustScore(businessData)}%`,
      "Risk Level":
        calculateTrustScore(businessData) >= 80
          ? "Low Risk"
          : calculateTrustScore(businessData) >= 65
          ? "Moderate Risk"
          : "High Risk",
      "Positive Factors": positiveFactors.join("; "),
      "Risk Factors": negativeFactors.join("; "),
      Recommendations: [
        "Maintain active GST compliance",
        "Keep FSSAI license updated",
        "Regular filing of required returns",
        "Ensure all business activities are properly registered",
      ].join("; "),
    };

    const complianceWS = utils.json_to_sheet([complianceData]);
    utils.book_append_sheet(wb, complianceWS, "Compliance Analysis");

    writeFile(
      wb,
      `fssai-verification-${getBusinessName().replace(/\s+/g, "-")}.xlsx`
    );
  };

  // Email Send Function
  const handleSendFSSAIEmail = async (email: string) => {
    setIsSendingEmail(true);
    try {
      // Helper function to get business name
      const getBusinessName = () => {
        const fssaiData = businessData?.fssaiData as any;
        return (
          businessData?.gstData?.lgnm ||
          businessData?.gstData?.tradeNam ||
          fssaiData?.company_name ||
          fssaiData?.firm_name ||
          fssaiData?.business_name ||
          fssaiData?.applicant_name ||
          fssaiData?.license_holder_name ||
          "FSSAI Business"
        );
      };

      const trustScore = businessData ? calculateTrustScore(businessData) : 0;
      const positiveFactors = [];
      const negativeFactors = [];

      // Analyze factors for email
      if (businessData?.gstData) {
        if (businessData.gstData.sts === "Active") {
          positiveFactors.push("Active GST registration");
        } else {
          negativeFactors.push("Inactive GST status");
        }

        if (businessData.gstData.ctb === "Private Limited Company") {
          positiveFactors.push("Private Limited Company structure");
        }

        if (businessData.gstData.einvoiceStatus === "Yes") {
          positiveFactors.push("E-invoice enabled");
        }
      }

      if (
        businessData?.fssaiData &&
        businessData.fssaiData.details.length > 0
      ) {
        const detail = businessData.fssaiData.details[0];
        if (detail.status_desc === "License Issued") {
          positiveFactors.push("Valid FSSAI license");
        } else {
          negativeFactors.push("FSSAI license issues");
        }

        if (detail.license_category_name === "Central License") {
          positiveFactors.push("Central FSSAI license");
        }
      }

      const response = await fetch(`${API_URL}/send-fssai-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          businessName: getBusinessName(),
          businessData: {
            gstInfo: businessData?.gstData || {},
            fssaiInfo: businessData?.fssaiData || {},
            trustAssessment: {
              score: trustScore,
              label:
                trustScore >= 80
                  ? "Low Risk"
                  : trustScore >= 65
                  ? "Moderate Risk"
                  : "High Risk",
              positiveFactors: positiveFactors,
              negativeFactors: negativeFactors,
              recommendations: [
                "Maintain active GST compliance",
                "Keep FSSAI license updated",
                "Regular filing of required returns",
                "Ensure all business activities are properly registered",
              ],
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      setToastMessage({
        message: "FSSAI Verification report has been sent to the email",
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
    } else if (score >= 65) {
      icon = <Shield className="h-6 w-6 mr-2" />;
      color = "text-blue-500";
      label = "Moderate Risk";
    } else {
      icon = <XCircle className="h-6 w-6 mr-2" />;
      color = "text-red-500";
      label = "High Risk";
    }

    return (
      <div className="space-y-4">
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

        <div className={`flex items-center ${color}`}>
          {icon}
          <span className={`text-xl font-semibold ${color}`}>
            Trust Score: {score}% - {label}
          </span>
        </div>
      </div>
    );
  };

  const renderAnalytics = (data: BusinessVerificationData) => {
    const positiveFactors = [];
    const negativeFactors = [];

    // GST Analysis
    if (data.gstData) {
      if (data.gstData.sts === "Active") {
        positiveFactors.push("Active GST registration");
      } else {
        negativeFactors.push("Inactive GST status");
      }

      if (data.gstData.ctb === "Private Limited Company") {
        positiveFactors.push("Private Limited Company structure");
      }

      if (data.gstData.einvoiceStatus === "Yes") {
        positiveFactors.push("E-invoice enabled");
      }

      if (data.gstData.rgdt) {
        const regDate = new Date(
          data.gstData.rgdt.split("/").reverse().join("-")
        );
        const ageInYears =
          (Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageInYears >= 3) {
          positiveFactors.push("Established business (3+ years)");
        } else {
          negativeFactors.push("Recent business registration");
        }
      }
    }

    // FSSAI Analysis
    if (data.fssaiData && data.fssaiData.details.length > 0) {
      const detail = data.fssaiData.details[0];
      if (detail.status_desc === "License Issued") {
        positiveFactors.push("Valid FSSAI license");
      } else {
        negativeFactors.push("FSSAI license issues");
      }

      if (detail.license_category_name === "Central License") {
        positiveFactors.push("Central FSSAI license");
      }
    } else if (fssaiId) {
      negativeFactors.push("FSSAI verification failed");
    }

    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Compliance Analysis</h3>

        {positiveFactors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-500">
                Positive Factors
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              {positiveFactors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start bg-green-50 dark:bg-green-900/30 p-3 rounded-md"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <span className="font-semibold text-green-800 dark:text-green-300">
                    {factor}
                  </span>
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
                Risk Factors
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              {negativeFactors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start bg-red-50 dark:bg-red-900/30 p-3 rounded-md"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-1 flex-shrink-0" />
                  <span className="font-semibold text-red-800 dark:text-red-300">
                    {factor}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Dynamic tabs based on available data only
  const getAvailableTabs = (data: BusinessVerificationData) => {
    const allTabs = [
      {
        id: "overview",
        label: "Overview",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        id: "gst",
        label: "GST Details",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "fssai",
        label: "FSSAI License",
        icon: <Award className="h-4 w-4" />,
      },
      {
        id: "contact",
        label: "Contact",
        icon: <Phone className="h-4 w-4" />,
      },
      {
        id: "court",
        label: "Court Cases",
        icon: <Gavel className="h-4 w-4" />,
      },
    ];

    // Check if user entered only FSSAI (no GST input)
    const isOnlyFSSAI = !gstin.trim() && fssaiId.trim();

    // Show tabs based on what data is actually available
    const availableTabs = allTabs.filter((tab) => {
      switch (tab.id) {
        case "overview":
          // Don't show Overview tab if user entered only FSSAI
          if (isOnlyFSSAI) return false;
          return data.gstData || data.fssaiData; // Show if any data available
        case "gst":
          return !!data.gstData; // Show only if GST data available
        case "fssai":
          return !!data.fssaiData; // Show only if FSSAI data available
        case "contact":
          return !!data.gstData; // Show only if GST data available (has contact info)
        case "court":
          return !!data.gstData; // Show only if GST data available (has business name)
        default:
          return false;
      }
    });

    return availableTabs;
  };

  const renderTabContent = (data: BusinessVerificationData) => {
    switch (activeTab) {
      case "overview":
        // Helper function to get business name from available data
        const getBusinessName = () => {
          const fssaiData = data.fssaiData as any;
          return (
            data.gstData?.lgnm ||
            data.gstData?.tradeNam ||
            fssaiData?.company_name ||
            fssaiData?.firm_name ||
            fssaiData?.business_name ||
            fssaiData?.applicant_name ||
            fssaiData?.license_holder_name ||
            "Unknown Business"
          );
        };

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
                calculateTrustScore(data),
                getBusinessName(),
                data.gstData?.gstin ||
                  (data.fssaiData as any)?.license_number ||
                  (data.fssaiData as any)?.fssai_id ||
                  ""
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
              {renderAnalytics(data)}
            </div>

            {/* Business Summary */}
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
                Business Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Show GST data if available */}
                {data.gstData && (
                  <>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Legal Name
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {data.gstData.lgnm}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Trade Name
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {data.gstData.tradeNam}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Business Type
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {data.gstData.ctb}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Registration Date
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {data.gstData.rgdt}
                      </p>
                    </div>
                  </>
                )}

                {/* Show FSSAI data if available and no GST data */}
                {!data.gstData && data.fssaiData && (
                  <>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Company Name
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {(data.fssaiData as any).company_name ||
                          (data.fssaiData as any).firm_name ||
                          (data.fssaiData as any).business_name ||
                          (data.fssaiData as any).applicant_name}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        License Number
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {(data.fssaiData as any).license_number ||
                          (data.fssaiData as any).fssai_id}
                      </p>
                    </div>
                    {(data.fssaiData as any).validityDate && (
                      <div>
                        <p
                          className={`text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Validity Date
                        </p>
                        <p
                          className={`${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {(data.fssaiData as any).validityDate}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case "gst":
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
              <FileText className="inline-block w-6 h-6 mr-2" />
              GST Registration Details
            </h2>
            {data.gstData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {data.gstData.gstin}
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
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        data.gstData.sts === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400"
                      }`}
                    >
                      {data.gstData.sts}
                    </span>
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
                      {data.gstData.dty}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Last Updated
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {data.gstData.lstupdt}
                    </p>
                  </div>
                </div>

                <div>
                  <p
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nature of Business Activities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.gstData.nba.map((activity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No GST data available
              </p>
            )}
          </div>
        );

      case "fssai":
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
              <Award className="inline-block w-6 h-6 mr-2" />
              FSSAI License Details
            </h2>
            {data.fssaiData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      FSSAI Number
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {data.fssaiData.fssai_number}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Application Number
                    </p>
                    <p
                      className={`${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {data.fssaiData.application_number}
                    </p>
                  </div>
                </div>

                {data.fssaiData.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
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
                          className={`${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {detail.company_name}
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            detail.status_desc === "License Issued"
                              ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400"
                          }`}
                        >
                          {detail.status_desc}
                        </span>
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          License Category
                        </p>
                        <p
                          className={`${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {detail.license_category_name}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Last Updated
                        </p>
                        <p
                          className={`${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {detail.last_updated_on}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Address
                      </p>
                      <p
                        className={`${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {detail.address_premises}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No FSSAI data available
              </p>
            )}
          </div>
        );

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
            {data.gstData?.pradr ? (
              <div className="space-y-4">
                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Principal Address
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {`${data.gstData.pradr.addr.bno}, ${data.gstData.pradr.addr.st}, ${data.gstData.pradr.addr.loc}, ${data.gstData.pradr.addr.dst}, ${data.gstData.pradr.addr.stcd} - ${data.gstData.pradr.addr.pncd}`}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nature of Business at Address
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {data.gstData.pradr.ntr}
                  </p>
                </div>
              </div>
            ) : (
              <p
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No contact information available
              </p>
            )}
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

            <CourtCaseTab
              profileData={{
                personalInfo: {
                  full_name: data.gstData?.lgnm || data.gstData?.tradeNam || "",
                  pan_number: "",
                },
                contactInfo: {
                  address: data.gstData?.pradr?.addr
                    ? `${data.gstData.pradr.addr.bno}, ${data.gstData.pradr.addr.st}, ${data.gstData.pradr.addr.loc}`
                    : "",
                },
                rawProfileData: {
                  personalInfo: {
                    fullName:
                      data.gstData?.lgnm || data.gstData?.tradeNam || "",
                    panNumber: "",
                  },
                  contactInfo: {
                    address: data.gstData?.pradr?.addr
                      ? `${data.gstData.pradr.addr.bno}, ${data.gstData.pradr.addr.st}, ${data.gstData.pradr.addr.loc}`
                      : "",
                  },
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

    // Updated validation - require at least one field
    if (!gstin.trim() && !fssaiId.trim()) {
      alert("Please provide either GSTIN or FSSAI ID");
      return;
    }

    setIsLoading(true);
    setBusinessData(null);

    try {
      const requestBody = {
        gstin: gstin.trim() || null,
        fssaiId: fssaiId.trim() || null,
      };

      console.log("Sending request:", requestBody);

      const response = await fetch(`${API_URL}/fssai-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:"include",
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", response.status, errorData);
        throw new Error(errorData.error || `API Error ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);
      console.log("Received 2data:", data.gstData.data);

      // Check if we got any data back
      if (!data.gstData && !data.fssaiData) {
        throw new Error("No data found for the provided inputs");
      }

      setBusinessData(data);

      // Set the first available tab as active
      const availableTabs = getAvailableTabs(data);
      if (availableTabs.length > 0) {
        setActiveTab(availableTabs[0].id);
      }
    } catch (error) {
      console.error("Error fetching FSSAI Verification data:", error);

      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          alert(
            "Network error: Unable to connect to the server. Please check your connection and try again."
          );
        } else if (error.message.includes("404")) {
          alert("API endpoint not found. Please contact support.");
        } else if (error.message.includes("500")) {
          alert("Server error. Please try again later or contact support.");
        } else {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get available tabs based on current business data
  const availableTabs = businessData ? getAvailableTabs(businessData) : [];

  // Update active tab if current tab is not available
  useEffect(() => {
    if (businessData && availableTabs.length > 0) {
      const isCurrentTabAvailable = availableTabs.some(
        (tab) => tab.id === activeTab
      );
      if (!isCurrentTabAvailable) {
        setActiveTab(availableTabs[0].id);
      }
    }
  }, [businessData, availableTabs, activeTab]);

  // Toast message component
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="mx-auto lg:p-10 p-5">
      {/* Toast Message */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
            toastMessage.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <XCircle className="w-5 h-5 mr-2" />
          )}
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={exportFSSAIPDF}
          disabled={!businessData}
          className={`flex items-center gap-1 px-3 py-1.5 ${
            businessData
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          } text-white rounded-md transition-colors`}
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={exportFSSAIExcel}
          disabled={!businessData}
          className={`flex items-center gap-1 px-3 py-1.5 ${
            businessData
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          } text-white rounded-md transition-colors`}
        >
          <Sheet className="w-4 h-4" />
          Excel
        </button>
        <button
          onClick={() => setIsEmailModalOpen(true)}
          disabled={!businessData}
          className={`flex items-center gap-1 px-3 py-1.5 ${
            businessData
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          } text-white rounded-md transition-colors`}
        >
          <Send className="w-4 h-4" />
          Email
        </button>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleSendFSSAIEmail}
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
              } shadow-xl rounded-lg p-6 h-full sticky border top-20 transition-colors duration-200`}
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
                  FSSAI Verification
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className={`space-y-6 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <div className="space-y-4 w-full">
                  <div>
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
                        placeholder="Enter GST Number (Optional)"
                        pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="fssai"
                      className={`block text-sm font-medium ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      FSSAI License Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Award
                          className={`h-4 w-4 ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        type="text"
                        id="fssai"
                        value={fssaiId}
                        onChange={(e) => setFssaiId(e.target.value)}
                        className={`w-full pl-10 py-2.5 rounded-md border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                            : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                        } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                        placeholder="Enter FSSAI Number (Optional)"
                      />
                    </div>
                  </div>
                </div>

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
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Verify Business
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
                {/* Tabs - Only show available tabs */}
                {availableTabs.length > 0 && (
                  <div
                    className={`${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-100"
                    } shadow-md rounded-lg p-4 mb-6 border`}
                  >
                    <nav className="flex space-x-4 overflow-x-auto">
                      {availableTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
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
                )}

                {/* Tab Content */}
                {renderTabContent(businessData)}
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
                    FSSAI Verification
                  </h2>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } max-w-md mx-auto mb-4`}
                  >
                    Enter the GSTIN and/or FSSAI number to generate a
                    comprehensive business verification report. At least one
                    field is required.
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
