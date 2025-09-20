import { useEffect, useState, FC, useRef } from "react";
import {
  Search,
  FileText,
  Brain,
  RefreshCw,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Scale,
  Star,
  TrendingUp,
  TrendingDown,
  Filter,
  Eye,
  Download,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Target,
  Zap,
  Award,
  Info,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
const API_URL = import.meta.env.VITE_API_URL;

// Enhanced Types
interface ProfileData {
  personalInfo?: {
    full_name?: string;
    fullName?: string;
    father_name?: string;
    fatherName?: string;
    dob?: string;
    dateOfBirth?: string;
    pan_number?: string;
    panNumber?: string;
    aadhaar_number?: string;
    aadhaarNumber?: string;
    gender?: string;
  };
  contactInfo?: any;
  digitalInfo?: any;
  employmentInfo?: any;
  businessInfo?: any;
  creditInfo?: any;
  drivingInfo?: any;
  vehicleInfo?: any;
  rawProfileData?: any;
  business_name?: string;
  legal_name?: string;
  addresses?: string[];
}

interface Case {
  id: string;
  petitioners: string[];
  respondents: string[];
  acts?: string[];
  sections?: string;
  filingDate?: string;
  court?: string;
  status?: string;
  address?: string;
  confidence?: number;
  evidence?: string[];
  rejectionReasons?: string[];
  rawScore?: number;
  advancedAnalysis?: boolean;
  aiConfidence?: number;
  aiRationale?: string;
}

interface AdvancedAnalysis {
  matches: Case[];
  rejected: Case[];
  statistics: {
    totalCases: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    averageConfidence: number;
    rejectionReasons: Record<string, number>;
  };
}

interface AIAnalysis {
  matchedCases: Array<{
    caseId: string;
    confidenceScore: number;
    rationale: string;
  }>;
  analysis: string;
  totalMatches: number;
  riskLevel?: string;
  recommendations?: string[];
  error?: string;
}

interface CourtCaseResultProps {
  profileData: ProfileData | null;
}

const CourtCaseResult: FC<CourtCaseResultProps> = ({ profileData }) => {
  const { darkMode } = useTheme();

  // Enhanced state management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allCourtCases, setAllCourtCases] = useState<Case[]>([]);
  const [casesFound, setCasesFound] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [advancedAnalysis, setAdvancedAnalysis] =
    useState<AdvancedAnalysis | null>(null);

  // UI state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"all" | "matches" | "rejected">(
    "all"
  );
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);
  const [resultFilter, setResultFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"confidence" | "date" | "relevance">(
    "confidence"
  );
  const [showEvidence, setShowEvidence] = useState<boolean>(true);

  const ITEMS_PER_PAGE = 10;

  // Enhanced filtering logic
  const getFilteredResults = () => {
    let filtered: Case[] = [];

    // Base filtering by view mode
    if (viewMode === "matches") {
      filtered = advancedAnalysis?.matches || [];
    } else if (viewMode === "rejected") {
      filtered = advancedAnalysis?.rejected || [];
    } else {
      filtered = allCourtCases;
    }

    // Apply confidence filter
    if (confidenceFilter > 0) {
      filtered = filtered.filter(
        (caseItem) => (caseItem.confidence || 0) >= confidenceFilter
      );
    }

    // Apply search filter
    if (resultFilter.trim()) {
      const searchTerm = resultFilter.toLowerCase();
      filtered = filtered.filter(
        (caseItem) =>
          caseItem.id.toLowerCase().includes(searchTerm) ||
          caseItem.petitioners.some((p) =>
            p.toLowerCase().includes(searchTerm)
          ) ||
          caseItem.respondents.some((r) =>
            r.toLowerCase().includes(searchTerm)
          ) ||
          (caseItem.acts &&
            caseItem.acts.some((a) => a.toLowerCase().includes(searchTerm))) ||
          (caseItem.court &&
            caseItem.court.toLowerCase().includes(searchTerm)) ||
          (caseItem.evidence &&
            caseItem.evidence.some((e) => e.toLowerCase().includes(searchTerm)))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "confidence":
          return (b.confidence || 0) - (a.confidence || 0);
        case "date":
          if (!a.filingDate || !b.filingDate) return 0;
          return (
            new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
          );
        case "relevance":
          return (b.rawScore || 0) - (a.rawScore || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredResults = getFilteredResults();
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const displayedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Enhanced search function
  const handleSearch = async () => {
    if (!profileData) {
      setError("No profile data available. Please generate a profile first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAllCourtCases([]);
    setCasesFound(0);
    setHasSearched(true);
    setAiAnalysis(null);
    setAdvancedAnalysis(null);

    try {
      // Extract name from profile
      const name =
        profileData.personalInfo?.full_name ||
        profileData.personalInfo?.fullName ||
        profileData.business_name ||
        profileData.legal_name ||
        profileData.rawProfileData?.personalInfo?.fullName;

      if (!name) {
        throw new Error("No name found in profile data");
      }

      const payload = {
        name,
        profileData,
      };

      console.log("Searching court cases with advanced analysis for:", name);

      const response = await fetch(`${API_URL}/court-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({"profile":payload.profileData}),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch court cases. Status: ${response.status}`
        );
      }

      const data = await response.json();

      // Set all results
      setAllCourtCases(data.cases || []);
      setCasesFound(data.casesFound || 0);
      setAiAnalysis(data.aiAnalysis);
      setAdvancedAnalysis(data.advancedAnalysis);

      console.log("Advanced Analysis Results:", data.advancedAnalysis);
      console.log("AI Analysis Results:", data.aiAnalysis);
    } catch (error) {
      console.error("Error searching court cases:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch court cases"
      );
    } finally {
      setIsLoading(false);
    }
  };

  //handle initial search when profileData changes
  const lastProfile = useRef<string | null>(null);
  useEffect(() => {
    if (profileData) {
      const profileString = JSON.stringify(profileData);
      if (lastProfile.current !== profileString) {
        lastProfile.current = profileString;
        handleSearch();
      }
    }
  }, [profileData]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, confidenceFilter, resultFilter, sortBy]);

  // Enhanced Statistics Panel
  const StatisticsPanel = ({ analysis }: { analysis: AdvancedAnalysis }) => (
    <div
      className={`${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      } shadow-md rounded-lg overflow-hidden border mb-6`}
    >
      <div
        className={`p-4 ${
          darkMode
            ? "bg-gradient-to-r from-blue-900 to-gray-800"
            : "bg-gradient-to-r from-blue-50 to-white"
        } border-b flex items-center justify-between`}
      >
        <div className="flex items-center">
          <BarChart3
            className={`mr-2 h-5 w-5 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <h3
            className={`font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Advanced Analysis Statistics
          </h3>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            darkMode
              ? "bg-blue-900/50 text-blue-300"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {analysis.statistics.averageConfidence}% avg confidence
        </div>
      </div>

      <div className="p-6">
        {/* Main Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } text-center`}
          >
            <div
              className={`text-2xl font-bold ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {analysis.statistics.totalCases}
            </div>
            <div className="text-sm font-medium">Total Cases</div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } text-center`}
          >
            <div className="text-2xl font-bold text-green-600">
              {analysis.statistics.highConfidence}
            </div>
            <div className="text-sm font-medium">High Confidence</div>
            <div className="text-xs text-gray-500">≥80%</div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } text-center`}
          >
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.statistics.mediumConfidence}
            </div>
            <div className="text-sm font-medium">Medium Confidence</div>
            <div className="text-xs text-gray-500">50-79%</div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } text-center`}
          >
            <div className="text-2xl font-bold text-red-600">
              {analysis.statistics.lowConfidence}
            </div>
            <div className="text-sm font-medium">Low Confidence</div>
            <div className="text-xs text-gray-500">&lt;50%</div>
          </div>
        </div>

        {/* Rejection Reasons */}
        {Object.keys(analysis.statistics.rejectionReasons).length > 0 && (
          <div>
            <h4
              className={`font-medium mb-3 ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Common Rejection Reasons:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(analysis.statistics.rejectionReasons)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([reason, count]) => (
                  <div
                    key={reason}
                    className={`flex justify-between items-center p-2 rounded ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm">{reason}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        darkMode
                          ? "bg-red-900/30 text-red-300"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced AI Analysis Panel
  const AIAnalysisPanel = ({ analysis }: { analysis: AIAnalysis }) => (
    <div
      className={`${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      } shadow-md rounded-lg overflow-hidden border mb-6`}
    >
      <div
        className={`p-4 ${
          darkMode
            ? "bg-gradient-to-r from-purple-900 to-gray-800"
            : "bg-gradient-to-r from-purple-50 to-white"
        } border-b flex items-center justify-between`}
      >
        <div className="flex items-center">
          <Brain
            className={`mr-2 h-5 w-5 ${
              darkMode ? "text-purple-400" : "text-purple-600"
            }`}
          />
          <h3
            className={`font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            AI Analysis Results
          </h3>
        </div>
        {analysis.riskLevel && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              analysis.riskLevel === "HIGH"
                ? "bg-red-100 text-red-800"
                : analysis.riskLevel === "MEDIUM"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            Risk: {analysis.riskLevel}
          </div>
        )}
      </div>

      <div className="p-4">
        {analysis.error ? (
          <div
            className={`p-4 ${
              darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
            } rounded-md flex items-center`}
          >
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">AI Analysis Error</p>
              <p className="mt-1 text-sm">{analysis.error}</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`mb-4 p-4 ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              } rounded-md`}
            >
              <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                {analysis.analysis}
              </p>
            </div>

            {analysis.recommendations &&
              analysis.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4
                    className={`font-medium mb-2 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    AI Recommendations:
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <Target
                          className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {rec}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );

  // Enhanced Case Card Component
  const CaseCard = ({ caseData, index }: { caseData: Case; index: number }) => {
    const isHighConfidence = (caseData.confidence || 0) >= 80;
    const isMediumConfidence = (caseData.confidence || 0) >= 50;

    return (
      <div
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border rounded-lg p-4 mb-4 ${
          isHighConfidence
            ? darkMode
              ? "ring-2 ring-green-500/30"
              : "ring-2 ring-green-500/30"
            : isMediumConfidence
            ? darkMode
              ? "ring-1 ring-yellow-500/30"
              : "ring-1 ring-yellow-500/30"
            : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <h4
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {caseData.id}
              </h4>
              {caseData.advancedAnalysis && (
                <Zap
                  className={`w-4 h-4 ml-2 ${
                    darkMode ? "text-yellow-400" : "text-yellow-600"
                  }`}
                  title="Advanced Analysis Applied"
                />
              )}
            </div>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {caseData.court} • {caseData.status} • Filed:{" "}
              {caseData.filingDate || "Unknown"}
            </p>
          </div>

          {/* Confidence Score */}
          {caseData.confidence !== undefined && (
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isHighConfidence
                  ? "bg-green-100 text-green-800"
                  : isMediumConfidence
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {caseData.confidence.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <h5
              className={`text-sm font-medium mb-1 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Petitioners:
            </h5>
            <ul className="text-sm space-y-1">
              {caseData.petitioners.map((petitioner, idx) => (
                <li
                  key={idx}
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } flex items-center`}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0" />
                  {petitioner}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5
              className={`text-sm font-medium mb-1 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Respondents:
            </h5>
            <ul className="text-sm space-y-1">
              {caseData.respondents.map((respondent, idx) => (
                <li
                  key={idx}
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } flex items-center`}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0" />
                  {respondent}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Acts and Sections */}
        {(caseData.acts?.length || caseData.sections) && (
          <div className="mb-3">
            {caseData.acts && caseData.acts.length > 0 && (
              <div className="mb-2">
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Acts:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {caseData.acts.map((act, idx) => (
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
                  ))}
                </div>
              </div>
            )}

            {caseData.sections && (
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
                  {caseData.sections}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Evidence and AI Analysis */}
        {showEvidence &&
          (caseData.evidence?.length || caseData.aiRationale) && (
            <div
              className={`mt-3 p-3 rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              {caseData.evidence && caseData.evidence.length > 0 && (
                <div className="mb-2">
                  <h6
                    className={`text-sm font-medium mb-2 flex items-center ${
                      darkMode ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    <Award className="w-4 h-4 mr-1" />
                    Matching Evidence:
                  </h6>
                  <ul className="space-y-1">
                    {caseData.evidence.map((evidence, idx) => (
                      <li
                        key={idx}
                        className={`text-xs flex items-start ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {caseData.aiRationale && (
                <div>
                  <h6
                    className={`text-sm font-medium mb-1 flex items-center ${
                      darkMode ? "text-purple-300" : "text-purple-700"
                    }`}
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    AI Analysis:
                  </h6>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {caseData.aiRationale}
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Rejection Reasons */}
        {caseData.rejectionReasons && caseData.rejectionReasons.length > 0 && (
          <div
            className={`mt-3 p-3 rounded ${
              darkMode ? "bg-red-900/20" : "bg-red-50"
            }`}
          >
            <h6
              className={`text-sm font-medium mb-2 flex items-center ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rejection Reasons:
            </h6>
            <ul className="space-y-1">
              {caseData.rejectionReasons.map((reason, idx) => (
                <li
                  key={idx}
                  className={`text-xs flex items-start ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  <AlertCircle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      {isLoading && (
        // Loading State
        <div
          className={`flex items-center justify-center p-8 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } shadow-md rounded-lg border mb-6`}
        >
          <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
          <span className="ml-4">Searching for court cases...</span>
        </div>
      )}
      {/* Error Display */}
      {error && (
        <div
          className={`p-4 mb-6 rounded-md ${
            darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
          } flex items-center`}
        >
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Panel */}
      {hasSearched && advancedAnalysis && (
        <StatisticsPanel analysis={advancedAnalysis} />
      )}

      {/* AI Analysis Panel */}
      {hasSearched && aiAnalysis && <AIAnalysisPanel analysis={aiAnalysis} />}

      {/* Filters and Controls */}
      {hasSearched && allCourtCases.length > 0 && (
        <div
          className={`${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } shadow-md rounded-lg p-4 mb-6 border`}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Tabs */}
            <div className="flex items-center">
              <span className="text-sm font-medium mr-3">View:</span>
              <div className="flex border rounded-md overflow-hidden">
                {[
                  {
                    key: "all",
                    label: "All Cases",
                    count: allCourtCases.length,
                  },
                  {
                    key: "matches",
                    label: "Matches",
                    count: advancedAnalysis?.matches.length || 0,
                  },
                  {
                    key: "rejected",
                    label: "Rejected",
                    count: advancedAnalysis?.rejected.length || 0,
                  },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as typeof viewMode)}
                    className={`px-3 py-2 text-sm font-medium ${
                      viewMode === key
                        ? darkMode
                          ? "bg-blue-700 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition-colors`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Filter */}
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium mr-2">
                Min Confidence:
              </label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(Number(e.target.value))}
                className={`p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-800"
                }`}
              >
                <option value={0}>All</option>
                <option value={30}>30%+</option>
                <option value={50}>50%+</option>
                <option value={70}>70%+</option>
                <option value={80}>80%+</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium mr-2">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={`p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-800"
                }`}
              >
                <option value="confidence">Confidence</option>
                <option value="date">Filing Date</option>
                <option value="relevance">Relevance Score</option>
              </select>
            </div>

            {/* Search Filter */}
            <div className="flex items-center flex-1 max-w-md">
              <Search className="w-4 h-4 mr-2" />
              <input
                type="text"
                placeholder="Search cases..."
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className={`flex-1 p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Show Evidence Toggle */}
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={`px-3 py-2 text-sm rounded border ${
                showEvidence
                  ? darkMode
                    ? "bg-blue-700 text-white border-blue-600"
                    : "bg-blue-600 text-white border-blue-500"
                  : darkMode
                  ? "bg-gray-700 text-gray-300 border-gray-600"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Evidence
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {displayedResults.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)}{" "}
              of {filteredResults.length} results
            </div>
          </div>

          {/* Case Cards */}
          <div className="space-y-4 mb-6">
            {displayedResults.map((caseData, index) => (
              <CaseCard
                key={`${caseData.id}-${index}`}
                caseData={caseData}
                index={index}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex justify-center items-center space-x-2 py-4`}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md border ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "hover:bg-gray-700 border-gray-600"
                    : "hover:bg-gray-100 border-gray-300"
                } ${darkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span
                className={`px-4 py-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md border ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "hover:bg-gray-700 border-gray-600"
                    : "hover:bg-gray-100 border-gray-300"
                } ${darkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* No Results State */}
      {hasSearched && allCourtCases.length === 0 && !isLoading && !error && (
        <div
          className={`text-center p-8 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } shadow-md rounded-lg border`}
        >
          <Scale
            className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? "text-gray-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-lg font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            No Court Cases Found
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            No court cases were found matching this profile. This is generally
            good news!
          </p>
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div
          className={`text-center p-8 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } shadow-md rounded-lg border`}
        >
          <FileText
            className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? "text-gray-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-lg font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Advanced Court Case Analysis
          </h3>
          <p
            className={`${
              darkMode ? "text-gray-400" : "text-gray-500"
            } max-w-md mx-auto`}
          >
            Click "Analyze Cases" to search for court cases using advanced AI
            matching algorithms with confidence scoring and evidence analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourtCaseResult;
