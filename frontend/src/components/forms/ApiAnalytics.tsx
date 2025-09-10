import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  ChevronDown,
  Search,
  Download,
  ArrowDown,
  ArrowUp,
  Copy,
  Loader,
  RefreshCw,
  X,
  FileText,
  User,
  PieChart as PieChartIcon,
  Zap,
  DollarSign,
  TrendingUp,
  ListChecks,
  CreditCard,
  UserCheck,
  Server,
  Cpu,
  IndianRupee,
} from "lucide-react";
import {
  format,
  parseISO,
  subDays,
  eachDayOfInterval,
  isValid,
} from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

// Define types for analytics data
interface AnalyticsData {
  overview: {
    totalCalls: number;
    totalCost: number;
    avgResponseTime: number;
  };
  dailyUsage: {
    _id: string; // Date in YYYY-MM-DD format
    calls: number;
    cost: number;
  }[];
  serviceBreakdown: {
    _id: string; // Service name
    calls: number;
    cost: number;
  }[];
  userUsage: {
    _id: {
      userId: string;
      username: string;
    };
    calls: number;
    cost: number;
  }[];
  profileTypeCounts: {
    _id: string; // Profile type (mini, lite, advanced, business)
    count: number;
    cost: number;
  }[];
  topEndpoints: {
    _id: string; // Endpoint path
    calls: number;
    cost: number;
    avgResponseTime: number;
  }[];
  timeRange: {
    startDate: string;
    endDate: string;
  };
}

// Type for API usage logs
interface ApiLog {
  timestamp: string;
  userId: string;
  username: string;
  endpoint: string;
  service: string;
  statusCode: number;
  cost: number;
  responseTime: number;
  profileType: string | null;
}

const ApiAnalytics = () => {
  // Theme and authentication context
  const { darkMode } = useTheme();
  const { user } = useAuth();

  // State variables
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Define color constants based on dark mode
  const COLORS = useMemo(
    () => ({
      success: darkMode ? "#4CAF50" : "#4CAF50",
      failure: darkMode ? "#F44336" : "#F44336",
      primary: darkMode ? "#9575CD" : "#2563EB",
      secondary: darkMode ? "#29B6F6" : "#03A9F4",
      background: darkMode ? "#1E1E1E" : "#F5F5F5",
      cardBg: darkMode ? "#2D2D2D" : "#FFFFFF",
      text: darkMode ? "#FFFFFF" : "#333333",
      border: darkMode ? "#3D3D3D" : "#E0E0E0",
      cardHeaderBg: darkMode ? "#383838" : "#F9F9F9",
      // Additional colors for pie charts
      profileColors: [
        "#FF6384", // Mini
        "#36A2EB", // Lite
        "#FFCE56", // Advanced
        "#4BC0C0", // Business
      ],
      serviceColors: [
        "#8884d8", // Service 1
        "#82ca9d", // Service 2
        "#ffc658", // Service 3
        "#ff8042", // Service 4
        "#a4de6c", // Service 5
        "#d0ed57", // Service 6
        "#83a6ed", // Service 7
        "#8dd1e1", // Service 8
      ],
    }),
    [darkMode]
  );

  // Date range options
  const dateRangeOptions = [
    { label: "Today", days: 1 },
    { label: "Yesterday", days: 1, offset: 1 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "This Month", custom: true },
    { label: "Last Month", custom: true },
    { label: "Custom Range", custom: true },
  ];

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedService, selectedUser]);

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsFetchingData(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("startDate", dateRange.startDate.toISOString());
      params.append("endDate", dateRange.endDate.toISOString());

      if (selectedService) params.append("service", selectedService);
      if (selectedUser) params.append("userId", selectedUser);

      // Fetch analytics data
      const analyticsResponse = await fetch(
        `/api/analytics?${params.toString()}`
      );

      if (!analyticsResponse.ok) {
        throw new Error(
          `Failed to fetch analytics: ${analyticsResponse.status}`
        );
      }

      const analyticsResult = await analyticsResponse.json();
      setAnalyticsData(analyticsResult);

      // Fetch logs in a separate call
      const logsResponse = await fetch(
        `/api/analytics/logs?${params.toString()}`
      );

      if (logsResponse.ok) {
        const logsResult = await logsResponse.json();
        setApiLogs(logsResult.logs);
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load analytics data. Please try again."
      );
    } finally {
      setIsLoading(false);
      setIsFetchingData(false);
    }
  };

  // Handle date range selection
  const handleDateRangeSelect = (option: {
    label: string;
    days?: number;
    offset?: number;
    custom?: boolean;
  }) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    if (option.label === "Today") {
      // Start and end are already set correctly
    } else if (option.label === "Yesterday") {
      start = subDays(start, 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      start = end;
    } else if (option.label === "Last 7 Days") {
      start = subDays(today, 6);
      start.setHours(0, 0, 0, 0);
    } else if (option.label === "Last 30 Days") {
      start = subDays(today, 29);
      start.setHours(0, 0, 0, 0);
    } else if (option.label === "This Month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (option.label === "Last Month") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      today.setDate(0); // Last day of previous month
    } else if (option.label === "Custom Range") {
      // Don't change dates, just enable custom date picker
      setIsCustomDateRange(true);
      setShowDateDropdown(false);
      return;
    }

    setDateRange({ startDate: start, endDate: today });
    setIsCustomDateRange(false);
    setShowDateDropdown(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  // Handle date input change
  const handleDateChange = (isStart: boolean, date: string) => {
    try {
      const parsed = new Date(date);
      if (isValid(parsed)) {
        setDateRange((prev) => ({
          startDate: isStart ? parsed : prev.startDate,
          endDate: isStart ? prev.endDate : parsed,
        }));
      }
    } catch (error) {
      console.error("Invalid date:", error);
    }
  };

  // Handle export of analytics data
  const handleExport = async () => {
    if (isExporting || !analyticsData) return;

    setIsExporting(true);
    setSuccessMessage("Preparing export of analytics data...");

    try {
      // Prepare CSV content
      const csvHeader = [
        "Date",
        "API Calls",
        "Total Cost",
        "Profile Type",
        "Service",
        "Endpoint",
        "Avg. Response Time",
      ];

      // Daily usage data
      const dailyRows = analyticsData.dailyUsage.map((day) => [
        day._id,
        day.calls,
        `₹${day.cost.toFixed(2)}`,
        "",
        "",
        "",
        "",
      ]);

      // Profile type data
      const profileRows = analyticsData.profileTypeCounts.map((profile) => [
        "",
        profile.count,
        `₹${profile.cost.toFixed(2)}`,
        profile._id || "Unknown",
        "",
        "",
        "",
      ]);

      // Service breakdown data
      const serviceRows = analyticsData.serviceBreakdown.map((service) => [
        "",
        service.calls,
        `₹${service.cost.toFixed(2)}`,
        "",
        service._id || "Unknown",
        "",
        "",
      ]);

      // Endpoint data
      const endpointRows = analyticsData.topEndpoints.map((endpoint) => [
        "",
        endpoint.calls,
        `₹${endpoint.cost.toFixed(2)}`,
        "",
        "",
        endpoint._id || "Unknown",
        `${endpoint.avgResponseTime.toFixed(0)}ms`,
      ]);

      // Combine all data
      const csvData = [
        ["API Analytics Report", "", "", "", "", "", ""],
        [`Generated: ${new Date().toLocaleString()}`, "", "", "", "", "", ""],
        [
          `Time Range: ${format(
            new Date(analyticsData.timeRange.startDate),
            "PPP"
          )} to ${format(new Date(analyticsData.timeRange.endDate), "PPP")}`,
          "",
          "",
          "",
          "",
          "",
          "",
        ],
        ["", "", "", "", "", "", ""],
        ["Overview", "", "", "", "", "", ""],
        [
          "Total API Calls",
          `${analyticsData.overview.totalCalls}`,
          "",
          "",
          "",
          "",
          "",
        ],
        [
          "Total Cost",
          `₹${analyticsData.overview.totalCost.toFixed(2)}`,
          "",
          "",
          "",
          "",
          "",
        ],
        [
          "Avg Response Time",
          `${analyticsData.overview.avgResponseTime.toFixed(0)}ms`,
          "",
          "",
          "",
          "",
          "",
        ],
        ["", "", "", "", "", "", ""],
        csvHeader,
        ...dailyRows,
        ["", "", "", "", "", "", ""],
        ["Profile Type Breakdown", "", "", "", "", "", ""],
        csvHeader,
        ...profileRows,
        ["", "", "", "", "", "", ""],
        ["Service Breakdown", "", "", "", "", "", ""],
        csvHeader,
        ...serviceRows,
        ["", "", "", "", "", "", ""],
        ["Top Endpoints", "", "", "", "", "", ""],
        csvHeader,
        ...endpointRows,
      ];

      // Convert to CSV string
      const csvContent = csvData.map((row) => row.join(",")).join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `api-analytics-${format(
        new Date(),
        "yyyy-MM-dd-HH-mm"
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage("Analytics data exported successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setSuccessMessage("Export failed. Please try again.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return darkMode
        ? "bg-green-800 text-green-100"
        : "bg-green-100 text-green-800";
    } else if (status >= 400 && status < 500) {
      return darkMode
        ? "bg-yellow-800 text-yellow-100"
        : "bg-yellow-100 text-yellow-800";
    } else if (status >= 500) {
      return darkMode ? "bg-red-800 text-red-100" : "bg-red-100 text-red-800";
    }
    return darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-100 text-gray-800";
  };

  // Calculate and memoize processed data for charts
  const processedData = useMemo(() => {
    if (!analyticsData) return null;

    // Process daily usage data to ensure all days have entries
    const dailyUsageMap = new Map<string, { calls: number; cost: number }>();

    // First, put existing data in map
    analyticsData.dailyUsage.forEach((day) => {
      dailyUsageMap.set(day._id, { calls: day.calls, cost: day.cost });
    });

    // Fill in missing days within the range
    if (dateRange.startDate && dateRange.endDate) {
      const allDays = eachDayOfInterval({
        start: dateRange.startDate,
        end: dateRange.endDate,
      });

      allDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        if (!dailyUsageMap.has(dateStr)) {
          dailyUsageMap.set(dateStr, { calls: 0, cost: 0 });
        }
      });
    }

    // Convert to sorted array
    const dailyUsageProcessed = Array.from(dailyUsageMap.entries())
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        cost: data.cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process profile type data
    const profileTypeData = analyticsData.profileTypeCounts.map((profile) => ({
      name:
        profile._id === "mini"
          ? "Mini Verification"
          : profile._id === "lite"
          ? "Lite Verification"
          : profile._id === "advanced"
          ? "Advanced Verification"
          : profile._id === "business"
          ? "Business Verification"
          : "Unknown",
      value: profile.count,
      cost: profile.cost,
    }));

    // Process service breakdown data
    const serviceData = analyticsData.serviceBreakdown.map(
      (service, index) => ({
        name: service._id || "Unknown",
        calls: service.calls,
        cost: service.cost,
        color: COLORS.serviceColors[index % COLORS.serviceColors.length],
      })
    );

    // Process top endpoints data
    const endpointData = analyticsData.topEndpoints.map((endpoint) => {
      // Extract the main part of the endpoint for cleaner display
      const endpointPath = endpoint._id.split("?")[0]; // Remove query params
      const pathParts = endpointPath.split("/");
      const displayName = pathParts.slice(-2).join("/"); // Get last two segments

      return {
        name: displayName,
        fullPath: endpoint._id,
        calls: endpoint.calls,
        cost: endpoint.cost,
        responseTime: endpoint.avgResponseTime,
      };
    });

    // Process user usage data
    const userData = analyticsData.userUsage.map((user) => ({
      name: user._id.username,
      userId: user._id.userId,
      calls: user.calls,
      cost: user.cost,
    }));

    return {
      dailyUsage: dailyUsageProcessed,
      profileTypes: profileTypeData,
      services: serviceData,
      endpoints: endpointData,
      users: userData,
    };
  }, [analyticsData, dateRange, COLORS.serviceColors]);

  // Filter API logs based on search query
  const filteredLogs = useMemo(() => {
    if (!apiLogs) return [];

    return apiLogs.filter((log) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        (log.username && log.username.toLowerCase().includes(query)) ||
        (log.endpoint && log.endpoint.toLowerCase().includes(query)) ||
        (log.service && log.service.toLowerCase().includes(query)) ||
        (log.profileType && log.profileType.toLowerCase().includes(query))
      );
    });
  }, [apiLogs, searchQuery]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <main
        className={`mx-auto py-6 px-4 sm:px-6 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        }`}
      >
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">API Analytics Dashboard</h1>
            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Monitor API usage, costs, and performance metrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isLoading || !analyticsData || isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isLoading || !analyticsData || isExporting
                  ? darkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : darkMode
                  ? "bg-blue-700 hover:bg-blue-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white shadow-sm`}
            >
              {isExporting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Export Report</span>
                </>
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isFetchingData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              } transition-colors shadow-sm`}
            >
              <RefreshCw
                size={16}
                className={isFetchingData ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "border bg-white hover:bg-gray-50"
              } shadow-sm`}
            >
              <Calendar size={16} />
              <span>
                {isCustomDateRange
                  ? "Custom Range"
                  : `${format(dateRange.startDate, "MMM dd")} - ${format(
                      dateRange.endDate,
                      "MMM dd"
                    )}`}
              </span>
              <ChevronDown size={16} />
            </button>

            {showDateDropdown && (
              <div
                className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg z-10 overflow-hidden ${
                  darkMode ? "bg-gray-800" : "border bg-white"
                }`}
              >
                <div className="p-2">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleDateRangeSelect(option)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        (option.label === "Custom Range" &&
                          isCustomDateRange) ||
                        (option.label === "Last 30 Days" &&
                          !isCustomDateRange &&
                          Math.round(
                            (dateRange.endDate.getTime() -
                              dateRange.startDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) === 29)
                          ? darkMode
                            ? "bg-blue-900 text-blue-100"
                            : "bg-blue-100 text-blue-900"
                          : ""
                      } hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      {option.label}
                    </button>
                  ))}

                  {isCustomDateRange && (
                    <div className="mt-2 p-2 space-y-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label
                          className={`block text-sm mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={format(dateRange.startDate, "yyyy-MM-dd")}
                          onChange={(e) =>
                            handleDateChange(true, e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-lg ${
                            darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-gray-50 text-gray-900"
                          } border ${
                            darkMode ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          End Date
                        </label>
                        <input
                          type="date"
                          value={format(dateRange.endDate, "yyyy-MM-dd")}
                          onChange={(e) =>
                            handleDateChange(false, e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-lg ${
                            darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-gray-50 text-gray-900"
                          } border ${
                            darkMode ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowDateDropdown(false)}
                          className={`px-3 py-1 text-sm rounded ${
                            darkMode
                              ? "bg-blue-700 hover:bg-blue-600 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Service filter - only if analytics data is loaded */}
          {analyticsData?.serviceBreakdown &&
            analyticsData.serviceBreakdown.length > 0 && (
              <div className="relative inline-block">
                <select
                  value={selectedService || ""}
                  onChange={(e) => setSelectedService(e.target.value || null)}
                  className={`appearance-none pl-3 focus:outline-none pr-8 py-2 rounded-lg ${
                    darkMode
                      ? "bg-gray-800 text-white border-gray-700"
                      : "bg-white text-gray-800 border-gray-300"
                  } border shadow-sm`}
                >
                  <option value="">All Services</option>
                  {analyticsData.serviceBreakdown.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service._id}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <ChevronDown size={16} />
                </div>
              </div>
            )}

          {/* User filter - only if analytics data is loaded and has multiple users */}
          {analyticsData?.userUsage && analyticsData.userUsage.length > 0 && (
            <div className="relative inline-block">
              <select
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                className={`appearance-none pl-3 focus:outline-none pr-8 py-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-800 text-white border-gray-700"
                    : "bg-white text-gray-800 border-gray-300"
                } border shadow-sm`}
              >
                <option value="">All Users</option>
                {analyticsData.userUsage.map((userData) => (
                  <option key={userData._id.userId} value={userData._id.userId}>
                    {userData._id.username}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDown size={16} />
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isFetchingData && (
            <div
              className={`flex items-center gap-2 text-sm ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              <Loader size={16} className="animate-spin" />
              <span>Fetching data...</span>
            </div>
          )}
        </div>

        {/* Success/Error message */}
        {successMessage && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center justify-between ${
              successMessage.includes("failed")
                ? darkMode
                  ? "bg-red-900/50 text-white"
                  : "bg-red-100 text-red-800"
                : darkMode
                ? "bg-green-900/50 text-white"
                : "bg-green-100 text-green-800"
            }`}
          >
            <p>{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 rounded-full hover:bg-gray-200/20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center justify-between ${
              darkMode ? "bg-red-900/50 text-white" : "bg-red-100 text-red-800"
            }`}
          >
            <div className="flex items-center">
              <XCircle size={20} className="mr-2" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`text-sm px-3 py-1 rounded ${
                  darkMode
                    ? "bg-red-800 hover:bg-red-700"
                    : "bg-red-200 hover:bg-red-300"
                }`}
              >
                Try Again
              </button>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded-full hover:bg-red-200/20"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg shadow-md ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } animate-pulse`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div
                        className={`h-4 w-28 ${
                          darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded`}
                      ></div>
                      <div
                        className={`h-8 w-20 mt-4 ${
                          darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded`}
                      ></div>
                    </div>
                    <div
                      className={`h-9 w-9 ${
                        darkMode ? "bg-gray-700" : "bg-gray-200"
                      } rounded-lg`}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          // Key Metrics Cards - Only displayed when we have data
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total API Calls */}
            <div
              className={`p-4 rounded-lg shadow-md  ${
                darkMode ? "bg-gray-800" : "bg-white border"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p
                    className={`text-xs uppercase font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Total API Calls
                  </p>
                  <h3 className="text-2xl font-bold mt-4">
                    {analyticsData?.overview.totalCalls.toLocaleString() || 0}
                  </h3>
                </div>
                <div
                  className={`p-2 rounded-lg h-10 w-10 flex items-center justify-center ${
                    darkMode ? "bg-indigo-900/30" : "bg-indigo-100"
                  }`}
                >
                  <Zap
                    size={20}
                    className={darkMode ? "text-indigo-400" : "text-indigo-600"}
                  />
                </div>
              </div>
            </div>

            {/* Total Cost */}
            <div
              className={`p-4 rounded-lg shadow-md ${
                darkMode ? "bg-gray-800" : "bg-white border"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p
                    className={`text-xs uppercase font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Total Cost
                  </p>
                  <h3 className="text-2xl font-bold mt-4">
                    ₹{analyticsData?.overview.totalCost.toFixed(2) || "0.00"}
                  </h3>
                </div>
                <div
                  className={`p-2 rounded-lg h-10 w-10 flex items-center justify-center ${
                    darkMode ? "bg-green-900/30" : "bg-green-100"
                  }`}
                >
                  <IndianRupee
                    size={20}
                    className={darkMode ? "text-green-400" : "text-green-600"}
                  />
                </div>
              </div>
            </div>

            {/* Avg Response Time */}
            <div
              className={`p-4 rounded-lg shadow-md ${
                darkMode ? "bg-gray-800" : "bg-white border"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p
                    className={`text-xs uppercase font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Avg Response Time
                  </p>
                  <h3 className="text-2xl font-bold mt-4">
                    {analyticsData?.overview.avgResponseTime
                      ? `${analyticsData.overview.avgResponseTime.toFixed(
                          0
                        )} ms`
                      : "N/A"}
                  </h3>
                </div>
                <div
                  className={`p-2 rounded-lg h-10 w-10 flex items-center justify-center ${
                    darkMode ? "bg-yellow-900/30" : "bg-yellow-100"
                  }`}
                >
                  <Clock
                    size={20}
                    className={darkMode ? "text-yellow-400" : "text-yellow-600"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {!isLoading && processedData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Usage Chart */}
            <div
              className={`rounded-lg shadow-md overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`p-4 border-b  ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                } ${
                  darkMode ? "bg-gray-750" : "bg-gray-50"
                } flex justify-between items-center`}
              >
                <h2 className="font-semibold">Daily API Usage</h2>
                <TrendingUp size={18} className="text-blue-500" />
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processedData.dailyUsage}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#444" : "#ddd"}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: darkMode ? "#eee" : "#333" }}
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM dd")
                      }
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: darkMode ? "#eee" : "#333" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: darkMode ? "#eee" : "#333" }}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), "MMMM dd, yyyy")
                      }
                      formatter={(value, name, props) => {
                        if (name === "calls") {
                          return [value, "API Calls"];
                        } else if (name === "cost") {
                          return [`₹${(value as number).toFixed(2)}`, "Cost"];
                        }
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: darkMode ? "#2D2D2D" : "#fff",
                        borderColor: darkMode ? "#444" : "#ddd",
                        color: darkMode ? "#fff" : "#333",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="calls"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="API Calls"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profile Type Distribution */}
            <div
              className={`rounded-lg shadow-md overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`p-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                } ${
                  darkMode ? "bg-gray-750" : "bg-gray-50"
                } flex justify-between items-center`}
              >
                <h2 className="font-semibold">Profile Verification Types</h2>
                <PieChartIcon size={18} className="text-blue-500" />
              </div>
              <div className="p-4 h-80">
                {processedData.profileTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.profileTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                          index,
                          name,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill={darkMode ? "#fff" : "#333"}
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          );
                        }}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {processedData.profileTypes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS.profileColors[
                                index % COLORS.profileColors.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => {
                          return [
                            `${value} verifications | ₹${props.payload.cost.toFixed(
                              2
                            )}`,
                            name,
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: darkMode ? "#2D2D2D" : "#fff",
                          borderColor: darkMode ? "#444" : "#ddd",
                          color: darkMode ? "#fff" : "#333",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No profile verification data available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Usage Breakdown */}
            <div
              className={`rounded-lg shadow-md overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`p-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                } ${
                  darkMode ? "bg-gray-750" : "bg-gray-50"
                } flex justify-between items-center`}
              >
                <h2 className="font-semibold">Service Usage Breakdown</h2>
                <Server size={18} className="text-blue-500" />
              </div>
              <div className="p-4 h-80">
                {processedData.services.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedData.services}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke={darkMode ? "#444" : "#ddd"}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: darkMode ? "#eee" : "#333" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{
                          fontSize: 12,
                          fill: darkMode ? "#eee" : "#333",
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "cost"
                            ? `₹${(value as number).toFixed(2)}`
                            : value,
                          name === "cost" ? "Cost" : "API Calls",
                        ]}
                        contentStyle={{
                          backgroundColor: darkMode ? "#2D2D2D" : "#fff",
                          borderColor: darkMode ? "#444" : "#ddd",
                          color: darkMode ? "#fff" : "#333",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="calls"
                        fill={COLORS.primary}
                        name="API Calls"
                      />
                      <Bar dataKey="cost" fill={COLORS.success} name="Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No service usage data available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Endpoints */}
            <div
              className={`rounded-lg shadow-md overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`p-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                } ${
                  darkMode ? "bg-gray-750" : "bg-gray-50"
                } flex justify-between items-center`}
              >
                <h2 className="font-semibold">Response Time by Endpoint</h2>
                <Cpu size={18} className="text-blue-500" />
              </div>
              <div className="p-4 h-80">
                {processedData.endpoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedData.endpoints.slice(0, 8)} // Limiting to top 8 for readability
                      margin={{ top: 5, right: 30, left: 30, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={darkMode ? "#444" : "#ddd"}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                          fill: darkMode ? "#eee" : "#333",
                        }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fill: darkMode ? "#eee" : "#333" }} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "responseTime" ? `${value} ms` : value,
                          name === "responseTime" ? "Response Time" : name,
                        ]}
                        contentStyle={{
                          backgroundColor: darkMode ? "#2D2D2D" : "#fff",
                          borderColor: darkMode ? "#444" : "#ddd",
                          color: darkMode ? "#fff" : "#333",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="responseTime"
                        fill="#FF8042"
                        name="Response Time (ms)"
                      />
                      <Bar
                        dataKey="calls"
                        fill={COLORS.primary}
                        name="API Calls"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No endpoint response time data available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Transaction Table */}
        <div
          className={`rounded-lg shadow-md overflow-hidden ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className={`p-4 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              darkMode ? "bg-gray-750" : "bg-gray-50"
            }`}
          >
            <h2 className="font-semibold">API Transaction Logs</h2>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div
                className={`relative flex items-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                } rounded-lg px-3 py-1.5`}
              >
                <Search
                  size={16}
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`ml-2 bg-transparent border-none outline-none ${
                    darkMode
                      ? "text-white placeholder-gray-400"
                      : "text-gray-800 placeholder-gray-500"
                  } w-40`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`ml-1 p-1 rounded-full ${
                      darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                    }`}
                  >
                    <X
                      size={14}
                      className={darkMode ? "text-gray-400" : "text-gray-500"}
                    />
                  </button>
                )}
              </div>

              {/* Page size selector */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className={`px-3 py-1.5 rounded-lg focus:outline-none text-sm ${
                  darkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-300"
                } border`}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${
                darkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              <thead className={darkMode ? "bg-gray-750" : "bg-gray-50"}>
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Endpoint
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Cost
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {isLoading ? (
                  // Loading skeleton
                  [...Array(pageSize)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-4 w-24 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-4 w-20 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-4 w-32 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-6 w-16 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded-full`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-4 w-16 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`h-4 w-16 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded`}
                        ></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((log, index) => (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {format(new Date(log.timestamp), "MMM dd, hh:mm a")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div
                            className="max-w-xs truncate"
                            title={log.endpoint}
                          >
                            {log.endpoint.split("/").slice(-2).join("/")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              log.statusCode
                            )}`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatCurrency(log.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.responseTime.toFixed(0)} ms
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm">
                      {searchQuery
                        ? "No transactions found matching your search criteria."
                        : "No transaction data available for the selected period."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Only if we have data and multiple pages */}
          {!isLoading &&
            filteredLogs.length > 0 &&
            Math.ceil(filteredLogs.length / pageSize) > 1 && (
              <div
                className={`px-6 py-3 flex items-center justify-between border-t ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="text-sm">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredLogs.length)} of{" "}
                  {filteredLogs.length} items
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-1 rounded text-sm ${
                      currentPage === 1
                        ? darkMode
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          Math.ceil(filteredLogs.length / pageSize),
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(filteredLogs.length / pageSize)
                    }
                    className={`flex items-center px-3 py-1 rounded text-sm ${
                      currentPage >= Math.ceil(filteredLogs.length / pageSize)
                        ? darkMode
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default ApiAnalytics;
