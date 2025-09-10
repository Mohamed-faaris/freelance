"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  User,
  Building2,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Bell,
  Search,
  Download,
  Check,
  Share2,
  Clock,
  Filter,
  Newspaper,
  UserCog,
  Logs,
  ShieldCheck,
  Home,
  Users,
  Settings,
  FileText,
  ChevronDown,
  BookOpen,
  SearchCheckIcon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import PersonalProfileForm from "../components/forms/PersonalAdvancedVerificationTab";
import BusinessProfileForm from "../components/forms/BusinessProfileForm";
import LogoutButton from "website/components/LogoutButton";
import { useAuth } from "website/context/AuthContext";
import NewsTab from "website/components/forms/NewsTab";
import UserManagement from "website/components/forms/UserManagement";
import ApiAnalytics from "website/components/forms/ApiAnalytics";
import PersonalMiniVerificationTab from "website/components/forms/PersonalMiniVerificationTab";
import PersonalLiteVerificationTab from "website/components/forms/PersonalLiteVerificationTab";
import Toast from "../components/Toast"; // Toast component
import FassaiProfilePage from "website/components/forms/FssaiProfileForm";
import EducationVerification from "website/components/forms/EducationVerification";
import AdvancedSearch from "../components/forms/AdvancedSearch";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("news"); // Default to news tab
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [tabPermissions, setTabPermissions] = useState<
    Record<string, string[]>
  >({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  interface ToastInfo {
    message: string;
    type: "success" | "error";
  }
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  interface DashboardStats {
    profilesGenerated: number;
    businessReportsGenerated: number;
    dataPointsAnalyzed: string;
    reportsDownloaded: number;
    trends: {
      profilesGenerated: {
        value: string;
        text: string;
        positive: boolean;
      };
      businessReportsGenerated: {
        value: string;
        text: string;
        positive: boolean;
      };
      dataPointsAnalyzed: {
        value: string;
        text: string;
        positive: boolean;
      };
      reportsDownloaded: {
        value: string;
        text: string;
        positive: boolean;
      };
    };
  }

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const { darkMode, toggleDarkMode } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if it's mobile on initial load and when window is resized
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Run on load
    checkIfMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Close sidebar when navigating between tabs on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setMobileSearchOpen(false);
    }
  }, [activeTab, isMobile]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (showSearchSuggestions) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showSearchSuggestions]);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isAuthenticated) {
        setIsLoadingPermissions(false);
        return;
      }

      setIsLoadingPermissions(true);
      try {
        const response = await fetch(
          `/api/users/permissions?userId=${user?.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch permissions");

        const data = await response.json();

        const permissionMap: Record<string, string[]> = {};
        data.permissions.forEach((perm: any) => {
          permissionMap[perm.resource] = perm.actions;
        });

        setTabPermissions(permissionMap);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setToastInfo({
          message: "Failed to load user permissions",
          type: "error",
        });
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [isAuthenticated, user?.id]);

  // Define the NavItem interface
  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    children?: NavItem[];
    requiredPermission?: {
      resource: string;
      action?: string;
    };
  }

  // Navigation items with permission checks
  const navItems: NavItem[] = [
    {
      id: "news",
      label: "News",
      icon: Newspaper,
      requiredPermission: { resource: "news" },
    },
    {
      id: "personal",
      label: "Personal Verification",
      icon: User,
      children: [
        {
          id: "verification-mini",
          label: "Mini",
          icon: ShieldCheck,
          requiredPermission: { resource: "verification-mini" },
        },
        {
          id: "verification-lite",
          label: "Lite",
          icon: ShieldCheck,
          requiredPermission: { resource: "verification-lite" },
        },
        {
          id: "verification-advanced",
          label: "Advanced",
          icon: ShieldCheck,
          requiredPermission: { resource: "verification-advanced" },
        },
      ],
    },
    {
      id: "business",
      label: "Business Verification",
      icon: Building2,
      requiredPermission: { resource: "business" },
    },
    {
      id: "fssai-verification",
      label: "FSSAI Verification",
      icon: Building2,
      requiredPermission: { resource: "fssai-verification" },
    },

    ...(user?.role === "superadmin"
      ? [
          {
            id: "admin-section",
            label: "Administration",
            icon: Settings,
            children: [
              {
                id: "user-management",
                label: "User Management",
                icon: UserCog,
              },
              {
                id: "api-analytics",
                label: "API Analytics",
                icon: Logs,
              },
            ],
          },
        ]
      : []),
    {
      id: "education-verification",
      label: "Education Verification",
      icon: BookOpen,
      requiredPermission: { resource: "education-verification" },
    },
    {
      id: "advanced-search",
      label: "Advanced Search",
      icon: SearchCheckIcon,
      requiredPermission: { resource: "advanced-search" },
    },
  ];

  // Check if tab is allowed based on user permissions
  const isTabAllowed = (item: NavItem): boolean => {
    // Superadmin can access everything
    if (user?.role === "superadmin") return true;

    // If no permission requirement, it's publicly accessible
    if (!item.requiredPermission) return true;

    const { resource, action = "view" } = item.requiredPermission;

    // Check if user has permission for the resource
    return tabPermissions[resource]?.includes(action) ?? false;
  };

  // Filter and process navigation items based on permissions
  const filteredNavItems = navItems
    .filter(
      (item) =>
        isTabAllowed(item) ||
        (item.children && item.children.some((child) => isTabAllowed(child)))
    )
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) => isTabAllowed(child)),
        };
      }
      return item;
    });

  // Handle tab change
  const handleTabChange = (tab: string) => {
    // Verify the tab is allowed
    const isAllowed = filteredNavItems
      .flatMap((item) => [item, ...(item.children || [])])
      .some((item) => item.id === tab && isTabAllowed(item));

    if (!isAllowed) {
      // If not allowed, find the first allowed tab
      const firstAllowedTab = filteredNavItems[0]?.id || "news";
      setActiveTab(firstAllowedTab);
      return;
    }

    setActiveTab(tab);

    // Close sidebar on mobile when selecting a tab
    if (isMobile) {
      setSidebarOpen(false);
    }

    // Update URL without full page refresh
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  // Render navigation item
  const renderNavItem = (item: NavItem) => {
    const isActive =
      activeTab === item.id ||
      (item.children && item.children.some((child) => child.id === activeTab));
    const isExpanded = expandedCategories.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    function toggleCategory(categoryId: string) {
      setExpandedCategories((prevExpandedCategories) => {
        if (prevExpandedCategories.includes(categoryId)) {
          return prevExpandedCategories.filter((id) => id !== categoryId);
        } else {
          return [...prevExpandedCategories, categoryId];
        }
      });
    }

    return (
      <div key={item.id} className="mb-1 w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleCategory(item.id);
            } else {
              handleTabChange(item.id);
            }
          }}
          className={`flex items-center w-full px-2 py-3 transition-colors rounded-lg mx-1 ${
            isActive
              ? darkMode
                ? "bg-gray-700 text-blue-400"
                : "bg-blue-50 text-blue-700"
              : darkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <item.icon
              size={20}
              className={`${isActive ? "text-blue-500" : ""}`}
            />
          </div>
          {sidebarOpen && (
            <>
              <span className="ml-3 flex-grow text-left font-medium text-sm">
                {item.label}
              </span>
              {hasChildren && (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              )}
            </>
          )}
        </button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && sidebarOpen && (
          <div className="pl-4 mt-1 space-y-1 w-full">
            {(item.children ?? []).map((child) => (
              <button
                key={child.id}
                onClick={() => handleTabChange(child.id)}
                className={`flex items-center w-full px-2 py-2 transition-colors rounded-lg mx-1 ${
                  activeTab === child.id
                    ? darkMode
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-50 text-blue-700"
                    : darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <child.icon
                    size={16}
                    className={`${
                      activeTab === child.id ? "text-blue-500" : ""
                    }`}
                  />
                </div>
                <span className="ml-2 text-sm">{child.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    // Render content based on active tab
    switch (activeTab) {
      case "verification-mini":
        return <PersonalMiniVerificationTab />;
      case "verification-lite":
        return <PersonalLiteVerificationTab />;
      case "verification-advanced":
        return <PersonalProfileForm />;
      case "business":
        return <BusinessProfileForm />;
      case "fssai-verification":
        return <FassaiProfilePage />;
      case "news":
        return <NewsTab searchQuery={searchQuery} />;
      case "user-management":
        return <UserManagement />;
      case "api-analytics":
        return <ApiAnalytics />;
      case "education-verification":
        return <EducationVerification />;
      case "advanced-search":
        return <AdvancedSearch />;
      default:
        return <div>Tab not found</div>;
    }
  };

  // Utility function to get user initials
  function getInitials(name: string): string {
    if (!name) return "?";

    const parts = name.split(" ");
    if (parts.length === 1) {
      return name.substring(0, 2).toUpperCase();
    } else {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* Toast Notification */}
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 h-16 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b shadow-sm z-30 transition-all duration-300`}
      >
        <div className="h-full px-3 md:px-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                if (mobileSearchOpen) setMobileSearchOpen(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen && isMobile ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <div
              onClick={() => handleTabChange("news")}
              className="ml-2 cursor-pointer flex items-center"
            >
              <Image
                src="/logo.png"
                alt="argus Logo"
                width={110}
                height={48}
                className={`${darkMode ? "invert" : ""}`}
              />
            </div>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-1 md:space-x-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                  {notifications}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              } transition-colors`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <span>☀️</span> : <span>🌙</span>}
            </button>

            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <button
                className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium"
                aria-label="User menu"
              >
                {getInitials(user?.username || user?.email || "")}
              </button>
            </div>

            {/* Logout Button - Hidden on small screens */}
            <LogoutButton className="hidden md:flex" />
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-16 h-[calc(100vh-4rem)] z-20 transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarOpen
              ? "left-0 w-72 md:w-80"
              : "left-0 -translate-x-full md:-translate-x-0 md:w-16 w-0"
          } ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-r shadow-sm overflow-y-auto`}
        >
          <nav className="h-full flex flex-col justify-between py-4">
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Sidebar header */}
              <div className="px-2 flex justify-between items-center relative mt-4">
                <h2
                  className={`font-semibold text-lg transition-all duration-200 ${
                    sidebarOpen
                      ? "opacity-100 ml-2"
                      : "opacity-0 absolute left-1/2 transform -translate-x-1/2"
                  }`}
                >
                  {sidebarOpen ? "Argus" : "CS"}
                </h2>

                {/* Sidebar toggle button - For desktop only */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-full flex items-center justify-center w-10 h-10 ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } transition-colors ${
                    sidebarOpen
                      ? "ml-auto"
                      : "absolute left-1/2 transform -translate-x-1/2"
                  } hidden md:flex`}
                  aria-label={
                    sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                  }
                >
                  {sidebarOpen ? (
                    <ChevronLeft size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
              </div>

              {/* Navigation Items */}
              <div className="mt-7 px-1 flex flex-col flex-grow overflow-y-auto">
                {filteredNavItems.map(renderNavItem)}
              </div>

              {/* Mobile Logout Button */}
              {sidebarOpen && isMobile && (
                <div className="px-4 mt-4 md:hidden">
                  <LogoutButton className="w-full" />
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-grow transition-all duration-300 overflow-x-hidden ${
            mobileSearchOpen ? "pt-14" : ""
          } ${sidebarOpen ? "ml-0 md:ml-80" : "ml-0 md:ml-16"} p-3 md:p-6`}
        >
          <div className="mx-auto">{renderTabContent()}</div>
        </main>
      </div>
    </div>
  );
}
