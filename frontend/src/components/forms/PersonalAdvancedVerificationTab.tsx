import { useState, FormEvent, useEffect, useRef, ReactNode } from "react";
import { jsPDF } from "jspdf";
import { utils, writeFile } from "xlsx";
import {
  User,
  Phone,
  Fingerprint,
  FileDigit,
  BadgeInfo,
  CircleDollarSign,
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
  Download,
  Sheet,
  Send,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  Settings,
  Car,
  BadgeCheck,
  Home,
  MapPin,
  Droplet,
  Weight,
  Wind,
  Shield,
  FileText,
  Tag,
  Box,
  Receipt,
  Palette,
  Users,
  PcCase,
  RefreshCw,
  Globe,
  Scale,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { API_URL } from "config";

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
  creditInfo?: {
    creditScore?: string | number;
    panKRAStatus?: boolean;
    panKRAAgency?: string;
    creditReport?: {
      RetailAccountsSummary?: {
        NoOfAccounts?: number;
        NoOfActiveAccounts?: number;
        TotalBalanceAmount?: number;
        TotalCreditLimit?: number;
        RecentAccount?: string;
        OldestAccount?: string;
      };
      RetailAccountDetails?: Array<{
        Institution?: string;
        AccountType?: string;
        Balance?: number | string;
        CreditLimit?: number | string;
        AccountStatus?: string;
      }>;
    };
  };
  drivingInfo?: {
    error_message: ReactNode;
    status: string;
    id_number?: string;
    name?: string;
    relatives_name?: string;
    dob?: string;
    address?: string;
    issuing_rto_name?: string;
    date_of_issue?: string;
    nt_validity_from?: string;
    nt_validity_to?: string;
    cov_details?: Array<{
      cov?: string;
      issue_date?: string;
      category?: string;
    }>;
  };
  vehicleInfo?: {
    status: string;
    error_message: ReactNode;
    rc_number?: string;
    registration_date?: string;
    owner_name?: string;
    father_name?: string;
    present_address?: string;
    permanent_address?: string;
    vehicle_category?: string;
    vehicle_chasi_number?: string;
    vehicle_engine_number?: string;
    maker_description?: string;
    maker_model?: string;
    body_type?: string;
    fuel_type?: string;
    color?: string;
    norms_type?: string;
    fit_up_to?: string;
    financer?: string;
    financed?: boolean;
    insurance_company?: string;
    insurance_policy_number?: string;
    insurance_upto?: string;
    manufacturing_date?: string;
    registered_at?: string;
    cubic_capacity?: string;
    vehicle_gross_weight?: string;
    seat_capacity?: string;
    unladen_weight?: string;
    vehicle_category_description?: string;
    pucc_number?: string;
    pucc_upto?: string;
    tax_upto?: string;
    tax_paid_upto?: string;
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

const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon: Icon,
  darkMode,
}) => {
  // Helper function to format value
  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === "") return "Not Available";
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

  const CourtCaseTab = ({ profileData }: { profileData: ProfileData }) => {
    const { darkMode } = useTheme();

    // Use court case data from profileData (already fetched during profile generation)
    const courtCaseResults = profileData?.courtCases;
    const hasSearched = !!courtCaseResults;

    // No data yet
    if (!hasSearched || !courtCaseResults) {
      return (
        <div
          className={`text-center p-8 ${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg`}
        >
          <FileText
            className={`h-12 w-12 mx-auto mb-4 ${
              darkMode ? "text-gray-600" : "text-gray-400"
            }`}
          />
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Court case data will be available after generating profile
          </p>
        </div>
      );
    }

    // No cases found
    if (courtCaseResults.casesFound === 0) {
      return (
        <div
          className={`text-center p-8 ${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg border-2 border-dashed ${
            darkMode ? "border-green-500/30" : "border-green-500/30"
          }`}
        >
          <CheckCircle
            className={`h-12 w-12 mx-auto mb-4 ${
              darkMode ? "text-green-400" : "text-green-500"
            }`}
          />
          <h3
            className={`text-lg font-medium mb-2 ${
              darkMode ? "text-green-300" : "text-green-700"
            }`}
          >
            Clean Legal Record
          </h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            No court cases found for this profile. This is generally good news!
          </p>
          <div
            className={`mt-4 p-3 ${
              darkMode ? "bg-green-900/20" : "bg-green-50"
            } rounded-lg`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-green-300" : "text-green-700"
              }`}
            >
              ✓ No pending cases • ✓ No historical cases • ✓ Clean background
            </p>
          </div>
        </div>
      );
    }

    // Statistics summary
    const stats = courtCaseResults.advancedAnalysis?.statistics;
    const highConfidenceCount = stats?.highConfidence || 0;
    const totalCases = courtCaseResults.casesFound || 0;

    return (
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div
          className={`p-4 ${
            darkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-blue-50 border-blue-200"
          } rounded-lg border`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`font-medium ${
                darkMode ? "text-white" : "text-blue-800"
              }`}
            >
              Court Case Analysis Summary
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                highConfidenceCount > 0
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {highConfidenceCount > 0 ? "Attention Required" : "Low Risk"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {totalCases}
              </div>
              <div className="text-xs text-gray-500">Total Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {highConfidenceCount}
              </div>
              <div className="text-xs text-gray-500">High Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.mediumConfidence || 0}
              </div>
              <div className="text-xs text-gray-500">Medium Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats?.lowConfidence || 0}
              </div>
              <div className="text-xs text-gray-500">Low Match</div>
            </div>
          </div>

          {stats?.averageConfidence && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Confidence:</span>
                <span
                  className={`font-bold ${
                    stats.averageConfidence >= 70
                      ? "text-red-600"
                      : stats.averageConfidence >= 50
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {stats.averageConfidence.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* High Confidence Cases (Top 5) */}
        {courtCaseResults.cases && courtCaseResults.cases.length > 0 && (
          <div>
            <h4
              className={`font-medium mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              } flex items-center`}
            >
              <Scale className="h-5 w-5 mr-2" />
              Court Cases Found ({Math.min(
                5,
                courtCaseResults.cases.length
              )} of {totalCases} shown)
            </h4>

            <div className="space-y-4">
              {courtCaseResults.cases
                .slice(0, 5)
                .map((courtCase: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-200"
                    } rounded-lg border ${
                      (courtCase.confidence || 0) >= 70
                        ? "ring-2 ring-red-500/30"
                        : (courtCase.confidence || 0) >= 50
                        ? "ring-1 ring-yellow-500/30"
                        : ""
                    }`}
                  >
                    {/* Case Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5
                          className={`font-medium ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {courtCase.id}
                        </h5>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {courtCase.court || "Court not specified"} •{" "}
                          {courtCase.status || "Status unknown"} • Filed:{" "}
                          {courtCase.filingDate || "Date unknown"}
                        </p>
                      </div>

                      {courtCase.confidence !== undefined && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            courtCase.confidence >= 70
                              ? "bg-red-100 text-red-800"
                              : courtCase.confidence >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {courtCase.confidence.toFixed(1)}% match
                        </span>
                      )}
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h6
                          className={`text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Petitioners:
                        </h6>
                        <ul className="text-sm space-y-1">
                          {(courtCase.petitioners || []).map(
                            (petitioner: string, idx: number) => (
                              <li
                                key={idx}
                                className={`${
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                } flex items-center`}
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0" />
                                {petitioner}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div>
                        <h6
                          className={`text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Respondents:
                        </h6>
                        <ul className="text-sm space-y-1">
                          {(courtCase.respondents || []).map(
                            (respondent: string, idx: number) => (
                              <li
                                key={idx}
                                className={`${
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                } flex items-center`}
                              >
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0" />
                                {respondent}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Acts and Sections */}
                    {(courtCase.acts?.length || courtCase.sections) && (
                      <div className="mb-3">
                        {courtCase.acts && courtCase.acts.length > 0 && (
                          <div className="mb-2">
                            <span
                              className={`text-sm font-medium ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Acts:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {courtCase.acts.map(
                                (act: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      darkMode
                                        ? "bg-blue-900/30 text-blue-300"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {act}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {courtCase.sections && (
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Sections:
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ml-2 ${
                                darkMode
                                  ? "bg-amber-900/30 text-amber-300"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {courtCase.sections}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidence */}
                    {courtCase.evidence && courtCase.evidence.length > 0 && (
                      <div
                        className={`mt-3 p-3 rounded ${
                          darkMode ? "bg-gray-600" : "bg-gray-50"
                        }`}
                      >
                        <h6
                          className={`text-sm font-medium mb-2 flex items-center ${
                            darkMode ? "text-green-300" : "text-green-700"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Matching Evidence:
                        </h6>
                        <ul className="space-y-1">
                          {courtCase.evidence.map(
                            (evidence: string, idx: number) => (
                              <li
                                key={idx}
                                className={`text-xs flex items-start ${
                                  darkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                <div className="w-1 h-1 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0" />
                                {evidence}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Show more link if there are more cases */}
            {totalCases > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    // You can implement a modal or expand functionality here
                    console.log("Show all cases:", courtCaseResults.cases);
                  }}
                  className={`px-4 py-2 text-sm rounded-md ${
                    darkMode
                      ? "bg-blue-700 hover:bg-blue-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } transition-colors`}
                >
                  View All {totalCases} Cases
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div className="text-center pt-4 border-t border-gray-300">
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Court case data was automatically fetched during profile generation
          </p>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileData(null);
    setToastMessage(null);

    try {
      // 1. Fetch main profile data
      const response = await fetch(`${API_URL}/verification-advanced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile_number: mobile,
          aadhaar_number: aadhaar,
          pan_number: pan,
          dl_number: dl,
          rc_number: rc,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate profile");
      let profileData = await response.json();

      // 2. Add form inputs
      profileData.formInputs = {
        name,
        mobile,
        aadhaar,
        pan,
        dl,
        rc,
      };

      // 3. Fetch court cases
      try {
        console.log("Fetching court cases during profile generation...");
        const courtResponse = await fetch(`${API_URL}/court-cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, profileData }),
        });

        if (courtResponse.ok) {
          const courtData = await courtResponse.json();
          profileData.courtCases = courtData;
          console.log("Court cases fetched and stored:", courtData);
        } else {
          console.warn(
            "Court case fetch failed, continuing without court data"
          );
          profileData.courtCases = { cases: [], casesFound: 0 };
        }
      } catch (courtError) {
        console.error("Court case fetch error:", courtError);
        profileData.courtCases = { cases: [], casesFound: 0 };
      }

      // 4. Set profile data
      setProfileData(profileData);

      // 5. AUTO-GENERATE PDF AND EMAIL WITH ATTACHMENT
      const userEmail = localStorage.getItem("userEmail");
      const userUsername = localStorage.getItem("userUsername");

      if (userEmail) {
        try {
          console.log(
            "🚀 Auto-generating PDF and sending email with attachment..."
          );

          // Generate PDF first
          const pdfResponse = await fetch(`${API_URL}/generate-puppeteer-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileData: profileData,
              courtCaseData: profileData.courtCases,
            }),
          });

          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();

            // Convert PDF to base64
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const base64String = btoa(
              new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );

            const fullName =
              profileData.personalInfo?.full_name ||
              profileData.personalInfo?.fullName ||
              name;

            // Send email WITH PDF attachment
            const emailResponse = await fetch(`${API_URL}/send-profile-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": userEmail,
                "x-user-username": userUsername || "User",
              },
              body: JSON.stringify({
                name: fullName,
                profileData: profileData,
                pdfAttachment: {
                  content: base64String,
                  filename: `argus-verification-report-${fullName.replace(
                    /\s+/g,
                    "-"
                  )}.pdf`,
                  contentType: "application/pdf",
                },
              }),
            });

            if (emailResponse.ok) {
              const emailResult = await emailResponse.json();
              console.log("✅ Profile generated and PDF emailed:", emailResult);

              setToastMessage({
                message: `Profile generated and PDF report emailed to ${userEmail}!`,
                type: "success",
              });
            } else {
              setToastMessage({
                message:
                  "Profile generated successfully! (Email sending failed)",
                type: "success",
              });
            }
          } else {
            // PDF generation failed, send summary email only
            const emailResponse = await fetch(`${API_URL}/send-profile-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": userEmail,
                "x-user-username": userUsername || "User",
              },
              body: JSON.stringify({
                name,
                profileData: profileData,
                // No PDF attachment
              }),
            });

            if (emailResponse.ok) {
              setToastMessage({
                message:
                  "Profile generated and summary emailed (PDF generation failed)",
                type: "success",
              });
            } else {
              setToastMessage({
                message: "Profile generated successfully!",
                type: "success",
              });
            }
          }
        } catch (emailError) {
          console.error("❌ Auto-email/PDF error:", emailError);
          setToastMessage({
            message: "Profile generated successfully! (Email/PDF failed)",
            type: "success",
          });
        }
      } else {
        setToastMessage({
          message: "Profile generated successfully! (No email configured)",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Profile generation error:", error);
      setToastMessage({ message: "Failed to generate profile", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!profileData) {
      setToastMessage({
        message: "No profile data available for PDF export.",
        type: "error",
      });
      return null;
    }

    try {
      setIsLoading(true);

      console.log("Generating PDF with existing court case data...");

      // Generate PDF
      const response = await fetch(`${API_URL}/generate-puppeteer-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileData: profileData,
          courtCaseData: profileData.courtCases,
        }),
      });

      if (!response.ok) {
        throw new Error("PDF generation failed");
      }

      const pdfBlob = await response.blob();
      const fullName =
        profileData.personalInfo?.full_name ||
        profileData.personalInfo?.fullName ||
        name;

      // Get user email and send PDF
      const userEmail = localStorage.getItem("userEmail");
      const userUsername = localStorage.getItem("userUsername");

      if (userEmail) {
        try {
          console.log("📧 Converting PDF to base64 and sending email...");

          // Convert blob to base64 for email attachment
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const base64String = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          console.log("PDF converted to base64, size:", base64String.length);

          // Send email with PDF attachment
          const emailResponse = await fetch(`${API_URL}/send-profile-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-email": userEmail,
              "x-user-username": userUsername || "User",
            },
            body: JSON.stringify({
              name: fullName,
              profileData: profileData,
              pdfAttachment: {
                content: base64String,
                filename: `argus-verification-report-${fullName.replace(
                  /\s+/g,
                  "-"
                )}.pdf`,
                contentType: "application/pdf",
              },
            }),
          });

          if (emailResponse.ok) {
            const emailResult = await emailResponse.json();
            console.log("✅ PDF emailed successfully:", emailResult);

            setToastMessage({
              message: `PDF report emailed to ${userEmail} successfully!`,
              type: "success",
            });
          } else {
            const errorResult = await emailResponse.json();
            console.error("❌ Email sending failed:", errorResult);
            throw new Error("Email sending failed");
          }
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          setToastMessage({
            message: "PDF generated but email sending failed.",
            type: "error",
          });
        }
      }

      // Also provide download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `argus-verification-report-${fullName.replace(
        /\s+/g,
        "-"
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return pdfBlob;
    } catch (error) {
      console.error("Error in PDF export:", error);
      setToastMessage({
        message: "PDF export failed. Please try again.",
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
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

        case "Credit":
          if (section.creditScore)
            flatData["Credit Score"] = section.creditScore;
          if (section.panKRAStatus !== undefined)
            flatData["PAN KRA Status"] = section.panKRAStatus
              ? "Verified"
              : "Not Verified";
          if (section.panKRAAgency)
            flatData["KRA Agency"] = section.panKRAAgency;

          // Credit summary
          if (section.creditReport?.RetailAccountsSummary) {
            const summary = section.creditReport.RetailAccountsSummary;
            if (summary.NoOfAccounts !== undefined)
              flatData["Total Accounts"] = summary.NoOfAccounts;
            if (summary.NoOfActiveAccounts !== undefined)
              flatData["Active Accounts"] = summary.NoOfActiveAccounts;
            if (summary.TotalBalanceAmount !== undefined)
              flatData["Total Balance"] = summary.TotalBalanceAmount;
            if (summary.TotalCreditLimit !== undefined)
              flatData["Total Credit Limit"] = summary.TotalCreditLimit;
            if (summary.RecentAccount)
              flatData["Recent Account"] = summary.RecentAccount;
            if (summary.OldestAccount)
              flatData["Oldest Account"] = summary.OldestAccount;
          }
          break;

        case "DrivingLicense":
          if (section.id_number) flatData["License Number"] = section.id_number;
          if (section.name) flatData["Name"] = section.name;
          if (section.relatives_name)
            flatData["Father's Name"] = section.relatives_name;
          if (section.dob) flatData["Date of Birth"] = section.dob;
          if (section.address) flatData["Address"] = section.address;
          if (section.issuing_rto_name)
            flatData["Issuing RTO"] = section.issuing_rto_name;
          if (section.date_of_issue)
            flatData["Issue Date"] = section.date_of_issue;
          if (section.nt_validity_from)
            flatData["Valid From"] = section.nt_validity_from;
          if (section.nt_validity_to)
            flatData["Valid Till"] = section.nt_validity_to;

          // Handle vehicle categories
          if (section.cov_details && section.cov_details.length > 0) {
            flatData["Number of Categories"] = section.cov_details.length;
            section.cov_details.forEach((cov: any, index: number) => {
              flatData[`Category ${index + 1}`] = cov.cov;
              flatData[`Category ${index + 1} Issue Date`] = cov.issue_date;
            });
          }
          break;

        case "Vehicle":
          if (section.rc_number)
            flatData["Registration Number"] = section.rc_number;
          if (section.owner_name) flatData["Owner Name"] = section.owner_name;
          if (section.registration_date)
            flatData["Registration Date"] = section.registration_date;
          if (section.maker_description)
            flatData["Manufacturer"] = section.maker_description;
          if (section.maker_model) flatData["Model"] = section.maker_model;
          if (section.fuel_type) flatData["Fuel Type"] = section.fuel_type;
          if (section.color) flatData["Color"] = section.color;
          if (section.manufacturing_date)
            flatData["Manufacturing Date"] = section.manufacturing_date;

          // Technical details
          if (section.vehicle_engine_number)
            flatData["Engine Number"] = section.vehicle_engine_number;
          if (section.vehicle_chasi_number)
            flatData["Chassis Number"] = section.vehicle_chasi_number;
          if (section.body_type) flatData["Body Type"] = section.body_type;
          if (section.vehicle_category_description)
            flatData["Vehicle Category"] = section.vehicle_category_description;
          if (section.cubic_capacity)
            flatData["Cubic Capacity"] = section.cubic_capacity;
          if (section.seat_capacity)
            flatData["Seat Capacity"] = section.seat_capacity;
          if (section.unladen_weight)
            flatData["Weight (kg)"] = section.unladen_weight;
          if (section.norms_type)
            flatData["Emission Norms"] = section.norms_type;

          // Finance & Insurance
          if (section.financed !== undefined)
            flatData["Financed"] = section.financed ? "Yes" : "No";
          if (section.financer) flatData["Financer"] = section.financer;
          if (section.insurance_company)
            flatData["Insurance Company"] = section.insurance_company;
          if (section.insurance_policy_number)
            flatData["Insurance Policy"] = section.insurance_policy_number;
          if (section.insurance_upto)
            flatData["Insurance Valid Till"] = section.insurance_upto;
          if (section.tax_paid_upto)
            flatData["Tax Paid Upto"] = section.tax_paid_upto;
          if (section.fit_up_to) flatData["Fit Upto"] = section.fit_up_to;
          if (section.pucc_number)
            flatData["PUCC Number"] = section.pucc_number;
          if (section.pucc_upto)
            flatData["PUCC Valid Till"] = section.pucc_upto;

          // Address information
          if (section.present_address)
            flatData["Present Address"] = section.present_address;
          if (section.permanent_address)
            flatData["Permanent Address"] = section.permanent_address;
          if (section.registered_at)
            flatData["Registered At"] = section.registered_at;
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
      { name: "Credit", data: profileData.creditInfo || {} },
      { name: "DrivingLicense", data: profileData.drivingInfo || {} },
      { name: "Vehicle", data: profileData.vehicleInfo || {} },
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

    // Special handling for account details if available
    if (
      profileData.creditInfo?.creditReport?.RetailAccountDetails &&
      profileData.creditInfo.creditReport.RetailAccountDetails.length > 0
    ) {
      const accounts = profileData.creditInfo.creditReport.RetailAccountDetails;

      // Format the accounts data for Excel
      const accountsData = accounts.map((account) => ({
        Institution: account.Institution || "N/A",
        "Account Type": account.AccountType || "N/A",
        Balance: account.Balance ? `₹${account.Balance}` : "₹0",
        "Credit Limit": account.CreditLimit ? `₹${account.CreditLimit}` : "N/A",
        Status: account.AccountStatus || "N/A",
      }));

      const accountsWorksheet = utils.json_to_sheet(accountsData);
      utils.book_append_sheet(wb, accountsWorksheet, "Credit Accounts");
    }

    // Special handling for vehicle categories if available
    if (
      profileData.drivingInfo?.cov_details &&
      profileData.drivingInfo.cov_details.length > 0
    ) {
      const categories = profileData.drivingInfo.cov_details;

      // Format the categories data for Excel
      const categoriesData = categories.map((category, index) => ({
        Category: category.cov || "N/A",
        "Issue Date": category.issue_date || "N/A",
        "Category Type": category.category || "N/A",
      }));

      const categoriesWorksheet = utils.json_to_sheet(categoriesData);
      utils.book_append_sheet(wb, categoriesWorksheet, "License Categories");
    }

    writeFile(wb, `profile-${name.replace(/\s+/g, "-")}.xlsx`);
  };

  // Tabs for the profile display
  const tabSections = [
    { id: "personal", label: "Personal", icon: User },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "digital", label: "Digital", icon: TrendingUp },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "business", label: "Business", icon: Building },
    { id: "credit", label: "Credit", icon: CircleDollarSign },
    { id: "license", label: "License", icon: BadgeInfo }, // New tab for driving license
    { id: "vehicle", label: "Vehicle", icon: Car }, // New tab for RC details
    { id: "court", label: "Court Cases", icon: FileText }, // New tab for court cases
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
                  Personal Verification
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
                          {profileData.contactInfo?.mobile_number ||
                            profileData.contactInfo?.mobileNumber ||
                            mobile}
                        </p>
                      </div>
                      <div
                        className={`text-center p-3 ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          } mx-auto mb-1`}
                        />
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Credit Score
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {profileData.creditInfo?.creditScore || "N/A"}
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
                          pan // Fallback to form input
                        }
                        icon={FileDigit}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="Aadhaar Number"
                        value={
                          profileData.personalInfo?.aadhaar_number ||
                          profileData.personalInfo?.aadhaarNumber ||
                          aadhaar // Use the form input as fallback
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

                {activeTab === "credit" && (
                  <Section
                    title="Credit Information"
                    icon={CircleDollarSign}
                    darkMode={darkMode}
                  >
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <InfoItem
                        label="Credit Score"
                        value={profileData.creditInfo?.creditScore}
                        icon={CreditCard}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="PAN KRA Status"
                        value={
                          profileData.creditInfo?.panKRAStatus
                            ? "Verified"
                            : "Not Verified"
                        }
                        icon={ShieldCheck}
                        darkMode={darkMode}
                      />
                      <InfoItem
                        label="KRA Agency"
                        value={profileData.creditInfo?.panKRAAgency}
                        icon={BadgeInfo}
                        darkMode={darkMode}
                      />
                    </div>

                    {/* Credit Report Summary */}
                    {profileData.creditInfo?.creditReport
                      ?.RetailAccountsSummary && (
                      <div
                        className={`${
                          darkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                        } p-4 rounded-lg border mb-4 hover:shadow-md transition-shadow`}
                      >
                        <h4
                          className={`text-sm font-semibold ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          } mb-3 flex items-center`}
                        >
                          <TrendingUp
                            className={`w-4 h-4 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            } mr-2`}
                          />
                          Credit Profile Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Total Accounts
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.NoOfAccounts
                              }
                            </dd>
                          </div>
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Active Accounts
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.NoOfActiveAccounts
                              }
                            </dd>
                          </div>
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Total Balance
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              ₹
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.TotalBalanceAmount
                              }
                            </dd>
                          </div>
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Total Credit Limit
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              ₹
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.TotalCreditLimit
                              }
                            </dd>
                          </div>
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Recent Account
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.RecentAccount
                              }
                            </dd>
                          </div>
                          <div
                            className={`p-3 ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-100"
                            } rounded-md border`}
                          >
                            <dt
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Oldest Account
                            </dt>
                            <dd
                              className={`text-lg font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {
                                profileData.creditInfo.creditReport
                                  .RetailAccountsSummary.OldestAccount
                              }
                            </dd>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed Credit Accounts */}
                    {profileData.creditInfo?.creditReport
                      ?.RetailAccountDetails && (
                      <div
                        className={`${
                          darkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        } rounded-lg border overflow-hidden`}
                      >
                        <div
                          className={`p-4 border-b ${
                            darkMode
                              ? "border-gray-700 bg-gray-700"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <h4
                            className={`text-sm font-semibold ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                            } flex items-center`}
                          >
                            <CreditCard
                              className={`w-4 h-4 ${
                                darkMode ? "text-blue-400" : "text-blue-600"
                              } mr-2`}
                            />
                            Detailed Credit Accounts
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr
                                className={
                                  darkMode ? "bg-gray-700" : "bg-blue-50"
                                }
                              >
                                <th
                                  className={`p-3 border-b ${
                                    darkMode
                                      ? "border-gray-600 text-gray-300"
                                      : "border-gray-200 text-gray-700"
                                  } text-left text-xs font-medium`}
                                >
                                  Institution
                                </th>
                                <th
                                  className={`p-3 border-b ${
                                    darkMode
                                      ? "border-gray-600 text-gray-300"
                                      : "border-gray-200 text-gray-700"
                                  } text-left text-xs font-medium`}
                                >
                                  Account Type
                                </th>
                                <th
                                  className={`p-3 border-b ${
                                    darkMode
                                      ? "border-gray-600 text-gray-300"
                                      : "border-gray-200 text-gray-700"
                                  } text-left text-xs font-medium`}
                                >
                                  Balance
                                </th>
                                <th
                                  className={`p-3 border-b ${
                                    darkMode
                                      ? "border-gray-600 text-gray-300"
                                      : "border-gray-200 text-gray-700"
                                  } text-left text-xs font-medium`}
                                >
                                  Credit Limit
                                </th>
                                <th
                                  className={`p-3 border-b ${
                                    darkMode
                                      ? "border-gray-600 text-gray-300"
                                      : "border-gray-200 text-gray-700"
                                  } text-left text-xs font-medium`}
                                >
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {profileData.creditInfo.creditReport.RetailAccountDetails.map(
                                (account, index) => (
                                  <tr
                                    key={index}
                                    className={
                                      darkMode
                                        ? "hover:bg-gray-700"
                                        : "hover:bg-gray-50"
                                    }
                                  >
                                    <td
                                      className={`p-3 border-b ${
                                        darkMode
                                          ? "border-gray-600 text-gray-300"
                                          : "border-gray-200 text-gray-700"
                                      } text-sm`}
                                    >
                                      {account.Institution}
                                    </td>
                                    <td
                                      className={`p-3 border-b ${
                                        darkMode
                                          ? "border-gray-600 text-gray-300"
                                          : "border-gray-200 text-gray-700"
                                      } text-sm`}
                                    >
                                      {account.AccountType}
                                    </td>
                                    <td
                                      className={`p-3 border-b ${
                                        darkMode
                                          ? "border-gray-600 text-gray-300"
                                          : "border-gray-200 text-gray-700"
                                      } text-sm`}
                                    >
                                      ₹{account.Balance || "0"}
                                    </td>
                                    <td
                                      className={`p-3 border-b ${
                                        darkMode
                                          ? "border-gray-600 text-gray-300"
                                          : "border-gray-200 text-gray-700"
                                      } text-sm`}
                                    >
                                      ₹{account.CreditLimit || "N/A"}
                                    </td>
                                    <td
                                      className={`p-3 border-b ${
                                        darkMode
                                          ? "border-gray-600"
                                          : "border-gray-200"
                                      } text-sm`}
                                    >
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                          account.AccountStatus === "Active"
                                            ? darkMode
                                              ? "bg-green-900/50 text-green-400"
                                              : "bg-green-100 text-green-800"
                                            : darkMode
                                            ? "bg-gray-600 text-gray-300"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {account.AccountStatus}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {/* Driving License Tab */}
                {activeTab === "license" && (
                  <Section
                    title="Driving License Information"
                    icon={BadgeInfo}
                    darkMode={darkMode}
                  >
                    {profileData.drivingInfo ? (
                      profileData.drivingInfo.status === "error" ? (
                        // Error state display
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div
                            className={`p-3 rounded-full ${
                              darkMode ? "bg-red-900/30" : "bg-red-50"
                            } mb-4`}
                          >
                            <AlertTriangle
                              className={`h-8 w-8 ${
                                darkMode ? "text-red-500" : "text-red-500"
                              }`}
                            />
                          </div>
                          <h3
                            className={`text-lg font-medium mb-2 ${
                              darkMode ? "text-white" : "text-gray-800"
                            }`}
                          >
                            Verification Failed
                          </h3>
                          <p
                            className={`${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            } max-w-md mb-4`}
                          >
                            {profileData.drivingInfo.error_message}
                          </p>
                          <div className="flex items-center">
                            <BadgeInfo
                              className={`h-5 w-5 mr-2 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            />
                            <span
                              className={`${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              License Number:{" "}
                              {profileData.drivingInfo.id_number}
                            </span>
                          </div>

                          <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className={`px-6 py-3 rounded-md shadow-md font-medium text-white ${
                              darkMode
                                ? "bg-blue-700 hover:bg-blue-600 focus:ring-blue-600"
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6`}
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
                                Fetching License Data...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <BadgeInfo className="h-5 w-5 mr-2" />
                                Retry License Details
                              </span>
                            )}
                          </button>
                        </div>
                      ) : (
                        // Existing driving license details display
                        <div className="grid md:grid-cols-2 gap-4">
                          <InfoItem
                            label="License Number"
                            value={profileData.drivingInfo.id_number}
                            icon={BadgeInfo}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Name"
                            value={profileData.drivingInfo.name}
                            icon={User}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Father's Name"
                            value={profileData.drivingInfo.relatives_name}
                            icon={User}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Date of Birth"
                            value={profileData.drivingInfo.dob}
                            icon={Calendar}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Address"
                            value={profileData.drivingInfo.address}
                            icon={Home}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Issuing RTO"
                            value={profileData.drivingInfo.issuing_rto_name}
                            icon={Building}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Issue Date"
                            value={profileData.drivingInfo.date_of_issue}
                            icon={Calendar}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Valid From"
                            value={profileData.drivingInfo.nt_validity_from}
                            icon={Calendar}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Valid Till"
                            value={profileData.drivingInfo.nt_validity_to}
                            icon={Calendar}
                            darkMode={darkMode}
                          />

                          {/* Vehicle categories */}
                          <div className="md:col-span-2">
                            <h4
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } mb-3 flex items-center`}
                            >
                              <Car
                                className={`w-4 h-4 ${
                                  darkMode ? "text-blue-400" : "text-blue-600"
                                } mr-2`}
                              />
                              Vehicle Categories
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {profileData.drivingInfo.cov_details &&
                                profileData.drivingInfo.cov_details.map(
                                  (cov, index) => (
                                    <div
                                      key={index}
                                      className={`p-3 ${
                                        darkMode ? "bg-gray-700" : "bg-gray-50"
                                      } rounded-lg border ${
                                        darkMode
                                          ? "border-gray-600"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span
                                          className={`text-sm font-medium ${
                                            darkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          {cov.cov}
                                        </span>
                                        <span
                                          className={`text-xs ${
                                            darkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          Issued: {cov.issue_date}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-6 py-10">
                        <div
                          className={`p-8 rounded-full ${
                            darkMode ? "bg-gray-700" : "bg-blue-50"
                          }`}
                        >
                          <BadgeInfo
                            className={`h-10 w-10 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          />
                        </div>

                        {dl ? (
                          // Show simplified message and button when DL is already provided in profile form
                          <div className="text-center space-y-6">
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } max-w-md`}
                            >
                              Click the button below to fetch driving license
                              details for {dl}.
                            </p>

                            <button
                              onClick={handleSubmit}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-md shadow-md font-medium text-white ${
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
                                  Fetching License Data...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <BadgeInfo className="h-5 w-5 mr-2" />
                                  Fetch License Details
                                </span>
                              )}
                            </button>
                          </div>
                        ) : (
                          // Show message directing user to enter DL in profile form
                          <div className="text-center capitalize">
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } max-w-md`}
                            >
                              Enter a driving license number in the profile form
                              to view license details.
                            </p>
                            <div className="mt-4">
                              <button
                                onClick={() => setActiveTab("personal")}
                                className={`px-4 py-2 rounded-md text-sm ${
                                  darkMode
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                }`}
                              >
                                Go to Profile Form
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Section>
                )}

                {activeTab === "vehicle" && (
                  <Section
                    title="Vehicle Information"
                    icon={Car}
                    darkMode={darkMode}
                  >
                    {profileData.vehicleInfo ? (
                      profileData.vehicleInfo.status === "error" ? (
                        // Error state display
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div
                            className={`p-3 rounded-full ${
                              darkMode ? "bg-red-900/30" : "bg-red-50"
                            } mb-4`}
                          >
                            <AlertTriangle
                              className={`h-8 w-8 ${
                                darkMode ? "text-red-500" : "text-red-500"
                              }`}
                            />
                          </div>
                          <h3
                            className={`text-lg font-medium mb-2 ${
                              darkMode ? "text-white" : "text-gray-800"
                            }`}
                          >
                            Verification Failed
                          </h3>
                          <p
                            className={`${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            } max-w-md mb-4`}
                          >
                            {profileData.vehicleInfo.error_message}
                          </p>
                          <div className="flex items-center">
                            <Car
                              className={`h-5 w-5 mr-2 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            />
                            <span
                              className={`${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              RC Number: {profileData.vehicleInfo.rc_number}
                            </span>
                          </div>

                          <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className={`px-6 py-3 rounded-md shadow-md font-medium text-white ${
                              darkMode
                                ? "bg-blue-700 hover:bg-blue-600 focus:ring-blue-600"
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6`}
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
                                Fetching Vehicle Data...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Car className="h-5 w-5 mr-2" />
                                Retry Vehicle Details
                              </span>
                            )}
                          </button>
                        </div>
                      ) : (
                        // Existing vehicle details display
                        <div className="space-y-6">
                          {/* Vehicle Summary */}
                          <div
                            className={`${
                              darkMode
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-50 border-gray-200"
                            } p-4 rounded-lg border hover:shadow-md transition-shadow`}
                          >
                            <h4
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } mb-3 flex items-center`}
                            >
                              <Car
                                className={`w-4 h-4 ${
                                  darkMode ? "text-blue-400" : "text-blue-600"
                                } mr-2`}
                              />
                              Vehicle Summary
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <InfoItem
                                label="Registration Number"
                                value={profileData.vehicleInfo.rc_number}
                                icon={BadgeInfo}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Owner Name"
                                value={profileData.vehicleInfo.owner_name}
                                icon={User}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Registration Date"
                                value={
                                  profileData.vehicleInfo.registration_date
                                }
                                icon={Calendar}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Manufacturer"
                                value={
                                  profileData.vehicleInfo.maker_description
                                }
                                icon={Building}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Model"
                                value={profileData.vehicleInfo.maker_model}
                                icon={Car}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Fuel Type"
                                value={profileData.vehicleInfo.fuel_type}
                                icon={Droplet}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Color"
                                value={profileData.vehicleInfo.color}
                                icon={Palette}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Manufacturing Date"
                                value={
                                  profileData.vehicleInfo.manufacturing_date
                                }
                                icon={Calendar}
                                darkMode={darkMode}
                              />
                            </div>
                          </div>

                          {/* Technical Details */}
                          <div
                            className={`${
                              darkMode
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-50 border-gray-200"
                            } p-4 rounded-lg border hover:shadow-md transition-shadow`}
                          >
                            <h4
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } mb-3 flex items-center`}
                            >
                              <Settings
                                className={`w-4 h-4 ${
                                  darkMode ? "text-blue-400" : "text-blue-600"
                                } mr-2`}
                              />
                              Technical Details
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <InfoItem
                                label="Engine Number"
                                value={
                                  profileData.vehicleInfo.vehicle_engine_number
                                }
                                icon={PcCase}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Chassis Number"
                                value={
                                  profileData.vehicleInfo.vehicle_chasi_number
                                }
                                icon={PcCase}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Body Type"
                                value={profileData.vehicleInfo.body_type}
                                icon={Car}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Vehicle Category"
                                value={
                                  profileData.vehicleInfo
                                    .vehicle_category_description
                                }
                                icon={Tag}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Cubic Capacity"
                                value={profileData.vehicleInfo.cubic_capacity}
                                icon={Box}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Seat Capacity"
                                value={profileData.vehicleInfo.seat_capacity}
                                icon={Users}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Weight"
                                value={`${profileData.vehicleInfo.unladen_weight} kg`}
                                icon={Weight}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Emission Norms"
                                value={profileData.vehicleInfo.norms_type}
                                icon={Wind}
                                darkMode={darkMode}
                              />
                            </div>
                          </div>

                          {/* Finance & Insurance */}
                          <div
                            className={`${
                              darkMode
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-50 border-gray-200"
                            } p-4 rounded-lg border hover:shadow-md transition-shadow`}
                          >
                            <h4
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } mb-3 flex items-center`}
                            >
                              <CircleDollarSign
                                className={`w-4 h-4 ${
                                  darkMode ? "text-blue-400" : "text-blue-600"
                                } mr-2`}
                              />
                              Finance & Insurance
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <InfoItem
                                label="Financed"
                                value={profileData.vehicleInfo.financed}
                                icon={CircleDollarSign}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Financer"
                                value={profileData.vehicleInfo.financer}
                                icon={Building}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Insurance Company"
                                value={
                                  profileData.vehicleInfo.insurance_company
                                }
                                icon={Shield}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Insurance Policy"
                                value={
                                  profileData.vehicleInfo
                                    .insurance_policy_number
                                }
                                icon={FileText}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Insurance Valid Till"
                                value={profileData.vehicleInfo.insurance_upto}
                                icon={Calendar}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Tax Paid Upto"
                                value={profileData.vehicleInfo.tax_paid_upto}
                                icon={Receipt}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="Fit Upto"
                                value={profileData.vehicleInfo.fit_up_to}
                                icon={Calendar}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="PUCC Number"
                                value={profileData.vehicleInfo.pucc_number}
                                icon={BadgeCheck}
                                darkMode={darkMode}
                              />
                              <InfoItem
                                label="PUCC Valid Till"
                                value={profileData.vehicleInfo.pucc_upto}
                                icon={Calendar}
                                darkMode={darkMode}
                              />
                            </div>
                          </div>

                          {/* Address Information */}
                          <div
                            className={`${
                              darkMode
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-50 border-gray-200"
                            } p-4 rounded-lg border hover:shadow-md transition-shadow`}
                          >
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
                              Address Information
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <dt
                                  className={`text-sm font-medium ${
                                    darkMode ? "text-gray-300" : "text-gray-600"
                                  }`}
                                >
                                  Present Address
                                </dt>
                                <dd
                                  className={`text-sm ${
                                    darkMode ? "text-gray-100" : "text-gray-800"
                                  } font-normal mt-1`}
                                >
                                  {profileData.vehicleInfo.present_address}
                                </dd>
                              </div>
                              <div>
                                <dt
                                  className={`text-sm font-medium ${
                                    darkMode ? "text-gray-300" : "text-gray-600"
                                  }`}
                                >
                                  Permanent Address
                                </dt>
                                <dd
                                  className={`text-sm ${
                                    darkMode ? "text-gray-100" : "text-gray-800"
                                  } font-normal mt-1`}
                                >
                                  {profileData.vehicleInfo.permanent_address}
                                </dd>
                              </div>
                              <InfoItem
                                label="Registered At"
                                value={profileData.vehicleInfo.registered_at}
                                icon={Building}
                                darkMode={darkMode}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-6 py-10">
                        <div
                          className={`p-8 rounded-full ${
                            darkMode ? "bg-gray-700" : "bg-blue-50"
                          }`}
                        >
                          <Car
                            className={`h-10 w-10 ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          />
                        </div>

                        {rc ? (
                          // Show simplified message and button when RC is already provided in profile form
                          <div className="text-center space-y-6">
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } max-w-md`}
                            >
                              Click the button below to fetch vehicle details
                              for {rc}.
                            </p>

                            <button
                              onClick={handleSubmit}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-md shadow-md font-medium text-white ${
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
                                  Fetching Vehicle Data...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <Car className="h-5 w-5 mr-2" />
                                  Fetch Vehicle Details
                                </span>
                              )}
                            </button>
                          </div>
                        ) : (
                          // Show message directing user to enter RC in profile form
                          <div className="text-center capitalize">
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } max-w-md`}
                            >
                              Enter a registration certificate (RC) number in
                              the profile form to view vehicle details.
                            </p>
                            <div className="mt-4">
                              <button
                                onClick={() => setActiveTab("personal")}
                                className={`px-4 py-2 rounded-md text-sm ${
                                  darkMode
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                }`}
                              >
                                Go to Profile Form
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Section>
                )}
                {activeTab === "court" && (
                  <Section
                    title="Court Case Search"
                    icon={FileText}
                    darkMode={darkMode}
                  >
                    <CourtCaseTab profileData={profileData} />
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
                  <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-4">
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
                    <div className="text-center">
                      <div
                        className={`w-12 h-12 ${
                          darkMode ? "bg-gray-700" : "bg-blue-100"
                        } rounded-full flex items-center justify-center mx-auto mb-2`}
                      >
                        <CreditCard
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
                        Credit History
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
