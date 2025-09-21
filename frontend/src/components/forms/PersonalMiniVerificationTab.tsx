import { useState, FormEvent, useEffect } from "react";
import {
  User,
  Phone,
  Calendar,
  Fingerprint,
  FileDigit,
  BadgeInfo,
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
  Check,
  X,
  Clock,
  Info,
  Car,
  FileClock,
  AlertTriangle,
  Building,
  Briefcase,
  Banknote,
  UserSearch,
  Landmark,
  Download,
  BanknoteIcon,
  CreditCard,
  BookUser,
  UserSquareIcon,
  BuildingIcon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import CourtCaseResult from "../CourtCaseResult";
import jsPDF from "jspdf";
const API_URL = import.meta.env.VITE_API_URL ;

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

// Toast component for notifications
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const { darkMode } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? darkMode
        ? "bg-green-800"
        : "bg-green-600"
      : type === "error"
      ? darkMode
        ? "bg-red-800"
        : "bg-red-600"
      : darkMode
      ? "bg-blue-800"
      : "bg-blue-600";

  const Icon = type === "success" ? Check : type === "error" ? X : Info;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg ${bgColor} text-white shadow-lg`}
    >
      <Icon size={18} className="mr-2" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-3 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// Define interfaces for verification responses
interface AadhaarVerification {
  aadhaarNumber: string;
  ageRange?: string;
  state?: string;
  gender?: string;
  lastDigits?: string;
  isMobile?: boolean;
  verificationStatus: string;
}

interface PANVerification {
  panNumber: string;
  fullName?: string;
  status?: string;
  category?: string;
  cleanedName?: string;
  verificationStatus: string;
}

interface DLVerification {
  dlNumber: string;
  name?: string;
  relativeName?: string;
  address?: string;
  issuingRto?: string;
  dateOfIssue?: string;
  validFrom?: string;
  validTo?: string;
  covDetails?: Array<{
    cov?: string;
    issueDate?: string;
    category?: string;
  }>;
  verificationStatus: string;
}

interface RCAdvancedVerification {
  rcNumber: string;
  ownerName?: string;
  registrationDate?: string;
  vehicleCategory?: string;
  makerModel?: string;
  vehicleClass?: string;
  fuelType?: string;
  insuranceValidity?: string;
  rcStatus?: string;
  verificationStatus: string;
  insuranceUpto: string;
}

interface RCChallanVerification {
  rcNumber: string;
  totalChallans?: number;
  totalAmount?: number;
  latestChallanDate?: string;
  challanDetails?: Array<{
    challanNumber: string;
    offenseDetails: string;
    amount: number;
    challanStatus: string;
    challanDate: string;
  }>;
  verificationStatus: string;
}

interface UANVerification {
  uanNumber: string;
  source: "pan" | "aadhaar" | "mobile";
  sourceNumber: string;
  verificationStatus: string;
}

interface EmploymentHistoryVerification {
  uanNumber: string;
  employmentHistory?: Array<{
    name: string;
    guardianName?: string;
    establishmentName: string;
    dateOfJoining: string;
    dateOfExit?: string;
    lastPfSubmitted?: string;
  }>;
  verificationStatus: string;
}

interface MobileToPANVerification {
  mobileNumber: string;
  panNumber?: string;
  fullName?: string;
  gender?: string;
  dob?: string;
  aadhaarLinked?: boolean;
  verificationStatus: string;
}

interface MNRLVerification {
  mnrl_record_found: boolean;
  mobile_number: string;
  latest_revocation_status: boolean;
  first_revocation_month: string;
  first_revocation_year: number;
  latest_revocation_month: string;
  latest_revocation_year: number;
  verificationStatus: string;
}

interface VoterIdVerification {
  epic_Number: string;
  ac_no: string;
  dob: string;
  district: string;
  gender: string;
  house_no: string;
  id_number: string;
  last_update: string;
  name_on_card: string;
  part_no: string;
  ps_lat_long: string;
  ps_name: string;
  rln_name: string;
  section_no: string;
  source: string;
  st_code: string;
  state: string;
  status: string;
  verificationStatus: string;
}

interface PassportVerification {
  fileNumber: string;
  name: string;
  dob: string;
  applicationType: string;
  applicationReceivedDatre: string;
  status: string;
  verificationStatus: string;
}

interface UPIVerification {
  accountExits: boolean;
  nameAtBank: string;
  verificationStatus: string;
}

interface BankAccountVerification {
  bankAccount: string;
  ifscCode: string;
  accountExists: boolean;
  nameAtBank?: string;
  utr?: string;
  message: string;
  verificationStatus: string;
}

interface GSTINVerification {}

interface VerificationResults {
  personalInfo: {
    name: string;
    dob: string;
    mobile: string;
    fatherName?: string;
    aadhaar?: string;
    pan?: string;
    dl?: string;
    rcNumber?: string;
    uanNumber?: string;
    epic_Number?: string;
    fileNumber?: string;
    upi?: string;
  };
  aadhaarVerification?: AadhaarVerification;
  panVerification?: PANVerification;
  dlVerification?: DLVerification;
  rcAdvancedVerification?: RCAdvancedVerification;
  rcChallanVerification?: RCChallanVerification;
  uanVerification?: UANVerification;
  employmentHistoryVerification?: EmploymentHistoryVerification;
  mobileToPANVerification?: MobileToPANVerification;
  mnrlVerification?: MNRLVerification;
  voterIdVerification?: VoterIdVerification;
  passportVerification?: PassportVerification;
  upiVerification?: UPIVerification;
  bankAccountVerification?: BankAccountVerification;
}

const PersonalMiniVerificationTab: React.FC = () => {
  const { darkMode } = useTheme();

  // Form input states
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [dl, setDl] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [epicNumber, setEpicNumber] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upi, setUpi] = useState("");
  const [gstinAdvanced, setGstinAdvanced] = useState("");
  const [cin, setCin] = useState("");
  const [din, setDin] = useState("");
  const [secerti, setSEcerti] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [udyam, setUdyam] = useState("");
  const [udyog, setUdyog] = useState("");
  const [ehuan, setEHuan] = useState(""); // eh - employment history

  // Loading and validation states
  const [isLoading, setIsLoading] = useState(false);
  const [activeVerifications, setActiveVerifications] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Results state
  const [verificationResults, setVerificationResults] =
    useState<VerificationResults | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Handle toast dismiss
  const dismissToast = () => setToast(null);

  // Handle checkbox change for verification selections
  const handleVerificationToggle = (verificationType: string) => {
    if (activeVerifications.includes(verificationType)) {
      setActiveVerifications(
        activeVerifications.filter((v) => v !== verificationType)
      );
    } else {
      setActiveVerifications([...activeVerifications, verificationType]);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!dob.trim()) {
      errors.dob = "Date of Birth is required";
    }

    if (!mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (activeVerifications.includes("fatherName") && !fatherName.trim()) {
      errors.fatherName = "Father Name is required for Court Case Verfication";
    }

    if (activeVerifications.includes("aadhaar") && !aadhaar.trim()) {
      errors.aadhaar = "Aadhaar number is required for Aadhaar verification";
    } else if (aadhaar.trim() && !/^\d{12}$/.test(aadhaar)) {
      errors.aadhaar = "Enter a valid 12-digit Aadhaar number";
    }

    if (activeVerifications.includes("pan") && !pan.trim()) {
      errors.pan = "PAN number is required for PAN verification";
    } else if (pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      errors.pan = "Enter a valid PAN number (e.g., ABCDE1234F)";
    }

    if (activeVerifications.includes("dl") && !dl.trim()) {
      errors.dl = "DL number is required for Driving License verification";
    }

    if (activeVerifications.includes("rc-advanced") && !rcNumber.trim()) {
      errors.rcNumber = "RC number is required for RC verification";
    }

    if (activeVerifications.includes("rc-challan") && !rcNumber.trim()) {
      errors.rcNumber = "RC number is required for RC Challan verification";
    }

    if (activeVerifications.includes("pan-to-uan") && !pan.trim()) {
      errors.pan = "PAN number is required for PAN to UAN verification";
    }

    if (activeVerifications.includes("aadhaar-to-uan") && !aadhaar.trim()) {
      errors.aadhaar =
        "Aadhaar number is required for Aadhaar to UAN verification";
    }

    if (activeVerifications.includes("mobile-to-pan") && !mobile.trim()) {
      errors.mobile =
        "Mobile number is required for Mobile to PAN verification";
    }

    // We need DOB for DL verification
    if (activeVerifications.includes("dl") && !dob.trim()) {
      errors.dob = "Date of Birth is required for DL verification";
    }

    // mobile-to-uan verification
    if (activeVerifications.includes("mobile-to-uan") && !mobile.trim()) {
      errors.mobile =
        "Mobile number is required for Mobile to UAN verification";
    }

    // MNRL Verification
    if (activeVerifications.includes("mnrl") && !mobile.trim()) {
      errors.mobile = "Mobile number is required for MNRL verification";
    }

    // VoterID Verification
    if (activeVerifications.includes("voter-id") && !epicNumber.trim()) {
      errors.epicNumber = "EPIC Number is required for Voter ID verification";
    }

    // Passport Verification
    if (activeVerifications.includes("passport") && !fileNumber.trim()) {
      errors.fileNumber = "File Number is required for Passport verification";
    }

    // UPI Verification
    if (activeVerifications.includes("upi") && !upi.trim()) {
      errors.upi = "UPI ID is required for UPI verification";
    }

    // Bank Account Verification
    if (activeVerifications.includes("bankAccount") && !bankAccount.trim()) {
      errors.bankAccount =
        "Bank Account number is required for Bank verification";
    }

    // IFSC code Verification
    if (activeVerifications.includes("ifsc") && !ifscCode.trim()) {
      errors.ifscCode = "IFSC code is required for Bank verification";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        message: "Please fix the errors in the form",
        type: "error",
      });
      return;
    }

    // No verifications selected
    if (activeVerifications.length === 0) {
      setToast({
        message: "Please select at least one verification to proceed",
        type: "info",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/verification-mini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          dob,
          mobile,
          fatherName: activeVerifications.includes("fatherName")
            ? fatherName
            : undefined,
          aadhaar_number:
            activeVerifications.includes("aadhaar") ||
            activeVerifications.includes("aadhaar-to-uan")
              ? aadhaar
              : undefined,
          pan_number:
            activeVerifications.includes("pan") ||
            activeVerifications.includes("pan-to-uan")
              ? pan
              : undefined,
          dl_number: activeVerifications.includes("dl") ? dl : undefined,
          rc_number:
            activeVerifications.includes("rc-advanced") ||
            activeVerifications.includes("rc-challan")
              ? rcNumber
              : undefined,
          epic_Number: activeVerifications.includes("voter-id")
            ? epicNumber
            : undefined,
          file_number: activeVerifications.includes("passport")
            ? fileNumber
            : undefined,
          upi: activeVerifications.includes("upi") ? upi : undefined,
          bankAccount: activeVerifications.includes("bankAccount")
            ? bankAccount
            : undefined,
          ifscCode: activeVerifications.includes("ifsc") ? ifscCode : undefined,

          verifications: activeVerifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();
      setVerificationResults(data);

      setToast({
        message: "Verification completed successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error during verification:", error);
      setToast({
        message: "Failed to complete verification. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render verification status indicator
  const renderVerificationStatus = (status: string) => {
    if (status === "verified") {
      return (
        <div className="flex items-center text-green-500">
          <ShieldCheck className="w-5 h-5 mr-1" />
          <span>Verified</span>
        </div>
      );
    } else if (status === "failed") {
      return (
        <div className="flex items-center text-red-500">
          <AlertCircle className="w-5 h-5 mr-1" />
          <span>Verification Failed</span>
        </div>
      );
    } else if (status === "not_found") {
      return (
        <div className="flex items-center text-yellow-500">
          <Info className="w-5 h-5 mr-1" />
          <span>ID Not Found</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Clock className="w-5 h-5 mr-1" />
          <span>Pending</span>
        </div>
      );
    }
  };

  // Reset form and results
  const handleReset = () => {
    setVerificationResults(null);
    setActiveVerifications([]);
  };

  function setUanNumber(arg0: string) {
    throw new Error("Function not implemented.");
  }

  const exportPDF = (profileData: VerificationResults) => {
    if (!profileData) return;

    // Create a new jsPDF instance with better formatting
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set initial position and page margins
    let yPos = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = contentWidth / 2;
    let currentPage = 1;

    // Helper function to add a new page when needed
    const checkPageBreak = (height: number = 10) => {
      if (yPos + height > 270) {
        doc.addPage();
        currentPage++;
        yPos = 15;

        // Add header to new page
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Profile Report - ${name} (continued)`, margin, 10);
      }
    };

    // Add title with styling and branding
    doc.setFillColor(89, 65, 169); // blue background for header
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Comprehensive Profile Report", pageWidth / 2, 10, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text(name, pageWidth / 2, 18, { align: "center" });

    yPos = 35; // Start content after header

    // Function to add section headers with blue background and white text
    const addSectionHeader = (title: string) => {
      checkPageBreak(10);

      // Set blue background with white text for section headers
      doc.setFillColor(89, 65, 169); // Dark blue background
      doc.setDrawColor(70, 50, 145);
      doc.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255); // White text
      doc.text(title, margin + 3, yPos + 1.5);
      yPos += 12;
    };

    // Function to add data rows with better formatting
    const addDataRow = (key: string, value: any, indent: number = 0) => {
      // Skip empty or null values
      if (value === undefined || value === null) return;

      checkPageBreak(6);

      // Special case for arrays (like UPI IDs)
      if (Array.isArray(value)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`${key}:`, margin + indent, yPos);
        yPos += 5;

        value.forEach((item, index) => {
          checkPageBreak(5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(`• ${item}`, margin + indent + 5, yPos);
          yPos += 5;
        });

        return;
      }

      // Format boolean values
      if (typeof value === "boolean") {
        value = value ? "Yes" : "No";
      }

      // Regular key-value pairs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${key}:`, margin + indent, yPos);

      // Value styling
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);

      // Format value for special fields
      let displayValue = String(value);
      if (key.toLowerCase().includes("aadhaar")) {
        // For Aadhaar number, use the full number from input, not masked
        displayValue = aadhaar;
      }

      // Wrap long text values if needed
      if (displayValue.length > 40) {
        const splitText = doc.splitTextToSize(
          displayValue,
          columnWidth - indent - 30
        );
        doc.text(splitText, margin + indent + 45, yPos);
        // Add extra vertical space for wrapped text
        yPos += (splitText.length - 1) * 5 + 5;
      } else {
        doc.text(displayValue, margin + indent + 45, yPos);
        yPos += 6;
      }
    };

    // Personal Information Section
    if (profileData.personalInfo) {
      addSectionHeader("Personal Information");

      // Add all personal info fields visible in the UI
      if (profileData.personalInfo.name) {
        addDataRow("Full Name", profileData.personalInfo.name);
      }
      if (profileData.personalInfo.dob) {
        addDataRow("Date of Birth", profileData.personalInfo.dob);
      }
      if (profileData.personalInfo.fatherName) {
        addDataRow("Father's Name", profileData.personalInfo.fatherName);
      }
      if (profileData.personalInfo.mobile) {
        addDataRow("Mobile Number", profileData.personalInfo.mobile);
      }
      yPos += 5;
    }

    // Aadhaar Information Section
    if (profileData.aadhaarVerification) {
      addSectionHeader("Aadhaar Information");
      if (profileData.aadhaarVerification.aadhaarNumber) {
        addDataRow(
          "Aadhaar Number",
          profileData.aadhaarVerification.aadhaarNumber
        );
      }
      if (profileData.aadhaarVerification.ageRange) {
        addDataRow("Age Range", profileData.aadhaarVerification.ageRange);
      }
      if (profileData.aadhaarVerification.state) {
        addDataRow("State", profileData.aadhaarVerification.state);
      }
      if (profileData.aadhaarVerification.gender) {
        addDataRow("Gender", profileData.aadhaarVerification.gender);
      }
      if (profileData.aadhaarVerification.lastDigits) {
        addDataRow("Last Digits", profileData.aadhaarVerification.lastDigits);
      }
      if (profileData.aadhaarVerification.isMobile) {
        addDataRow(
          "Mobile Linked",
          profileData.aadhaarVerification.isMobile ? "Yes" : "No"
        );
      }
      yPos += 5;
    }

    // PAN Information Section
    if (profileData.panVerification) {
      addSectionHeader("PAN Information");

      if (profileData.panVerification.panNumber) {
        addDataRow("PAN Number", profileData.panVerification.panNumber);
      }
      if (profileData.panVerification.fullName) {
        addDataRow("Full Name", profileData.panVerification.fullName);
      }
      if (profileData.panVerification.status) {
        addDataRow("Status", profileData.panVerification.status);
      }
      if (profileData.panVerification.category) {
        addDataRow("Category", profileData.panVerification.category);
      }
      yPos += 5;
    }

    // Driving License Information Section
    if (profileData.dlVerification) {
      addSectionHeader("Driving License Information");

      if (profileData.dlVerification.dlNumber) {
        addDataRow("DL Number", profileData.dlVerification.dlNumber);
      }
      if (profileData.dlVerification.name) {
        addDataRow("Name", profileData.dlVerification.name);
      }
      if (profileData.dlVerification.relativeName) {
        addDataRow("Relative Name", profileData.dlVerification.relativeName);
      }
      if (profileData.dlVerification.address) {
        addDataRow("Address", profileData.dlVerification.address);
      }
      if (profileData.dlVerification.issuingRto) {
        addDataRow("Issuing RTO", profileData.dlVerification.issuingRto);
      }
      if (profileData.dlVerification.dateOfIssue) {
        addDataRow("Date of Issue", profileData.dlVerification.dateOfIssue);
      }
      if (profileData.dlVerification.validFrom) {
        addDataRow("Valid From", profileData.dlVerification.validFrom);
      }
      if (profileData.dlVerification.validTo) {
        addDataRow("Valid To", profileData.dlVerification.validTo);
      }

      // Cov Details
      if (
        profileData.dlVerification.covDetails &&
        profileData.dlVerification.covDetails.length > 0
      ) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("Cov Details:", margin, yPos);
        yPos += 6;

        profileData.dlVerification.covDetails.forEach((cov, index) => {
          checkPageBreak(5);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 30, 30);

          let covText = `Cov ${index + 1}: `;
          if (cov.cov) covText += `Cov: ${cov.cov}, `;
          if (cov.issueDate) covText += `Issue Date: ${cov.issueDate}, `;
          if (cov.category) covText += `Category: ${cov.category}`;

          doc.text(covText, margin + 5, yPos);
          yPos += 5;
        });
      }
      yPos += 5;
    }

    // RC Challan Information Section
    if (profileData.rcChallanVerification) {
      addSectionHeader("RC Challan Information");
      if (profileData.rcChallanVerification.rcNumber) {
        addDataRow("RC Number", profileData.rcChallanVerification.rcNumber);
      }
      if (profileData.rcChallanVerification.totalChallans !== undefined) {
        addDataRow(
          "Total Challans",
          profileData.rcChallanVerification.totalChallans.toString()
        );
      }
      if (profileData.rcChallanVerification.totalAmount !== undefined) {
        addDataRow(
          "Total Amount",
          profileData.rcChallanVerification.totalAmount.toString()
        );
      }
      if (profileData.rcChallanVerification.latestChallanDate) {
        addDataRow(
          "Latest Challan Date",
          profileData.rcChallanVerification.latestChallanDate
        );
      }
      if (
        profileData.rcChallanVerification.challanDetails &&
        profileData.rcChallanVerification.challanDetails.length > 0
      ) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("Challan Details:", margin, yPos);
        yPos += 6;

        profileData.rcChallanVerification.challanDetails.forEach(
          (challan, index) => {
            checkPageBreak(5);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 30, 30);

            let challanText = `Challan ${index + 1}: `;
            if (challan.challanNumber)
              challanText += `Challan Number: ${challan.challanNumber}, `;
            if (challan.offenseDetails)
              challanText += `Offense Details: ${challan.offenseDetails}, `;
            if (challan.amount !== undefined)
              challanText += `Amount: ₹${challan.amount}, `;
            if (challan.challanStatus)
              challanText += `Status: ${challan.challanStatus}, `;
            if (challan.challanDate)
              challanText += `Date: ${challan.challanDate}`;

            doc.text(challanText, margin + 5, yPos);
            yPos += 5;
          }
        );
      }
      yPos += 5;
    }

    // RC Advanced Information Section
    if (profileData.rcAdvancedVerification) {
      addSectionHeader("RC Advanced Information");

      if (profileData.rcAdvancedVerification.rcNumber) {
        addDataRow("RC Number", profileData.rcAdvancedVerification.rcNumber);
      }
      if (profileData.rcAdvancedVerification.ownerName) {
        addDataRow("Owner Name", profileData.rcAdvancedVerification.ownerName);
      }
      if (profileData.rcAdvancedVerification.registrationDate) {
        addDataRow(
          "Registration Date",
          profileData.rcAdvancedVerification.registrationDate
        );
      }
      if (profileData.rcAdvancedVerification.vehicleCategory) {
        addDataRow(
          "Vehicle Category",
          profileData.rcAdvancedVerification.vehicleCategory
        );
      }
      if (profileData.rcAdvancedVerification.makerModel) {
        addDataRow(
          "Maker Model",
          profileData.rcAdvancedVerification.makerModel
        );
      }
      if (profileData.rcAdvancedVerification.vehicleClass) {
        addDataRow(
          "Vehicle Class",
          profileData.rcAdvancedVerification.vehicleClass
        );
      }
      if (profileData.rcAdvancedVerification.fuelType) {
        addDataRow("Fuel Type", profileData.rcAdvancedVerification.fuelType);
      }
      if (profileData.rcAdvancedVerification.insuranceValidity) {
        addDataRow(
          "Insurance Validity",
          profileData.rcAdvancedVerification.insuranceValidity
        );
      }
      yPos += 5;
    }

    // UAN Information Section
    if (profileData.uanVerification) {
      addSectionHeader("UAN Information");
      if (profileData.uanVerification.uanNumber) {
        addDataRow("UAN Number", profileData.uanVerification.uanNumber);
      }
      if (profileData.uanVerification.source) {
        addDataRow("Source", profileData.uanVerification.source);
      }
      if (profileData.uanVerification.sourceNumber) {
        addDataRow("Source Number", profileData.uanVerification.sourceNumber);
      }
      yPos += 5;
    }

    // Employment History Section
    if (profileData.employmentHistoryVerification) {
      addSectionHeader("Employment History Information");
      if (profileData.employmentHistoryVerification.uanNumber) {
        addDataRow(
          "UAN Number",
          profileData.employmentHistoryVerification.uanNumber
        );
      }
      if (
        profileData.employmentHistoryVerification.employmentHistory &&
        profileData.employmentHistoryVerification.employmentHistory.length > 0
      ) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("Employment History:", margin, yPos);
        yPos += 6;

        profileData.employmentHistoryVerification.employmentHistory.forEach(
          (job, index) => {
            checkPageBreak(5);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 30, 30);

            let jobText = `Job ${index + 1}: `;
            if (job.name) jobText += `Name: ${job.name}, `;
            if (job.guardianName)
              jobText += `Guardian Name: ${job.guardianName}, `;
            if (job.establishmentName)
              jobText += `Establishment: ${job.establishmentName}, `;
            if (job.dateOfJoining)
              jobText += `Joining Date: ${job.dateOfJoining}, `;
            if (job.dateOfExit) jobText += `Exit Date: ${job.dateOfExit}, `;
            if (job.lastPfSubmitted)
              jobText += `Last PF Submitted: ${job.lastPfSubmitted}`;

            doc.text(jobText, margin + 5, yPos);
            yPos += 5;
          }
        );
      }
      yPos += 5;
    }

    // Add footer with date and page info on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer with line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 280, pageWidth - margin, 280);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);

      // Current date in bottom left
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, margin, 285);

      // Page info in bottom right
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 285, {
        align: "right",
      });
    }

    doc.save(`profile-${name.replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div
      className={`p-4 md:p-6 rounded-lg ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      <div className="mb-4 md:mb-6">
        <h2
          className={`text-xl md:text-2xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Verification
        </h2>
        <p
          className={`text-sm md:text-base ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Verify identity information including Aadhaar, PAN, Driving License,
          Vehicle RC, Employment History, and Court Case
        </p>
      </div>

      {verificationResults ? (
        // Verification Results Display
        <div className="space-y-4 md:space-y-6">
          {/* Personal Information Summary */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <button
              onClick={() => exportPDF(verificationResults)}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${
                darkMode
                  ? "bg-gray-700/50 hover:bg-gray-700/80 text-white"
                  : "bg-gray-400/20 hover:bg-gray-400/30 text-black "
              }  rounded-md transition-colors text-sm font-medium w-full sm:w-auto`}
              type="button"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
          <div
            className={`p-3 md:p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
          >
            <h3
              className={`text-lg font-medium mb-3 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-start space-x-3">
                <User
                  className={`w-5 h-5 mt-1 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Name
                  </p>
                  <p
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {verificationResults.personalInfo.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar
                  className={`w-5 h-5 mt-1 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Date of Birth
                  </p>
                  <p
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {verificationResults.personalInfo.dob}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone
                  className={`w-5 h-5 mt-1 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Mobile
                  </p>
                  <p
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {verificationResults.personalInfo.mobile}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aadhaar Verification Results */}
          {verificationResults.aadhaarVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Aadhaar Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.aadhaarVerification.verificationStatus
                )}
              </div>

              {verificationResults.aadhaarVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Aadhaar Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.aadhaarNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Age Range
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.ageRange ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      State
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.state ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Gender
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.gender === "M"
                        ? "Male"
                        : verificationResults.aadhaarVerification.gender === "F"
                        ? "Female"
                        : verificationResults.aadhaarVerification.gender ||
                          "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Last Digits
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.lastDigits ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Mobile Linked
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.aadhaarVerification.isMobile
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAN Verification Results */}
          {verificationResults.panVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <FileDigit className="w-5 h-5 mr-2" />
                  PAN Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.panVerification.verificationStatus
                )}
              </div>

              {verificationResults.panVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      PAN Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.panVerification.panNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Full Name
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.panVerification.fullName ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Status
                    </p>
                    <p
                      className={`font-medium ${
                        verificationResults.panVerification.status === "VALID"
                          ? darkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : darkMode
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    >
                      {verificationResults.panVerification.status ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Category
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.panVerification.category ||
                        "Not Available"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Driving License Verification Results */}
          {verificationResults.dlVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <BadgeInfo className="w-5 h-5 mr-2" />
                  Driving License Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.dlVerification.verificationStatus
                )}
              </div>

              {verificationResults.dlVerification.verificationStatus ===
                "verified" && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        DL Number
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.dlNumber}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Name
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.name ||
                          "Not Available"}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Father/Guardian Name
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.relativeName ||
                          "Not Available"}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Issuing RTO
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.issuingRto ||
                          "Not Available"}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Date of Issue
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.dateOfIssue ||
                          "Not Available"}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Valid Till
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.dlVerification.validTo ||
                          "Not Available"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Address
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.dlVerification.address ||
                        "Not Available"}
                    </p>
                  </div>

                  {verificationResults.dlVerification.covDetails &&
                    verificationResults.dlVerification.covDetails.length >
                      0 && (
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          } mb-2`}
                        >
                          Vehicle Categories
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {verificationResults.dlVerification.covDetails.map(
                            (cov, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded ${
                                  darkMode ? "bg-gray-600" : "bg-gray-100"
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span
                                    className={`font-medium ${
                                      darkMode ? "text-white" : "text-gray-800"
                                    }`}
                                  >
                                    {cov.cov || "N/A"}
                                  </span>
                                  <span
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {cov.issueDate || "N/A"}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* RC Advanced Verification Results */}
          {verificationResults.rcAdvancedVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Car className="w-5 h-5 mr-2" />
                  RC Advanced Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.rcAdvancedVerification.verificationStatus
                )}
              </div>

              {verificationResults.rcAdvancedVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      RC Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification.rcNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Owner Name
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification.ownerName ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Registration Date
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification
                        .registrationDate || "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Vehicle Category
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification
                        .vehicleCategory || "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Maker Model
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification.makerModel ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Fuel Type
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification.fuelType ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Insurance Validity
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification
                        .insuranceUpto || "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      RC Status
                    </p>
                    <p
                      className={`font-medium ${
                        verificationResults.rcAdvancedVerification.rcStatus ===
                        "ACTIVE"
                          ? darkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : darkMode
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    >
                      {verificationResults.rcAdvancedVerification.rcStatus ||
                        "Not Available"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RC Challan Verification Results */}
          {verificationResults.rcChallanVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  RC Challan Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.rcChallanVerification.verificationStatus
                )}
              </div>

              {verificationResults.rcChallanVerification.verificationStatus ===
                "verified" && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        RC Number
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.rcChallanVerification.rcNumber}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total Challans
                      </p>
                      <p
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {verificationResults.rcChallanVerification
                          .totalChallans || "0"}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total Amount Due
                      </p>
                      <p
                        className={`font-medium ${
                          verificationResults.rcChallanVerification.totalAmount
                            ? darkMode
                              ? "text-red-400"
                              : "text-red-600"
                            : darkMode
                            ? "text-green-400"
                            : "text-green-600"
                        }`}
                      >
                        {verificationResults.rcChallanVerification.totalAmount
                          ? `₹${verificationResults.rcChallanVerification.totalAmount}`
                          : "₹0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Challan Details */}
                  {verificationResults.rcChallanVerification.challanDetails &&
                    verificationResults.rcChallanVerification.challanDetails
                      .length > 0 && (
                      <div className="mt-4">
                        <p
                          className={`text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Challan History
                        </p>
                        <div className="overflow-x-auto">
                          <table
                            className={`min-w-full ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            <thead
                              className={`${
                                darkMode ? "bg-gray-800" : "bg-gray-100"
                              }`}
                            >
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium">
                                  Challan No.
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium">
                                  Offense
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium">
                                  Amount
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {verificationResults.rcChallanVerification.challanDetails
                                .slice(0, 5)
                                .map((challan, index) => (
                                  <tr
                                    key={index}
                                    className={
                                      index % 2 === 0
                                        ? darkMode
                                          ? "bg-gray-700"
                                          : "bg-white"
                                        : darkMode
                                        ? "bg-gray-600"
                                        : "bg-gray-50"
                                    }
                                  >
                                    <td className="px-4 py-2 text-sm">
                                      {challan.challanNumber}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {challan.challanDate}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {challan.offenseDetails}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      ₹{challan.amount}
                                    </td>
                                    <td
                                      className={`px-4 py-2 text-sm ${
                                        challan.challanStatus === "Paid"
                                          ? darkMode
                                            ? "text-green-400"
                                            : "text-green-600"
                                          : darkMode
                                          ? "text-red-400"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {challan.challanStatus}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        {verificationResults.rcChallanVerification
                          .challanDetails.length > 5 && (
                          <p
                            className={`mt-2 text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Showing 5 of{" "}
                            {
                              verificationResults.rcChallanVerification
                                .challanDetails.length
                            }{" "}
                            challans
                          </p>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* UAN Verification Results */}
          {verificationResults.uanVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Building className="w-5 h-5 mr-2" />
                  UAN Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.uanVerification.verificationStatus
                )}
              </div>

              {verificationResults.uanVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      UAN Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.uanVerification.uanNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Source Type
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.uanVerification.source === "pan"
                        ? "PAN"
                        : verificationResults.uanVerification.source ===
                          "aadhaar"
                        ? "Aadhaar"
                        : "Mobile"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Source Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.uanVerification.sourceNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile to PAN Verification Results */}
          {verificationResults.mobileToPANVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <UserSearch className="w-5 h-5 mr-2" />
                  Mobile to PAN Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.mobileToPANVerification.verificationStatus
                )}
              </div>

              {verificationResults.mobileToPANVerification
                .verificationStatus === "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Mobile Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.mobileNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      PAN Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.panNumber ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Full Name
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.fullName ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Gender
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.gender ===
                      "M"
                        ? "Male"
                        : verificationResults.mobileToPANVerification.gender ===
                          "F"
                        ? "Female"
                        : verificationResults.mobileToPANVerification.gender ||
                          "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Date of Birth
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.dob ||
                        "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Aadhaar Linked
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mobileToPANVerification.aadhaarLinked
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/*Court Case Verfication*/}
          {verificationResults.personalInfo.fatherName && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <UserSearch className="w-5 h-5 mr-2" />
                  Court Case Verification
                </h3>
                {renderVerificationStatus("verified")}
              </div>
              <CourtCaseResult
                profileData={{
                  personalInfo: {
                    fullName: verificationResults.personalInfo.name,
                    dateOfBirth: verificationResults.personalInfo.dob,
                    fatherName: verificationResults.personalInfo.fatherName,
                  },
                  contactInfo: {
                    mobileNumber: verificationResults.personalInfo.mobile,
                  },
                }}
              />
            </div>
          )}

          {/*MNRL Verification*/}
          {verificationResults.mnrlVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Building className="w-5 h-5 mr-2" />
                  MNRL Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.mnrlVerification.verificationStatus
                )}
              </div>

              {verificationResults.mnrlVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      MNRL Record
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mnrlVerification.mnrl_record_found
                        ? "True"
                        : "False"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Latest Revocation Status
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mnrlVerification
                        .latest_revocation_status
                        ? "True"
                        : "False"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Latest Revocation Year
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.mnrlVerification
                        .latest_revocation_year == null
                        ? "Not Found"
                        : verificationResults.mnrlVerification
                            .latest_revocation_year}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VoterId verification */}
          {verificationResults.voterIdVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Building className="w-5 h-5 mr-2" />
                  VoterId Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.voterIdVerification.verificationStatus
                )}
              </div>

              {verificationResults.voterIdVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Voter's Name on Card
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.voterIdVerification.name_on_card}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Epic Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.voterIdVerification.epic_Number}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Voter's Gender
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.voterIdVerification.gender === "M"
                        ? "Male"
                        : "Female"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Voter's District
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.voterIdVerification.district}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Voter's State
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.voterIdVerification.state}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passport Verification */}
          {verificationResults.passportVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Building className="w-5 h-5 mr-2" />
                  Passport Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.passportVerification.verificationStatus
                )}
              </div>

              {verificationResults.passportVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Passport holder's Name
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.passportVerification.name}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Passport holder's File Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.passportVerification.fileNumber}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Passport holder's Status
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.passportVerification.status}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Passport holder's Application Type
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.passportVerification.applicationType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Account Verification Results */}
          {verificationResults.bankAccountVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <BuildingIcon className="w-5 h-5 mr-2" />
                  Bank Account Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.bankAccountVerification.verificationStatus
                )}
              </div>
              {verificationResults.bankAccountVerification
                .verificationStatus === "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Account Holder Name at Bank
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification.nameAtBank}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Account Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification.bankAccount}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      IFSC code
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification.ifscCode}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verification Status
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification.message}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Account Existence
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification
                        .accountExists === true
                        ? "True"
                        : "False"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      UTR / Last Transaction Number
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.bankAccountVerification.utr}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPI Verification Results */}
          {verificationResults.upiVerification && (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`text-lg font-medium flex items-center ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  UPI Verification
                </h3>
                {renderVerificationStatus(
                  verificationResults.upiVerification.verificationStatus
                )}
              </div>

              {verificationResults.upiVerification.verificationStatus ===
                "verified" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      UPI ID
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.personalInfo.upi}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      UPI Status
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.upiVerification.accountExits === true
                        ? "True"
                        : "False"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Name at Bank
                    </p>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {verificationResults.upiVerification.nameAtBank}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-4 md:mt-6">
            <button
              onClick={handleReset}
              className={`px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              } w-full sm:w-auto`}
            >
              New Verification
            </button>
          </div>
        </div>
      ) : (
        // Verification Form
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Core Personal Information */}
          <div
            className={`p-3 md:p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-4 md:gap-y-5">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User
                      className={`h-5 w-5 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: "" });
                      }
                    }}
                    className={`w-full pl-10 py-2 focus:outline-none rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 ${
                      formErrors.name
                        ? "border-red-500 focus:ring-red-500"
                        : `${
                            darkMode
                              ? "focus:ring-blue-500"
                              : "focus:ring-blue-600"
                          }`
                    }`}
                    placeholder="Enter full name as per ID"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Date of Birth Input */}
              <div>
                <label
                  htmlFor="dob"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Date of Birth *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar
                      className={`h-5 w-5 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="date"
                    id="dob"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (formErrors.dob) {
                        setFormErrors({ ...formErrors, dob: "" });
                      }
                    }}
                    className={`w-full focus:outline-none pl-10 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 ${
                      formErrors.dob
                        ? "border-red-500 focus:ring-red-500"
                        : `${
                            darkMode
                              ? "focus:ring-blue-500"
                              : "focus:ring-blue-600"
                          }`
                    }`}
                  />
                </div>
                {formErrors.dob && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.dob}</p>
                )}
              </div>

              {/* Mobile Input */}
              <div>
                <label
                  htmlFor="mobile"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone
                      className={`h-5 w-5 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(
                        e.target.value.replace(/\D/g, "").substring(0, 10)
                      );
                      if (formErrors.mobile) {
                        setFormErrors({ ...formErrors, mobile: "" });
                      }
                    }}
                    maxLength={10}
                    className={`w-full  focus:outline-none pl-10 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 ${
                      formErrors.mobile
                        ? "border-red-500 focus:ring-red-500"
                        : `${
                            darkMode
                              ? "focus:ring-blue-500"
                              : "focus:ring-blue-600"
                          }`
                    }`}
                    placeholder="10-digit mobile number"
                  />
                </div>
                {formErrors.mobile && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.mobile}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Verification Options */}
          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Select Verifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Identity & Court Case Verification Group*/}
              <div className="space-y-4">
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Identity Verification
                </p>

                {/* Aadhaar Verification Option */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-aadhaar"
                      type="checkbox"
                      checked={activeVerifications.includes("aadhaar")}
                      onChange={() => handleVerificationToggle("aadhaar")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-aadhaar"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      Aadhaar Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify basic details through Aadhaar
                    </p>

                    {activeVerifications.includes("aadhaar") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={aadhaar}
                            onChange={(e) => {
                              setAadhaar(
                                e.target.value
                                  .replace(/\D/g, "")
                                  .substring(0, 12)
                              );
                              if (formErrors.aadhaar) {
                                setFormErrors({ ...formErrors, aadhaar: "" });
                              }
                            }}
                            maxLength={12}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.aadhaar
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter Aadhaar number"
                          />
                        </div>
                        {formErrors.aadhaar && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.aadhaar}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* PAN Verification Option */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-pan"
                      type="checkbox"
                      checked={activeVerifications.includes("pan")}
                      onChange={() => handleVerificationToggle("pan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-pan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <FileDigit className="h-5 w-5 mr-2" />
                      PAN Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify PAN details and status
                    </p>

                    {activeVerifications.includes("pan") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={pan}
                            onChange={(e) => {
                              setPan(
                                e.target.value.toUpperCase().substring(0, 10)
                              );
                              if (formErrors.pan) {
                                setFormErrors({ ...formErrors, pan: "" });
                              }
                            }}
                            maxLength={10}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.pan
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter PAN Number"
                          />
                        </div>
                        {formErrors.pan && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.pan}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Driving License Verification Option */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-dl"
                      type="checkbox"
                      checked={activeVerifications.includes("dl")}
                      onChange={() => handleVerificationToggle("dl")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-dl"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <BadgeInfo className="h-5 w-5 mr-2" />
                      Driving License Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify driving license details and validity
                    </p>

                    {activeVerifications.includes("dl") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={dl}
                            onChange={(e) => {
                              setDl(e.target.value.toUpperCase());
                              if (formErrors.dl) {
                                setFormErrors({ ...formErrors, dl: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.dl
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter DL number"
                          />
                        </div>
                        {formErrors.dl && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.dl}
                          </p>
                        )}

                        {activeVerifications.includes("dl") && !dob && (
                          <p className="mt-1 text-sm text-amber-500">
                            Date of Birth is required for DL verification
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile to PAN Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-mobile-to-pan"
                      type="checkbox"
                      checked={activeVerifications.includes("mobile-to-pan")}
                      onChange={() => handleVerificationToggle("mobile-to-pan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-mobile-to-pan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <UserSearch className="h-5 w-5 mr-2" />
                      Mobile to PAN
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find PAN details linked to the mobile number
                    </p>
                  </div>
                </div>

                {/* MNRL Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-mnrl"
                      type="checkbox"
                      checked={activeVerifications.includes("mnrl")}
                      onChange={() => handleVerificationToggle("mnrl")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-mnrl"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <UserSearch className="h-5 w-5 mr-2" />
                      MNRL Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify MNRL details
                    </p>
                  </div>
                </div>

                {/* VoterId Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-voterId"
                      type="checkbox"
                      checked={activeVerifications.includes("voter-id")}
                      onChange={() => handleVerificationToggle("voter-id")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-voterId"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <UserSquareIcon className="h-5 w-5 mr-2" />
                      VoterId Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify VoterId details and validity
                    </p>

                    {activeVerifications.includes("voter-id") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={epicNumber}
                            onChange={(e) => {
                              setEpicNumber(e.target.value.toUpperCase());
                              if (formErrors.dl) {
                                setFormErrors({
                                  ...formErrors,
                                  epicNumber: "",
                                });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.epicNumber
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter Epic Number"
                          />
                        </div>
                        {formErrors.epicNumber && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.epicNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Passport Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-passport"
                      type="checkbox"
                      checked={activeVerifications.includes("passport")}
                      onChange={() => handleVerificationToggle("passport")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-passport"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <BookUser className="h-5 w-5 mr-2" />
                      Passport Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Passport details and validity
                    </p>

                    {activeVerifications.includes("passport") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={fileNumber}
                            onChange={(e) => {
                              setFileNumber(e.target.value.toUpperCase());
                              if (formErrors.fileNumber) {
                                setFormErrors({
                                  ...formErrors,
                                  fileNumber: "",
                                });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.fileNumber
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter File Number of Passport"
                          />
                        </div>
                        {formErrors.epicNumber && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.fileNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/*Court case verfication*/}
                <div className="space-y-4">
                  <p
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-700"
                    }`}
                  >
                    CourtCase Verification
                  </p>
                  {/*FatherName verfication*/}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="verify-fatherName"
                        type="checkbox"
                        checked={activeVerifications.includes("fatherName")}
                        onChange={() => handleVerificationToggle("fatherName")}
                        className={`h-4 w-4 rounded ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                            : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                        }`}
                      />
                    </div>
                    <div className="ml-3">
                      <label
                        htmlFor="verify-fatherName"
                        className={`text-sm font-medium flex items-center ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        <Landmark className="h-5 w-5 mr-2" />
                        CourtCase Verification
                      </label>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Verify CourtCase details
                      </p>

                      {activeVerifications.includes("fatherName") && (
                        <div className="mt-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={fatherName}
                              onChange={(e) => {
                                setFatherName(e.target.value);
                                if (formErrors.fatherName) {
                                  setFormErrors({
                                    ...formErrors,
                                    fatherName: "",
                                  });
                                }
                              }}
                              className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                                darkMode
                                  ? "bg-gray-800 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:ring-2 ${
                                formErrors.fatherName
                                  ? "border-red-500 focus:ring-red-500"
                                  : `${
                                      darkMode
                                        ? "focus:ring-blue-500"
                                        : "focus:ring-blue-600"
                                    }`
                              }`}
                              placeholder="Enter Father Name"
                            />
                          </div>
                          {formErrors.fatherName && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.fatherName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Financial Verification Group */}
              <div className="space-y-4">
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Vehicle & Financial
                </p>

                {/* RC Advanced Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-rc-advanced"
                      type="checkbox"
                      checked={activeVerifications.includes("rc-advanced")}
                      onChange={() => handleVerificationToggle("rc-advanced")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-rc-advanced"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Car className="h-5 w-5 mr-2" />
                      RC Advanced
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Check vehicle registration details
                    </p>

                    {activeVerifications.includes("rc-advanced") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={rcNumber}
                            onChange={(e) => {
                              setRcNumber(e.target.value.toUpperCase());
                              if (formErrors.rcNumber) {
                                setFormErrors({ ...formErrors, rcNumber: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.rcNumber
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter RC number"
                          />
                        </div>
                        {formErrors.rcNumber && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.rcNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* RC Challan Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-rc-challan"
                      type="checkbox"
                      checked={activeVerifications.includes("rc-challan")}
                      onChange={() => handleVerificationToggle("rc-challan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-rc-challan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      RC Challan Details
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Check pending challan history
                    </p>

                    {activeVerifications.includes("rc-challan") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={rcNumber}
                            onChange={(e) => {
                              setRcNumber(e.target.value.toUpperCase());
                              if (formErrors.rcNumber) {
                                setFormErrors({ ...formErrors, rcNumber: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.rcNumber
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter RC number"
                          />
                        </div>
                        {formErrors.rcNumber && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.rcNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Account Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-bankAccount"
                      type="checkbox"
                      checked={
                        activeVerifications.includes("bankAccount") &&
                        activeVerifications.includes("ifsc")
                      }
                      onChange={() => {
                        if (
                          activeVerifications.includes("bankAccount") &&
                          activeVerifications.includes("ifsc")
                        ) {
                          handleVerificationToggle("bankAccount");
                          handleVerificationToggle("ifsc");
                        } else {
                          if (!activeVerifications.includes("bankAccount"))
                            handleVerificationToggle("bankAccount");
                          if (!activeVerifications.includes("ifsc"))
                            handleVerificationToggle("ifsc");
                        }
                      }}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-bankAccount"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Bank Account Details
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Bank Account details
                    </p>

                    {activeVerifications.includes("bankAccount") &&
                      activeVerifications.includes("ifsc") && (
                        <div className="mt-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={bankAccount}
                              onChange={(e) => {
                                setBankAccount(e.target.value);
                                if (formErrors.upi) {
                                  setFormErrors({
                                    ...formErrors,
                                    bankAccount: "",
                                  });
                                }
                              }}
                              className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                                darkMode
                                  ? "bg-gray-800 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:ring-2 ${
                                formErrors.bankAccount
                                  ? "border-red-500 focus:ring-red-500"
                                  : `${
                                      darkMode
                                        ? "focus:ring-blue-500"
                                        : "focus:ring-blue-600"
                                    }`
                              }`}
                              placeholder="Enter Bank Account Number"
                            />
                            <input
                              type="text"
                              value={ifscCode}
                              onChange={(e) => {
                                setIfscCode(e.target.value);
                                if (formErrors.ifsc) {
                                  setFormErrors({ ...formErrors, ifsc: "" });
                                }
                              }}
                              className={`w-full mt-3 py-2 px-3 rounded-lg focus:outline-none border ${
                                darkMode
                                  ? "bg-gray-800 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:ring-2 ${
                                formErrors.ifsc
                                  ? "border-red-500 focus:ring-red-500"
                                  : `${
                                      darkMode
                                        ? "focus:ring-blue-500"
                                        : "focus:ring-blue-600"
                                    }`
                              }`}
                              placeholder="Enter IFSC Code"
                            />
                          </div>
                          {formErrors.bankAccount && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.bankAccount}
                            </p>
                          )}
                          {formErrors.ifsc && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.ifsc}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* UPI Verification */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-upi"
                      type="checkbox"
                      checked={activeVerifications.includes("upi")}
                      onChange={() => handleVerificationToggle("upi")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-upi"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <BanknoteIcon className="h-5 w-5 mr-2" />
                      UPI Details
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify UPI details
                    </p>

                    {activeVerifications.includes("upi") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={upi}
                            onChange={(e) => {
                              setUpi(e.target.value);
                              if (formErrors.upi) {
                                setFormErrors({ ...formErrors, upi: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.upi
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter UPI ID"
                          />
                        </div>
                        {formErrors.upi && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.upi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Verification Section */}
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-700"
                  } mt-5`}
                >
                  Employment
                </p>

                {/* PAN to UAN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-pan-to-uan"
                      type="checkbox"
                      checked={activeVerifications.includes("pan-to-uan")}
                      onChange={() => handleVerificationToggle("pan-to-uan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-pan-to-uan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      PAN to UAN
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find UAN linked to PAN
                    </p>

                    {activeVerifications.includes("pan-to-uan") && !pan && (
                      <p className="mt-1 text-sm text-amber-500">
                        PAN number is required for PAN to UAN verification
                      </p>
                    )}
                  </div>
                </div>

                {/* Aadhaar to UAN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-aadhaar-to-uan"
                      type="checkbox"
                      checked={activeVerifications.includes("aadhaar-to-uan")}
                      onChange={() =>
                        handleVerificationToggle("aadhaar-to-uan")
                      }
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-aadhaar-to-uan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Aadhaar to UAN
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find UAN linked to Aadhaar
                    </p>

                    {activeVerifications.includes("aadhaar-to-uan") &&
                      !aadhaar && (
                        <p className="mt-1 text-sm text-amber-500">
                          Aadhaar number is required for Aadhaar to UAN
                          verification
                        </p>
                      )}
                  </div>
                </div>

                {/* Mobile to UAN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-mobile-to-uan"
                      type="checkbox"
                      checked={activeVerifications.includes("mobile-to-uan")}
                      onChange={() => handleVerificationToggle("mobile-to-uan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-mobile-to-uan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Mobile to UAN
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find UAN linked to Mobile number
                    </p>

                    {activeVerifications.includes("mobile-to-uan") &&
                      !mobile && (
                        <p className="mt-1 text-sm text-amber-500">
                          Mobile number is required for Mobile to UAN
                          verification
                        </p>
                      )}
                  </div>
                </div>

                {/* Employement History  */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-ehuan"
                      type="checkbox"
                      checked={activeVerifications.includes("ehuan")}
                      onChange={() => handleVerificationToggle("ehuan")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-ehuan"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      Employment History
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find Employment History details
                    </p>

                    {activeVerifications.includes("ehuan") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={ehuan}
                            onChange={(e) => {
                              setEHuan(e.target.value);
                              if (formErrors.ehuan) {
                                setFormErrors({ ...formErrors, ehuan: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.ehuan
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter UAN number"
                          />
                        </div>
                        {formErrors.ehuan && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.ehuan}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Verification Group */}
              <div className="space-y-4">
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Business
                </p>

                {/* GSTIN Advanced */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-gstinAdvanced"
                      type="checkbox"
                      checked={activeVerifications.includes("gstinAdvanced")}
                      onChange={() => handleVerificationToggle("gstinAdvanced")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-gstinAdvanced"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      GSTIN Advanced Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify GSTIN details
                    </p>

                    {activeVerifications.includes("gstinAdvanced") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={gstinAdvanced}
                            onChange={(e) => {
                              setGstinAdvanced(e.target.value);
                              if (formErrors.gstinAdvanced) {
                                setFormErrors({
                                  ...formErrors,
                                  gstinAdvanced: "",
                                });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.gstinAdvanced
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter GSTIN number"
                          />
                        </div>
                        {formErrors.gstinAdvanced && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.gstinAdvanced}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pan to DIN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-pan-to-din"
                      type="checkbox"
                      checked={activeVerifications.includes("pan-to-din")}
                      onChange={() => handleVerificationToggle("pan-to-din")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-pan-to-din"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      PAN to DIN
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Find DIN linked to PAN
                    </p>

                    {activeVerifications.includes("pan-to-din") && !pan && (
                      <p className="mt-1 text-sm text-amber-500">
                        PAN number is required for PAN to DIN verification
                      </p>
                    )}
                  </div>
                </div>

                {/* Pan-MSME Registration */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-pan-to-msme"
                      type="checkbox"
                      checked={activeVerifications.includes("pan-to-msme")}
                      onChange={() => handleVerificationToggle("pan-to-msme")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-pan-to-msme"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Pan to MSME Registration
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify MSME Registration
                    </p>

                    {activeVerifications.includes("pan-to-msme") && !pan && (
                      <p className="mt-1 text-sm text-amber-500">
                        PAN number is required for MSME registration
                        verification
                      </p>
                    )}
                  </div>
                </div>

                {/* CIN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-cin"
                      type="checkbox"
                      checked={activeVerifications.includes("cin")}
                      onChange={() => handleVerificationToggle("cin")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-cin"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      CIN Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Corporate Identification Number details
                    </p>

                    {activeVerifications.includes("cin") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={cin}
                            onChange={(e) => {
                              setCin(e.target.value);
                              if (formErrors.cin) {
                                setFormErrors({ ...formErrors, cin: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.cin
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter CIN number"
                          />
                        </div>
                        {formErrors.cin && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.cin}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* DIN */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-din"
                      type="checkbox"
                      checked={activeVerifications.includes("din")}
                      onChange={() => handleVerificationToggle("din")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-din"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      DIN Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Director Identification Number details
                    </p>

                    {activeVerifications.includes("din") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={din}
                            onChange={(e) => {
                              setDin(e.target.value);
                              if (formErrors.din) {
                                setFormErrors({ ...formErrors, din: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.din
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter DIN number"
                          />
                        </div>
                        {formErrors.din && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.din}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* S&E Cert */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-secerti"
                      type="checkbox"
                      checked={
                        activeVerifications.includes("secerti") &&
                        activeVerifications.includes("stateCode")
                      }
                      onChange={() => {
                        if (
                          activeVerifications.includes("secerti") &&
                          activeVerifications.includes("stateCode")
                        ) {
                          handleVerificationToggle("secerti");
                          handleVerificationToggle("stateCode");
                        } else {
                          if (!activeVerifications.includes("secerti"))
                            handleVerificationToggle("secerti");
                          if (!activeVerifications.includes("stateCode"))
                            handleVerificationToggle("stateCode");
                        }
                      }}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-secerti"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Building className="h-5 w-5 mr-2" />
                      Shop Establishment Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Shop Establishment Certificate
                    </p>

                    {activeVerifications.includes("secerti") &&
                      activeVerifications.includes("stateCode") && (
                        <div className="mt-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={secerti}
                              onChange={(e) => {
                                setSEcerti(e.target.value);
                                if (formErrors.secerti) {
                                  setFormErrors({
                                    ...formErrors,
                                    secerti: "",
                                  });
                                }
                              }}
                              className={`w-full py-2 px-3 rounded-lg focus:outline-none border ${
                                darkMode
                                  ? "bg-gray-800 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:ring-2 ${
                                formErrors.secerti
                                  ? "border-red-500 focus:ring-red-500"
                                  : `${
                                      darkMode
                                        ? "focus:ring-blue-500"
                                        : "focus:ring-blue-600"
                                    }`
                              }`}
                              placeholder="Enter Shop Establishment Certificate Number"
                            />
                            <input
                              type="text"
                              value={stateCode}
                              onChange={(e) => {
                                setStateCode(e.target.value);
                                if (formErrors.stateCode) {
                                  setFormErrors({
                                    ...formErrors,
                                    stateCode: "",
                                  });
                                }
                              }}
                              className={`w-full mt-3 py-2 px-3 rounded-lg focus:outline-none border ${
                                darkMode
                                  ? "bg-gray-800 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:ring-2 ${
                                formErrors.stateCode
                                  ? "border-red-500 focus:ring-red-500"
                                  : `${
                                      darkMode
                                        ? "focus:ring-blue-500"
                                        : "focus:ring-blue-600"
                                    }`
                              }`}
                              placeholder="Enter State Code (Dl for Delhi or KR for Karnataka)"
                            />
                          </div>
                          {formErrors.secerti && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.secerti}
                            </p>
                          )}
                          {formErrors.stateCode && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.stateCode}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Udyam Aadhaar */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-udyam"
                      type="checkbox"
                      checked={activeVerifications.includes("udyam")}
                      onChange={() => handleVerificationToggle("udyam")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-udyam"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      Udyam Aadhaar Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Udyam Aadhaar details
                    </p>

                    {activeVerifications.includes("udyam") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={udyam}
                            onChange={(e) => {
                              setUdyam(e.target.value);
                              if (formErrors.udyam) {
                                setFormErrors({ ...formErrors, udyam: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.udyam
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter Udhyam Aadhar number"
                          />
                        </div>
                        {formErrors.udyam && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.udyam}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Udyog Aadhaar */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="verify-udyog"
                      type="checkbox"
                      checked={activeVerifications.includes("udyog")}
                      onChange={() => handleVerificationToggle("udyog")}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="verify-udyog"
                      className={`text-sm font-medium flex items-center ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      Udyog Aadhaar Verification
                    </label>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Verify Udyog Aadhaar details
                    </p>

                    {activeVerifications.includes("udyog") && (
                      <div className="mt-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={udyog}
                            onChange={(e) => {
                              setUdyog(e.target.value);
                              if (formErrors.udyog) {
                                setFormErrors({ ...formErrors, udyog: "" });
                              }
                            }}
                            className={`w-full py-2 px-3 focus:outline-none rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 ${
                              formErrors.udyog
                                ? "border-red-500 focus:ring-red-500"
                                : `${
                                    darkMode
                                      ? "focus:ring-blue-500"
                                      : "focus:ring-blue-600"
                                  }`
                            }`}
                            placeholder="Enter Udhyog Aadhaar number"
                          />
                        </div>
                        {formErrors.udyog && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.udyog}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-4 md:mt-6 flex justify-center py-2 md:py-3 px-4 md:px-6 border border-transparent rounded-md shadow-md text-sm md:text-base font-medium text-white ${
              darkMode
                ? "bg-blue-700 hover:bg-blue-600 focus:ring-blue-600"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto`}
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
                <User className="mr-2 h-5 w-5" />
                Generate Profile
              </span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default PersonalMiniVerificationTab;
