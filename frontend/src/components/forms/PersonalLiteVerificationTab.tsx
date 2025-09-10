import { useState, FormEvent, useEffect, useRef, ReactNode } from "react";
import { jsPDF } from "jspdf";
import { utils, writeFile } from "xlsx";
import {
  User,
  Phone,
  Fingerprint,
  FileDigit,
  BadgeInfo,
  Building,
  Briefcase,
  AtSign,
  Calendar,
  Link as LinkIcon,
  TrendingUp,
  Banknote,
  CreditCard,
  Verified,
  ShieldCheck,
  Sheet,
  Send,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  Home,
  MapPin,
  Globe,
  Download,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Type definitions
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  darkMode: boolean;
}

interface ProfileData {
  personalInfo?: {
    full_name?: string;
    fullName?: string;
    gender?: string;
    dob?: string;
    dateOfBirth?: string;
    father_name?: string;
    fatherName?: string;
    pan_number?: string;
    panNumber?: string;
    category?: string;
    aadhaar_linked?: boolean;
    aadhaarLinked?: boolean;
    aadhaar_number?: string;
    aadhaarNumber?: string;
  };
  contactInfo?: {
    mobile_number?: string;
    mobileNumber?: string;
    name?: string;
    alternativeName?: string;
    networkOperator?: string;
    networkRegion?: string;
    numberType?: string;
    address?: string;
    addressDetails?: {
      line_1?: string;
      line_2?: string;
      street_name?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      full?: string;
    };
    email?: string;
    phoneNumber?: string;
  };
  digitalInfo?: {
    digitalAge?: string | number;
    nameAtBank?: string;
    upiIds?: string[];
  };
  employmentInfo?: {
    uanNumber?: string;
    employmentHistory?: Array<{
      companyName?: string;
      establishment_name?: string;
      memberId?: string;
      dateOfJoining?: string;
      date_of_joining?: string;
      dateOfExit?: string;
      date_of_exit?: string;
      lastPFSubmitted?: string;
      last_pf_submitted?: string;
    }>;
  };
  businessInfo?: {
    msmeStatus?: string | boolean;
    panDetails?: {
      full_name?: string;
      category?: string;
      gender?: string;
      dob?: string;
      aadhaar_linked?: boolean;
      status?: string;
    };
  };

  rawProfileData?: any;
}

interface SectionProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  darkMode: boolean;
}

interface InfoItemProps {
  label: string;
  value: string | number | boolean | undefined;
  icon: React.FC<{ className?: string }>;
  darkMode: boolean;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  darkMode: boolean;
  isSending?: boolean;
}

// Toast Component for notifications
const Toast: React.FC<ToastProps> = ({ message, type, onClose, darkMode }) => {
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  const Icon = type === "success" ? CheckCircle : AlertTriangle;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg ${bgColor} ${
        darkMode ? "text-gray-100" : "text-white"
      } shadow-lg transition-opacity`}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span>{message}</span>
    </div>
  );
};

// Email Modal Component
const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  darkMode,
  isSending = false, // Make sure this prop is being properly passed
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
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
  }, [isOpen, onClose, isSending]); // Add isSending to dependency array

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    onSubmit(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
            Send Profile Report
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

// Reusable Section Component
const Section: React.FC<SectionProps> = ({
  title,
  icon: Icon,
  children,
  darkMode,
}) => (
  <div
    className={`${
      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
    } shadow-md rounded-lg mb-6 overflow-hidden border transition-all hover:shadow-lg`}
  >
    <div
      className={`flex items-center p-4 ${
        darkMode
          ? "bg-gradient-to-r from-blue-900 to-gray-800 border-gray-700"
          : "bg-gradient-to-r from-blue-50 to-white border-gray-200"
      } border-b`}
    >
      <Icon
        className={`w-6 h-6 mr-3 ${
          darkMode ? "text-blue-400" : "text-blue-600"
        }`}
      />
      <h3
        className={`text-lg font-semibold ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// Reusable Info Item Component
const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon: Icon,
  darkMode,
}) => {
  // Helper function to format value
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return "Not Available";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    return String(val);
  };

  return (
    <div
      className={`flex items-start mb-4 space-x-3 capitalize group transition-all hover:bg-${
        darkMode ? "gray-700" : "gray-50"
      } p-2 rounded-md`}
    >
      <Icon
        className={`w-5 h-5 ${
          darkMode ? "text-blue-400" : "text-blue-600"
        } mt-1 flex-shrink-0 group-hover:${
          darkMode ? "text-blue-300" : "text-blue-700"
        }`}
      />
      <div>
        <dt
          className={`text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {label}
        </dt>
        <dd
          className={`text-sm ${
            darkMode ? "text-gray-100" : "text-gray-800"
          } font-normal`}
        >
          {formatValue(value)}
        </dd>
      </div>
    </div>
  );
};

export default function PersonalProfilePage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [dl, setDl] = useState("");
  const [rc, setRc] = useState("");
  const dobInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const { darkMode, toggleDarkMode } = useTheme(); // Use the theme context
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileData(null);
    setToastMessage(null);

    try {
      // First fetch the main Personal Verification
      const response = await fetch("/api/verification-lite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobile_number: mobile,
          aadhaar_number: aadhaar,
          pan_number: pan,
          dl_number: dl, // Add DL number
          rc_number: rc, // Add RC number
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate profile");
      }

      const data = await response.json();

      // Add the Aadhaar number to the personal info section
      const profileWithAadhaar = data.rawProfileData || data;
      if (profileWithAadhaar.personalInfo) {
        profileWithAadhaar.personalInfo.aadhaar_number = aadhaar;
      }

      // Set initial Personal Verification
      setProfileData(profileWithAadhaar);
      console.log(profileData);

      // If driving license number is provided, fetch driving license data
      // Update the license fetch logic in handleSubmit
      if (dl) {
        try {
          // Get DOB from personal info
          const dob =
            profileWithAadhaar.personalInfo?.dob ||
            profileWithAadhaar.personalInfo?.dateOfBirth ||
            dobInputRef.current?.value;

          if (dob) {
            const dlResponse = await fetch("/api/profile-generator/dl", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                service: "driving-license",
                dl_number: dl,
                dob: dob,
              }),
            });

            const dlData = await dlResponse.json();

            // Extract the data path based on response structure
            let sourceOutput;
            if (dlData.drivingInfo) {
              sourceOutput = dlData.drivingInfo;
            } else if (dlData.response?.result?.source_output) {
              sourceOutput = dlData.response.result.source_output;
            } else if (dlData.result?.source_output) {
              sourceOutput = dlData.result.source_output;
            } else {
              sourceOutput = {};
            }

            // Check if source_output has a "id_not_found" status or lacks essential fields
            if (
              sourceOutput.status === "id_not_found" ||
              (!sourceOutput.name &&
                !sourceOutput.address &&
                !sourceOutput.issuing_rto_name &&
                !sourceOutput.nt_validity_to)
            ) {
              // Create a special drivingInfo object with an error state
              profileWithAadhaar.drivingInfo = {
                status: "error",
                id_number: dl,
                name: null,
                error_message:
                  "Unable to verify driving license. Please check the license number and try again.",
                // Include the rest of the fields with null values
                relatives_name: null,
                dob: dob,
                address: null,
                issuing_rto_name: null,
                date_of_issue: null,
                nt_validity_from: null,
                nt_validity_to: null,
                cov_details: [],
              };
            } else {
              // Create properly formatted driving info object for valid response
              profileWithAadhaar.drivingInfo = {
                status: sourceOutput.status || "id_found",
                id_number: sourceOutput.id_number || dl,
                name:
                  sourceOutput.name ||
                  profileWithAadhaar.personalInfo?.full_name ||
                  name,
                relatives_name: sourceOutput.relatives_name,
                dob: sourceOutput.dob || dob,
                address: sourceOutput.address,
                issuing_rto_name: sourceOutput.issuing_rto_name,
                date_of_issue: sourceOutput.date_of_issue,
                nt_validity_from: sourceOutput.nt_validity_from,
                nt_validity_to: sourceOutput.nt_validity_to,
                cov_details: sourceOutput.cov_details || [],
              };
            }

            // Update the Personal Verification with the drivingInfo (whether valid or error state)
            setProfileData(profileWithAadhaar);
          }
        } catch (dlError) {
          console.error("Error fetching DL data:", dlError);

          // Create an error state drivingInfo object
          profileWithAadhaar.drivingInfo = {
            status: "error",
            id_number: dl,
            name: null,
            error_message:
              "Failed to verify driving license. Please try again later.",
            relatives_name: null,
            dob: null,
            address: null,
            issuing_rto_name: null,
            date_of_issue: null,
            nt_validity_from: null,
            nt_validity_to: null,
            cov_details: [],
          };

          setProfileData(profileWithAadhaar);
        }
      }
      if (rc) {
        try {
          const rcResponse = await fetch("/api/verification-lite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              service: "vehicle-rc",
              rc_number: rc,
            }),
          });

          if (rcResponse.ok) {
            const rcData = await rcResponse.json();

            // Extract source output from different possible paths
            let sourceOutput;
            if (rcData.vehicleInfo) {
              sourceOutput = rcData.vehicleInfo;
            } else if (rcData.response?.data) {
              sourceOutput = rcData.response.data;
            } else if (rcData.data) {
              sourceOutput = rcData.data;
            } else {
              sourceOutput = {};
            }

            // Check if source_output lacks essential fields
            if (
              !sourceOutput.rc_number &&
              !sourceOutput.owner_name &&
              !sourceOutput.registration_date
            ) {
              // Create an error state for vehicle info
              profileWithAadhaar.vehicleInfo = {
                status: "error",
                rc_number: rc,
                error_message:
                  "Unable to verify vehicle details. Please check the RC number and try again.",
              };
            } else {
              // Create a properly formatted vehicle info object
              profileWithAadhaar.vehicleInfo = {
                status: "id_found",
                rc_number: sourceOutput.rc_number || rc,
                owner_name: sourceOutput.owner_name,
                father_name: sourceOutput.father_name,
                registration_date: sourceOutput.registration_date,
                present_address: sourceOutput.present_address,
                permanent_address: sourceOutput.permanent_address,
                vehicle_category: sourceOutput.vehicle_category,
                vehicle_chasi_number: sourceOutput.vehicle_chasi_number,
                vehicle_engine_number: sourceOutput.vehicle_engine_number,
                maker_description: sourceOutput.maker_description,
                maker_model: sourceOutput.maker_model,
                body_type: sourceOutput.body_type,
                fuel_type: sourceOutput.fuel_type,
                color: sourceOutput.color,
                norms_type: sourceOutput.norms_type,
                fit_up_to: sourceOutput.fit_up_to,
                financer: sourceOutput.financer,
                financed: sourceOutput.financed,
                insurance_company: sourceOutput.insurance_company,
                insurance_policy_number: sourceOutput.insurance_policy_number,
                insurance_upto: sourceOutput.insurance_upto,
                manufacturing_date:
                  sourceOutput.manufacturing_date ||
                  sourceOutput.manufacturing_date_formatted,
                registered_at: sourceOutput.registered_at,
                cubic_capacity: sourceOutput.cubic_capacity,
                vehicle_gross_weight: sourceOutput.vehicle_gross_weight,
                seat_capacity: sourceOutput.seat_capacity,
                unladen_weight: sourceOutput.unladen_weight,
                vehicle_category_description:
                  sourceOutput.vehicle_category_description,
                pucc_number: sourceOutput.pucc_number,
                pucc_upto: sourceOutput.pucc_upto,
                tax_upto: sourceOutput.tax_upto,
                tax_paid_upto: sourceOutput.tax_paid_upto,
              };
            }
          } else {
            // Create an error state for vehicle info if the request fails
            profileWithAadhaar.vehicleInfo = {
              status: "error",
              rc_number: rc,
              error_message:
                "Failed to verify vehicle details. Please try again later.",
            };
          }
        } catch (rcError) {
          console.error("Error fetching RC data:", rcError);
          // Set error state for vehicle info
          profileWithAadhaar.vehicleInfo = {
            status: "error",
            rc_number: rc,
            error_message:
              "Failed to verify vehicle details. Please try again later.",
          };
        }
      }

      // Update the Personal Verification with all the collected info
      setProfileData(profileWithAadhaar);

      setToastMessage({
        message: "Your profile report has been successfully generated",
        type: "success",
      });
    } catch (error) {
      console.error("Error generating profile:", error);
      setToastMessage({
        message: "Failed to generate profile. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = () => {
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
      if (
        profileData.personalInfo.full_name ||
        profileData.personalInfo.fullName
      ) {
        addDataRow(
          "Full Name",
          profileData.personalInfo.full_name ||
            profileData.personalInfo.fullName
        );
      }
      if (profileData.personalInfo.gender) {
        addDataRow("Gender", profileData.personalInfo.gender);
      }
      if (
        profileData.personalInfo.dob ||
        profileData.personalInfo.dateOfBirth
      ) {
        addDataRow(
          "Date of Birth",
          profileData.personalInfo.dob || profileData.personalInfo.dateOfBirth
        );
      }
      if (
        profileData.personalInfo.father_name ||
        profileData.personalInfo.fatherName
      ) {
        addDataRow(
          "Father's Name",
          profileData.personalInfo.father_name ||
            profileData.personalInfo.fatherName
        );
      }
      if (
        profileData.personalInfo.pan_number ||
        profileData.personalInfo.panNumber
      ) {
        addDataRow(
          "PAN Number",
          profileData.personalInfo.pan_number ||
            profileData.personalInfo.panNumber
        );
      }
      addDataRow("Aadhaar Number", aadhaar);
      if (profileData.personalInfo.category) {
        addDataRow("Category", profileData.personalInfo.category);
      }
      if (
        profileData.personalInfo.aadhaar_linked !== undefined ||
        profileData.personalInfo.aadhaarLinked !== undefined
      ) {
        addDataRow(
          "Aadhaar Linked",
          profileData.personalInfo.aadhaar_linked ||
            profileData.personalInfo.aadhaarLinked
        );
      }

      yPos += 5;
    }

    // Contact Information Section
    if (profileData.contactInfo) {
      addSectionHeader("Contact Information");

      if (
        profileData.contactInfo.mobile_number ||
        profileData.contactInfo.mobileNumber
      ) {
        addDataRow(
          "Mobile Number",
          profileData.contactInfo.mobile_number ||
            profileData.contactInfo.mobileNumber
        );
      }
      if (
        profileData.contactInfo.name ||
        profileData.contactInfo.alternativeName
      ) {
        addDataRow(
          "Alternative Name",
          profileData.contactInfo.name ||
            profileData.contactInfo.alternativeName
        );
      }
      if (profileData.contactInfo.networkOperator) {
        addDataRow("Network Operator", profileData.contactInfo.networkOperator);
      }
      if (profileData.contactInfo.networkRegion) {
        addDataRow("Network Region", profileData.contactInfo.networkRegion);
      }
      if (profileData.contactInfo.numberType) {
        addDataRow("Number Type", profileData.contactInfo.numberType);
      }

      yPos += 5;
    }

    // Digital Information Section
    if (profileData.digitalInfo) {
      addSectionHeader("Digital Information");

      if (profileData.digitalInfo.digitalAge) {
        addDataRow("Digital Age", profileData.digitalInfo.digitalAge);
      }
      if (profileData.digitalInfo.nameAtBank) {
        addDataRow("Name at Bank", profileData.digitalInfo.nameAtBank);
      }
      if (
        profileData.digitalInfo.upiIds &&
        profileData.digitalInfo.upiIds.length > 0
      ) {
        addDataRow("UPI IDs", profileData.digitalInfo.upiIds);
      }

      yPos += 5;
    }

    // Employment Information Section
    if (profileData.employmentInfo) {
      addSectionHeader("Employment Information");

      if (profileData.employmentInfo.uanNumber) {
        addDataRow("UAN Number", profileData.employmentInfo.uanNumber);
      }

      if (
        profileData.employmentInfo.employmentHistory &&
        profileData.employmentInfo.employmentHistory.length > 0
      ) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("Employment History:", margin, yPos);
        yPos += 6;

        profileData.employmentInfo.employmentHistory.forEach((job, index) => {
          checkPageBreak(20); // Check if we need a new page for each job

          // Company header with background - lighter blue
          doc.setFillColor(240, 230, 255); // Light blue background
          doc.rect(margin, yPos - 3, contentWidth, 6, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(
            `Company: ${job.companyName || job.establishment_name || "N/A"}`,
            margin + 2,
            yPos
          );
          yPos += 6;

          doc.setFont("helvetica", "normal");
          if (job.memberId) {
            checkPageBreak();
            doc.text(`Member ID: ${job.memberId}`, margin + 5, yPos);
            yPos += 5;
          }
          if (job.dateOfJoining || job.date_of_joining) {
            checkPageBreak();
            doc.text(
              `Date of Joining: ${job.dateOfJoining || job.date_of_joining}`,
              margin + 5,
              yPos
            );
            yPos += 5;
          }
          if (job.dateOfExit || job.date_of_exit) {
            checkPageBreak();
            doc.text(
              `Date of Exit: ${job.dateOfExit || job.date_of_exit}`,
              margin + 5,
              yPos
            );
            yPos += 5;
          } else {
            checkPageBreak();
            doc.text(`Date of Exit: Present`, margin + 5, yPos);
            yPos += 5;
          }
          if (job.lastPFSubmitted || job.last_pf_submitted) {
            checkPageBreak();
            doc.text(
              `Last PF Submitted: ${
                job.lastPFSubmitted || job.last_pf_submitted
              }`,
              margin + 5,
              yPos
            );
            yPos += 5;
          }

          yPos += 3; // Add spacing between jobs
        });
      }

      yPos += 5;
    }

    // Business Information Section
    if (profileData.businessInfo) {
      addSectionHeader("Business Information");

      if (profileData.businessInfo.msmeStatus !== undefined) {
        addDataRow("MSME Status", profileData.businessInfo.msmeStatus);
      }

      if (profileData.businessInfo.panDetails) {
        const panDetails = profileData.businessInfo.panDetails;
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("PAN Details:", margin, yPos);
        yPos += 6;

        if (panDetails.full_name) {
          addDataRow("Full Name", panDetails.full_name, 5);
        }
        if (panDetails.category) {
          addDataRow("Category", panDetails.category, 5);
        }
        if (panDetails.gender) {
          addDataRow("Gender", panDetails.gender, 5);
        }
        if (panDetails.dob) {
          addDataRow("Date of Birth", panDetails.dob, 5);
        }
        if (panDetails.aadhaar_linked !== undefined) {
          addDataRow("Aadhaar Linked", panDetails.aadhaar_linked, 5);
        }
        if (panDetails.status) {
          addDataRow("Status", panDetails.status, 5);
        }
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

  const exportExcel = () => {
    if (!profileData) return;

    const wb = utils.book_new();

    // Function to prepare data for Excel
    const prepareDataForExcel = (
      section: any,
      sectionName: string
    ): Record<string, any> => {
      const flatData: Record<string, any> = {};

      // Special handling for each section
      switch (sectionName) {
        case "Personal":
          if (section.full_name || section.fullName)
            flatData["Full Name"] = section.full_name || section.fullName;
          if (section.gender) flatData["Gender"] = section.gender;
          if (section.dob || section.dateOfBirth)
            flatData["Date of Birth"] = section.dob || section.dateOfBirth;
          if (section.father_name || section.fatherName)
            flatData["Father's Name"] =
              section.father_name || section.fatherName;
          if (section.pan_number || section.panNumber)
            flatData["PAN Number"] = section.pan_number || section.panNumber;
          // Use full Aadhaar number from input
          flatData["Aadhaar Number"] = aadhaar;
          if (section.category) flatData["Category"] = section.category;
          if (
            section.aadhaar_linked !== undefined ||
            section.aadhaarLinked !== undefined
          )
            flatData["Aadhaar Linked"] =
              section.aadhaar_linked || section.aadhaarLinked ? "Yes" : "No";
          break;

        case "Contact":
          if (section.mobile_number || section.mobileNumber)
            flatData["Mobile Number"] =
              section.mobile_number || section.mobileNumber;
          if (section.name || section.alternativeName)
            flatData["Alternative Name"] =
              section.name || section.alternativeName;
          if (section.networkOperator)
            flatData["Network Operator"] = section.networkOperator;
          if (section.networkRegion)
            flatData["Network Region"] = section.networkRegion;
          if (section.numberType) flatData["Number Type"] = section.numberType;
          break;

        case "Digital":
          if (section.digitalAge) flatData["Digital Age"] = section.digitalAge;
          if (section.nameAtBank) flatData["Name at Bank"] = section.nameAtBank;
          if (section.upiIds && section.upiIds.length > 0)
            flatData["UPI IDs"] = section.upiIds.join(", ");
          break;

        case "Employment":
          if (section.uanNumber) flatData["UAN Number"] = section.uanNumber;
          // Employment history is complex, we'll summarize
          if (
            section.employmentHistory &&
            section.employmentHistory.length > 0
          ) {
            flatData["Number of Jobs"] = section.employmentHistory.length;
            section.employmentHistory.forEach((job: any, index: number) => {
              flatData[`Company ${index + 1}`] =
                job.companyName || job.establishment_name;
              if (job.dateOfJoining || job.date_of_joining)
                flatData[`Joined ${index + 1}`] =
                  job.dateOfJoining || job.date_of_joining;
              if (job.dateOfExit || job.date_of_exit)
                flatData[`Exit ${index + 1}`] =
                  job.dateOfExit || job.date_of_exit;
            });
          }
          break;

        case "Business":
          if (section.msmeStatus !== undefined)
            flatData["MSME Status"] = section.msmeStatus;
          // PAN details
          if (section.panDetails) {
            if (section.panDetails.full_name)
              flatData["PAN Full Name"] = section.panDetails.full_name;
            if (section.panDetails.category)
              flatData["PAN Category"] = section.panDetails.category;
            if (section.panDetails.gender)
              flatData["PAN Gender"] = section.panDetails.gender;
            if (section.panDetails.dob)
              flatData["PAN DOB"] = section.panDetails.dob;
            if (section.panDetails.aadhaar_linked !== undefined)
              flatData["PAN Aadhaar Linked"] = section.panDetails.aadhaar_linked
                ? "Yes"
                : "No";
            if (section.panDetails.status)
              flatData["PAN Status"] = section.panDetails.status;
          }
          break;
      }

      return flatData;
    };

    const sections = [
      { name: "Personal", data: profileData.personalInfo || {} },
      { name: "Contact", data: profileData.contactInfo || {} },
      { name: "Digital", data: profileData.digitalInfo || {} },
      { name: "Employment", data: profileData.employmentInfo || {} },
      { name: "Business", data: profileData.businessInfo || {} },
    ];

    // Create an overview sheet with all data
    const overviewData: Record<string, any> = {};
    sections.forEach((section) => {
      const sectionData = prepareDataForExcel(section.data, section.name);
      Object.assign(overviewData, sectionData);
    });

    // Add overview data to the main sheet
    const mainWorksheet = utils.json_to_sheet([overviewData]);
    utils.book_append_sheet(wb, mainWorksheet, "Profile Summary");

    // Also add individual sheets for each section with detailed data
    sections.forEach((section) => {
      const sectionData = prepareDataForExcel(section.data, section.name);
      if (Object.keys(sectionData).length > 0) {
        const worksheet = utils.json_to_sheet([sectionData]);
        utils.book_append_sheet(wb, worksheet, section.name);
      }
    });

    writeFile(wb, `profile-${name.replace(/\s+/g, "-")}.xlsx`);
  };

  const handleSendEmail = async (email: string) => {
    if (!profileData) return;

    setIsSendingEmail(true);

    try {
      // Prepare names and key details with priority-based lookup
      const fullName =
        profileData.personalInfo?.full_name ||
        profileData.personalInfo?.fullName ||
        profileData.rawProfileData?.personalInfo?.fullName ||
        name;

      const firstName = fullName ? fullName.split(" ")[0] : name;

      const lastName = fullName ? fullName.split(" ").slice(1).join(" ") : "";

      const fatherName =
        profileData.personalInfo?.father_name ||
        profileData.personalInfo?.fatherName ||
        profileData.rawProfileData?.personalInfo?.fatherName;

      const panNumber =
        profileData.personalInfo?.pan_number ||
        profileData.personalInfo?.panNumber ||
        profileData.rawProfileData?.personalInfo?.panNumber ||
        pan;

      const aadhaarNumber =
        profileData.personalInfo?.aadhaar_number ||
        profileData.personalInfo?.aadhaarNumber ||
        profileData.rawProfileData?.personalInfo?.aadhaarNumber ||
        aadhaar;

      const mobileNumber =
        profileData.contactInfo?.mobile_number ||
        profileData.contactInfo?.mobileNumber ||
        profileData.rawProfileData?.contactInfo?.mobileNumber ||
        mobile;

      const dateOfBirth =
        profileData.personalInfo?.dob ||
        profileData.personalInfo?.dateOfBirth ||
        profileData.rawProfileData?.personalInfo?.dateOfBirth;

      const gender =
        profileData.personalInfo?.gender ||
        profileData.rawProfileData?.personalInfo?.gender;

      // Prepare the email data with comprehensive profile information
      const emailData = {
        name: fullName,
        email,
        profileData: {
          personalInfo: {
            firstName,
            lastName,
            fullName,
            name: fullName,
            gender,
            dateOfBirth,
            father_name: fatherName,
            pan: panNumber,
            aadhaar: aadhaarNumber,
            mobile: mobileNumber,
          },
          contactInfo: {
            mobile: mobileNumber,
            ...(profileData.contactInfo || {}),
            ...(profileData.rawProfileData?.contactInfo || {}),
          },
          digitalInfo: {
            ...(profileData.digitalInfo || {}),
            ...(profileData.rawProfileData?.digitalInfo || {}),
          },
          employmentInfo: {
            ...(profileData.employmentInfo || {}),
            ...(profileData.rawProfileData?.employmentInfo || {}),
          },
          businessInfo: {
            ...(profileData.businessInfo || {}),
            ...(profileData.rawProfileData?.businessInfo || {}),
          },
          rawProfileData: profileData.rawProfileData,
        },
      };

      const response = await fetch("/api/send-profile-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Only close the modal after successful sending
      setIsEmailModalOpen(false);

      setToastMessage({
        message: "Your profile report has been sent to your email",
        type: "success",
      });
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

  // Tabs for the profile display
  const tabSections = [
    { id: "personal", label: "Personal", icon: User },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "digital", label: "Digital", icon: TrendingUp },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "business", label: "Business", icon: Building },
  ];

  return (
    <>
      {/* Toast Notification - keep this here */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
          darkMode={darkMode} // Changed from darkMode to darkMode
        />
      )}

      {/* Email Modal - keep this here */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleSendEmail}
        darkMode={darkMode} // Changed from darkMode to darkMode
        isSending={isSendingEmail} // Make sure this prop is being passed correctly
      />

      <div className="mx-auto lg:p-10 p-3">
        {/* The rest of your content (grid, form, etc.) goes here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Sidebar with Form */}
          <div className="w-full mb-4 lg:mb-0">
            <div
              className={`${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              } shadow-xl rounded-lg p-6 sticky border top-20 transition-colors duration-200`}
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  className={`w-12 h-12 ${
                    darkMode ? "bg-blue-900" : "bg-blue-100"
                  } rounded-full flex items-center justify-center mr-3`}
                >
                  <FileDigit
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
                  Personal Verification - Lite
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className={`space-y-6 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {/* Form Input Fields - Refine styling here */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Full Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User
                        className={`h-4 w-4 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 py-2.5 rounded-md border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                      } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="mobile"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Mobile Number
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone
                        className={`h-4 w-4 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="tel"
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className={`w-full pl-10 py-2.5 rounded-md border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                      } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="aadhaar"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Aadhaar Number
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Fingerprint
                        className={`h-4 w-4 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      id="aadhaar"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      className={`w-full pl-10 py-2.5 rounded-md border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                      } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                      placeholder="12-digit Aadhaar number"
                      pattern="[0-9]{12}"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="pan"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    PAN Number
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileDigit
                        className={`h-4 w-4 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      id="pan"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      className={`w-full pl-10 py-2.5 rounded-md border uppercase ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                      } shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors`}
                      placeholder="PAN Card number"
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      required
                    />
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
            </div>
          </div>

          {/* Main Content Area - Profile Display */}
          <div className="col-span-1 lg:col-span-2 mt-10">
            {profileData ? (
              <div className="space-y-6">
                {/* Tabs for Profile Sections */}
                <div
                  className={`${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  } shadow-md rounded-lgoverflow-hidden mb-6 border transition-colors duration-200`}
                >
                  <div className="overflow-x-auto">
                    <div
                      className={`flex gap-2 flex-wrap ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } border-b`}
                    >
                      {tabSections.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center px-4 py-3 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? darkMode
                                ? "border-b-2 border-blue-500 text-blue-400 bg-gray-700"
                                : "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                              : darkMode
                              ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                              : "text-gray-600 hover:text-blue-500 hover:bg-gray-50"
                          }`}
                          type="button"
                        >
                          <tab.icon className="w-4 h-4 mr-2" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Summary Card */}
                <div
                  className={`${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  } shadow-md rounded-lg overflow-hidden mb-6 border transition-colors duration-200`}
                >
                  <div
                    className={`p-5 ${
                      darkMode
                        ? "bg-gradient-to-r from-blue-900 to-gray-800"
                        : "bg-gradient-to-r from-blue-600 to-blue-800"
                    } text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-12 h-12 ${
                            darkMode ? "bg-gray-700" : "bg-white"
                          } rounded-full flex items-center justify-center mr-4`}
                        >
                          <User
                            className={`h-6 w-6 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            {profileData.personalInfo?.full_name ||
                              profileData.personalInfo?.fullName ||
                              profileData.rawProfileData?.personalInfo
                                ?.fullName ||
                              name}
                          </h2>
                          <p
                            className={`${
                              darkMode ? "text-blue-200" : "text-blue-100"
                            }`}
                          >
                            PAN:{" "}
                            {profileData.personalInfo?.pan_number ||
                              profileData.personalInfo?.panNumber ||
                              pan}
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:flex space-x-3">
                        <button
                          onClick={exportPDF}
                          className={`flex items-center gap-1 px-3 py-1.5 ${
                            darkMode
                              ? "bg-gray-700/50 hover:bg-gray-700/80"
                              : "bg-white/20 hover:bg-white/30"
                          } text-white rounded-md transition-colors text-sm font-medium`}
                          type="button"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={exportExcel}
                          className={`flex items-center gap-1 px-3 py-1.5 ${
                            darkMode
                              ? "bg-gray-700/50 hover:bg-gray-700/80"
                              : "bg-white/20 hover:bg-white/30"
                          } text-white rounded-md transition-colors text-sm font-medium`}
                          type="button"
                        >
                          <Sheet className="w-4 h-4" />
                          Excel
                        </button>
                        <button
                          onClick={() => setIsEmailModalOpen(true)}
                          className={`flex items-center gap-1 px-3 py-1.5 ${
                            darkMode
                              ? "bg-gray-700/50 hover:bg-gray-700/80"
                              : "bg-white/20 hover:bg-white/30"
                          } text-white rounded-md transition-colors text-sm font-medium`}
                          type="button"
                        >
                          <Send className="w-4 h-4" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className={`text-center p-3 ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg`}
                      >
                        <Phone
                          className={`h-5 w-5 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          } mx-auto mb-1`}
                        />
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Mobile
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {profileData.contactInfo?.mobile_number || mobile}
                        </p>
                      </div>

                      <div
                        className={`text-center p-3 ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg`}
                      >
                        <Calendar
                          className={`h-5 w-5 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          } mx-auto mb-1`}
                        />
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          DOB
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {profileData.personalInfo?.dob ||
                            profileData.personalInfo?.dateOfBirth ||
                            "N/A"}
                        </p>
                      </div>
                      <div
                        className={`text-center p-3 ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg`}
                      >
                        <LinkIcon
                          className={`h-5 w-5 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          } mx-auto mb-1`}
                        />
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Aadhaar Linked
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {profileData.personalInfo?.aadhaar_linked ||
                          profileData.personalInfo?.aadhaarLinked
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Export Buttons */}
                  <div className="md:hidden p-4 pt-0 grid grid-cols-3 gap-2">
                    <button
                      onClick={exportPDF}
                      className={`flex flex-col items-center justify-center gap-1 p-2 ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      } rounded-md transition-colors text-xs font-medium`}
                      type="button"
                    >
                      <Download
                        className={`w-5 h-5 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      PDF
                    </button>
                    <button
                      onClick={exportExcel}
                      className={`flex flex-col items-center justify-center gap-1 p-2 ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      } rounded-md transition-colors text-xs font-medium`}
                      type="button"
                    >
                      <Sheet
                        className={`w-5 h-5 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      Excel
                    </button>
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className={`flex flex-col items-center justify-center gap-1 p-2 ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      } rounded-md transition-colors text-xs font-medium`}
                      type="button"
                    >
                      <Send
                        className={`w-5 h-5 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      Email
                    </button>
                  </div>
                </div>

                {/* Active Section Content */}
                {activeTab === "personal" && (
                  <Section
                    title="Personal Information"
                    icon={User}
                    darkMode={darkMode}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoItem
                        label="Full Name"
                        value={
                          profileData.personalInfo?.full_name ||
                          profileData.personalInfo?.fullName ||
                          name
                        }
                        icon={User}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Gender"
                        value={profileData.personalInfo?.gender}
                        icon={User}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Date of Birth"
                        value={
                          profileData.personalInfo?.dob ||
                          profileData.personalInfo?.dateOfBirth
                        }
                        icon={Calendar}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Father's Name"
                        value={
                          profileData.personalInfo?.father_name ||
                          profileData.personalInfo?.fatherName
                        }
                        icon={User}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="PAN Number"
                        value={
                          profileData.personalInfo?.pan_number ||
                          profileData.personalInfo?.panNumber ||
                          pan
                        }
                        icon={FileDigit}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Aadhaar Number"
                        value={
                          profileData.personalInfo?.aadhaar_number ||
                          profileData.personalInfo?.aadhaarNumber
                        }
                        icon={Fingerprint}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Category"
                        value={profileData.personalInfo?.category}
                        icon={BadgeInfo}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Aadhaar Linked"
                        value={
                          profileData.personalInfo?.aadhaar_linked ||
                          profileData.personalInfo?.aadhaarLinked
                        }
                        icon={LinkIcon}
                        darkMode={darkMode}
                      />
                    </div>
                  </Section>
                )}

                {activeTab === "contact" && (
                  <Section
                    title="Contact Information"
                    icon={Phone}
                    darkMode={darkMode}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoItem
                        label="Mobile Number"
                        value={
                          profileData.contactInfo?.mobile_number ||
                          profileData.contactInfo?.mobileNumber
                        }
                        icon={Phone}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Alternative Name"
                        value={
                          profileData.contactInfo?.name ||
                          profileData.contactInfo?.alternativeName
                        }
                        icon={User}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Network Operator"
                        value={profileData.contactInfo?.networkOperator}
                        icon={Phone}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Network Region"
                        value={profileData.contactInfo?.networkRegion}
                        icon={LinkIcon}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Number Type"
                        value={profileData.contactInfo?.numberType}
                        icon={BadgeInfo}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Email"
                        value={profileData.contactInfo?.email}
                        icon={Mail}
                        darkMode={darkMode}
                      />

                      {/* Address Information - Span two columns */}
                      <div className="md:col-span-2">
                        <dt
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          } mb-2 flex items-center`}
                        >
                          <MapPin
                            className={`w-4 h-4 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            } mr-2`}
                          />
                          Address
                        </dt>
                        <dd
                          className={`text-sm ${
                            darkMode ? "text-gray-100" : "text-gray-800"
                          } font-normal ml-6 p-3 ${
                            darkMode ? "bg-gray-700" : "bg-gray-50"
                          } rounded-md`}
                        >
                          {profileData.contactInfo?.address || "Not Available"}
                        </dd>
                      </div>

                      {/* Address Details - If there are individual address components */}
                      {profileData.contactInfo?.addressDetails &&
                        Object.keys(profileData.contactInfo.addressDetails)
                          .length > 0 && (
                          <div className="md:col-span-2 mt-2">
                            <h4
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } mb-3 flex items-center`}
                            >
                              <MapPin
                                className={`w-4 h-4 ${
                                  darkMode ? "text-blue-400" : "text-blue-600"
                                } mr-2`}
                              />
                              Address Details
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3 ml-6">
                              {profileData.contactInfo.addressDetails
                                .line_1 && (
                                <InfoItem
                                  label="Address Line 1"
                                  value={
                                    profileData.contactInfo.addressDetails
                                      .line_1
                                  }
                                  icon={Home}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails
                                .line_2 && (
                                <InfoItem
                                  label="Address Line 2"
                                  value={
                                    profileData.contactInfo.addressDetails
                                      .line_2
                                  }
                                  icon={Home}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails
                                .street_name && (
                                <InfoItem
                                  label="Street"
                                  value={
                                    profileData.contactInfo.addressDetails
                                      .street_name
                                  }
                                  icon={MapPin}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails.city && (
                                <InfoItem
                                  label="City"
                                  value={
                                    profileData.contactInfo.addressDetails.city
                                  }
                                  icon={Building}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails.state && (
                                <InfoItem
                                  label="State"
                                  value={
                                    profileData.contactInfo.addressDetails.state
                                  }
                                  icon={MapPin}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails.zip && (
                                <InfoItem
                                  label="Zip Code"
                                  value={
                                    profileData.contactInfo.addressDetails.zip
                                  }
                                  icon={MapPin}
                                  darkMode={darkMode}
                                />
                              )}
                              {profileData.contactInfo.addressDetails
                                .country && (
                                <InfoItem
                                  label="Country"
                                  value={
                                    profileData.contactInfo.addressDetails
                                      .country
                                  }
                                  icon={Globe}
                                  darkMode={darkMode}
                                />
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </Section>
                )}

                {activeTab === "digital" && (
                  <Section
                    title="Digital Information"
                    icon={TrendingUp}
                    darkMode={darkMode}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoItem
                        label="Digital Age"
                        value={profileData.digitalInfo?.digitalAge}
                        icon={TrendingUp}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Name at Bank"
                        value={profileData.digitalInfo?.nameAtBank}
                        icon={Banknote}
                        darkMode={darkMode}
                      />
                      <div className="md:col-span-2">
                        <dt
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          } mb-2 flex items-center`}
                        >
                          <AtSign
                            className={`w-4 h-4 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            } mr-2`}
                          />
                          UPI IDs
                        </dt>
                        <dd className="space-y-2 ml-6">
                          {profileData.digitalInfo?.upiIds &&
                          profileData.digitalInfo.upiIds.length > 0 ? (
                            profileData.digitalInfo.upiIds.map(
                              (upiId, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center gap-2 text-sm ${
                                    darkMode
                                      ? "text-gray-200 bg-gray-700"
                                      : "text-gray-800 bg-gray-50"
                                  } p-2 rounded-md`}
                                >
                                  {upiId}
                                </div>
                              )
                            )
                          ) : (
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } `}
                            >
                              No UPI IDs found
                            </p>
                          )}
                        </dd>
                      </div>
                    </div>
                  </Section>
                )}

                {activeTab === "employment" && (
                  <Section
                    title="Employment Information"
                    icon={Briefcase}
                    darkMode={darkMode}
                  >
                    <div className="space-y-4">
                      <InfoItem
                        label="UAN Number"
                        value={profileData.employmentInfo?.uanNumber}
                        icon={LinkIcon}
                        darkMode={darkMode}
                      />

                      {profileData.employmentInfo?.employmentHistory &&
                      profileData.employmentInfo.employmentHistory.length >
                        0 ? (
                        <div>
                          <h4
                            className={`text-sm font-semibold ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                            } mb-3 flex items-center`}
                          >
                            <Briefcase
                              className={`w-4 h-4 ${
                                darkMode ? "text-blue-400" : "text-blue-600"
                              } mr-2`}
                            />
                            Employment History
                          </h4>
                          <div className="space-y-4">
                            {profileData.employmentInfo.employmentHistory.map(
                              (job, index) => (
                                <div
                                  key={index}
                                  className={`${
                                    darkMode
                                      ? "bg-gray-700 border-gray-600"
                                      : "bg-gray-50 border-gray-200"
                                  } p-4 rounded-lg border hover:shadow-md transition-shadow`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4
                                      className={`text-sm font-semibold ${
                                        darkMode
                                          ? "text-gray-200"
                                          : "text-gray-800"
                                      } flex items-center gap-2`}
                                    >
                                      <Building
                                        className={`w-4 h-4 ${
                                          darkMode
                                            ? "text-blue-400"
                                            : "text-blue-600"
                                        }`}
                                      />
                                      {job.companyName ||
                                        job.establishment_name ||
                                        "Company Not Specified"}
                                    </h4>
                                    <span
                                      className={`text-xs px-2 py-1 ${
                                        darkMode
                                          ? "bg-blue-900/50 text-blue-200"
                                          : "bg-blue-100 text-blue-700"
                                      } rounded-full`}
                                    >
                                      {job.dateOfExit || job.date_of_exit
                                        ? "Past"
                                        : "Current"}
                                    </span>
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-2">
                                    <InfoItem
                                      label="Member ID"
                                      value={job.memberId}
                                      icon={BadgeInfo}
                                      darkMode={darkMode}
                                    />
                                    <InfoItem
                                      label="Date of Joining"
                                      value={
                                        job.dateOfJoining || job.date_of_joining
                                      }
                                      icon={Calendar}
                                      darkMode={darkMode}
                                    />
                                    <InfoItem
                                      label="Date of Exit"
                                      value={
                                        job.dateOfExit ||
                                        job.date_of_exit ||
                                        "Present"
                                      }
                                      icon={Calendar}
                                      darkMode={darkMode}
                                    />
                                    <InfoItem
                                      label="Last PF Submitted"
                                      value={
                                        job.lastPFSubmitted ||
                                        job.last_pf_submitted
                                      }
                                      icon={Calendar}
                                      darkMode={darkMode}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-4 ${
                            darkMode ? "bg-gray-700" : "bg-gray-50"
                          } rounded-lg text-center`}
                        >
                          <Briefcase
                            className={`h-8 w-8 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            } mx-auto mb-2`}
                          />
                          <p
                            className={`${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            } `}
                          >
                            No employment history available
                          </p>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {activeTab === "business" && (
                  <Section
                    title="Business Information"
                    icon={Building}
                    darkMode={darkMode}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoItem
                        label="MSME Status"
                        value={profileData.businessInfo?.msmeStatus}
                        icon={Briefcase}
                        darkMode={darkMode}
                      />

                      {profileData.businessInfo?.panDetails && (
                        <>
                          <InfoItem
                            label="Full Name"
                            value={
                              profileData.businessInfo.panDetails.full_name
                            }
                            icon={User}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Category"
                            value={profileData.businessInfo.panDetails.category}
                            icon={BadgeInfo}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Gender"
                            value={profileData.businessInfo.panDetails.gender}
                            icon={User}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Date of Birth"
                            value={profileData.businessInfo.panDetails.dob}
                            icon={Calendar}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Aadhaar Linked"
                            value={
                              profileData.businessInfo.panDetails.aadhaar_linked
                            }
                            icon={LinkIcon}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Status"
                            value={profileData.businessInfo.panDetails.status}
                            icon={Verified}
                            darkMode={darkMode}
                          />
                        </>
                      )}
                    </div>
                  </Section>
                )}
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
                      <FileDigit
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
                    Personal Verification
                  </h2>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } max-w-md mx-auto mb-4`}
                  >
                    Enter your details on the left to generate a comprehensive
                    digital profile with personal, financial, and employment
                    information.
                  </p>
                  <div className="grid grid-cols-2  gap-6 max-w-md mx-auto pt-4">
                    <div className="text-center">
                      <div
                        className={`w-12 h-12 ${
                          darkMode ? "bg-gray-700" : "bg-blue-100"
                        } rounded-full flex items-center justify-center mx-auto mb-2`}
                      >
                        <User
                          className={`h-6 w-6 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Personal Info
                      </p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`w-12 h-12 ${
                          darkMode ? "bg-gray-700" : "bg-blue-100"
                        } rounded-full flex items-center justify-center mx-auto mb-2`}
                      >
                        <Briefcase
                          className={`h-6 w-6 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Employment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
