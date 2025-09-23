import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  User as UserIcon,
  UserPlus,
  Edit,
  Trash2,
  X,
  Search,
  Mail,
  Lock,
  Shield,
  Plus,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  KeyRound,
  Clock,
  ActivitySquare,
  BarChart3,
  Newspaper,
  Building2,
  ShieldCheck,
  User,
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

type User = {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "superadmin" | "user";
  createdAt: string;
  permissions: { resource: string; actions: string[] }[];
};

import { useAuth } from "../../context/AuthContext";

// Tab type
type TabId = "users" | "activity" | "settings";

export default function UserManagement() {
  const { darkMode } = useTheme();
  const { user: loggedInUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccessControlModal, setShowAccessControlModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [tabPermissions, setTabPermissions] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    console.log("Admin users list updated", adminUsers);
  }, [adminUsers]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin" | "user",
  });
  const [tableState, setTableState] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    sortField: "createdAt",
    sortDirection: "desc" as "asc" | "desc",
    filterRole: "all" as "all" | "admin" | "superadmin" | "user",
  });

  // Tabs configuration
  const tabs: {
    id: TabId;
    label: string;
    icon: typeof Users;
    requireRole?: string;
  }[] = [
    { id: "users", label: "Users", icon: Users },
    // { id: "activity", label: "Activity Log", icon: ActivitySquare },
    // {
    //   id: "settings",
    //   label: "Settings",
    //   icon: Settings,
    //   requireRole: "superadmin",
    // },
  ];

  // Constants for navigation and permissions
  const NAVIGATION_RESOURCES = [
    {
      id: "news",
      label: "News",
      icon: Newspaper,
      color: "blue",
      description: "System news and announcements",
    },
    {
      id: "business",
      label: "Business Verification",
      icon: Building2,
      color: "purple",
      description: "Business verification functionality",
    },
    {
      id: "fssai-verification",
      label: "FSSAI Verification",
      icon: Building2,
      color: "purple",
      description: "FASSAI verification functionality",
    },
    {
      id: "verification-mini",
      label: "Mini Verification",
      icon: ShieldCheck,
      color: "indigo",
      description: "Basic identity verification",
    },
    {
      id: "verification-lite",
      label: "Lite Verification",
      icon: ShieldCheck,
      color: "indigo",
      description: "Standard identity verification",
    },
    {
      id: "verification-advanced",
      label: "Advanced Verification",
      icon: ShieldCheck,
      color: "indigo",
      description: "Comprehensive identity verification",
    },
  ] as const;

  // Type definitions
  type UserPermission = {
    resource: string;
    actions: string[];
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== "users") return;

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        setError("Error loading users. Please try again.");
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      if (loggedInUser?.role !== "superadmin") return;

      try {
        const response = await fetch(`${API_URL}/users?role=admin`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch admin users");

        const data = await response.json();
        setAdminUsers(data.users);
      } catch (error) {
        console.error("Error fetching admin users:", error);
        setError("Failed to load admin users");
      }
    };

    fetchAdminUsers();
  }, [loggedInUser?.role]);

  const updateUserPermission = (
    resource: string,
    action: string,
    isGranted: boolean
  ) => {
    if (!selectedAdminUser) return;

    try {
      // Create a deep copy of the permissions
      const updatedPermissions = JSON.parse(
        JSON.stringify(selectedAdminUser.permissions)
      );

      const resourceIndex = updatedPermissions.findIndex(
        (p: any) => p.resource === resource
      );

      if (resourceIndex > -1) {
        // Existing resource permission
        if (isGranted) {
          // Add action if not already present
          if (!updatedPermissions[resourceIndex].actions.includes(action)) {
            updatedPermissions[resourceIndex].actions.push(action);
          }
        } else {
          // Remove action
          updatedPermissions[resourceIndex].actions = updatedPermissions[
            resourceIndex
          ].actions.filter((a: string) => a !== action);

          // If no actions left, remove the entire permission
          if (updatedPermissions[resourceIndex].actions.length === 0) {
            updatedPermissions.splice(resourceIndex, 1);
          }
        }
      } else if (isGranted) {
        // New resource permission
        updatedPermissions.push({
          resource,
          actions: [action],
        });
      }

      // Update local state immediately for responsive UI
      setSelectedAdminUser((prev) =>
        prev ? { ...prev, permissions: updatedPermissions } : null
      );
    } catch (error) {
      console.error("Error updating permissions:", error);
      setError("An error occurred while updating permissions.");
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedAdminUser) return;

    setIsSavingPermissions(true);

    try {
      const response = await fetch(`${API_URL}/users/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedAdminUser._id,
          permissions: selectedAdminUser.permissions,
          updatedBy: loggedInUser?.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save permissions");
      }
      showSuccess("Permissions updated successfully");

      // Refresh the admin users list to get the latest changes
      console.log("Refreshing admin users list");
      const refreshResponse = await fetch(`${API_URL}/users?role=admin`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        console.log("Fetched admin users:", data.users);
        setAdminUsers(data.users);
      }

      // Close the modal
      setShowAccessControlModal(false);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      setError(error.message || "Failed to save permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (loggedInUser?.role !== "superadmin") return;

      try {
        const response = await fetch(`${API_URL}/users/permissions?role=admin`);
        if (!response.ok) throw new Error("Failed to fetch permissions");

        const data = await response.json();

        // Convert to a more usable format
        const permissionMap: Record<string, string[]> = {};
        data.permissions.forEach((perm: any) => {
          permissionMap[perm.resource] = perm.actions;
        });

        setTabPermissions(permissionMap);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, [loggedInUser?.role]);

  // Function to handle sorting
  const handleSort = (field: string) => {
    setTableState((prev) => ({
      ...prev,
      sortField: field,
      sortDirection:
        prev.sortField === field && prev.sortDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Function to handle role filtering
  const handleRoleFilter = (role: "all" | "admin" | "superadmin" | "user") => {
    setTableState((prev) => ({
      ...prev,
      filterRole: role,
      currentPage: 1, // Reset to first page when filtering
    }));
  };

  // Function to display success message temporarily
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Function to open access control modal for a specific user
  const openAccessControlModal = (user: User) => {
    setSelectedAdminUser(user);
    setShowAccessControlModal(true);
  };

  // Process users (filter, sort, and paginate)
  const processedUsers = useMemo(() => {
    // First apply search filter
    console.log("Filtering users:", users);
    let result = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Then apply role filter
    if (tableState.filterRole !== "all") {
      result = result.filter((user) => user.role === tableState.filterRole);
    }

    // Then apply sorting
    result = [...result].sort((a, b) => {
      const field = tableState.sortField;
      const direction = tableState.sortDirection === "asc" ? 1 : -1;

      if (field === "username") {
        return direction * a.username.localeCompare(b.username);
      } else if (field === "email") {
        return direction * a.email.localeCompare(b.email);
      } else if (field === "role") {
        return direction * a.role.localeCompare(b.role);
      } else if (field === "createdAt") {
        return (
          direction *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      }

      return 0;
    });

    return result;
  }, [users, searchQuery, tableState]);

  // Pagination calculations
  const indexOfLastItem = tableState.currentPage * tableState.itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - tableState.itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedUsers.length / tableState.itemsPerPage);

  // Function to change page
  const paginate = (pageNumber: number) => {
    setTableState((prev) => ({
      ...prev,
      currentPage: pageNumber,
    }));
  };

  // Handle user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      const newUser = await response.json();
      setUsers([...users, newUser.user]);

      setShowAddModal(false);
      resetForm();
      showSuccess(`User ${formData.username} created successfully`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Handle user update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_URL}/users/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          // Only include password if it was changed
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      const updatedUser = await response.json();
      setUsers(
        users.map((user) =>
          user._id === currentUser._id ? updatedUser.user : user
        )
      );

      setShowEditModal(false);
      resetForm();
      showSuccess(`User ${updatedUser.user.username} updated successfully`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_URL}/users/${currentUser._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      setUsers(users.filter((user) => user._id !== currentUser._id));

      setShowDeleteModal(false);
      showSuccess(`User ${currentUser.username} deleted successfully`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "admin",
    });
    setCurrentUser(null);
  };

  // Open edit modal with user data
  const openEditModal = (user: any) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "", // Empty password field for edit
      role: user.role,
    });
    setShowEditModal(true);
  };

  // Open delete modal with user data
  const openDeleteModal = (user: any) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  // Format date for activity log
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Check if user has required role
  const hasRole = (requiredRole?: string): boolean => {
    if (!requiredRole) return true;
    if (!loggedInUser?.role) return false;

    if (requiredRole === "superadmin") {
      return loggedInUser.role === "superadmin";
    }

    return true;
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p
            className={`mt-1 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Manage your admin, superadmin, and user accounts
          </p>
        </div>
        {activeTab === "users" && (
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center px-5 py-2.5 rounded-lg ${
              darkMode
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } transition-colors duration-200 shadow-sm`}
          >
            <Plus size={18} className="mr-2" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {tabs.map(
            (tab) =>
              (!tab.requireRole || hasRole(tab.requireRole)) && (
                <li key={tab.id} className="mr-2">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 rounded-t-lg ${
                      activeTab === tab.id
                        ? darkMode
                          ? "text-blue-400 border-blue-500"
                          : "text-blue-600 border-blue-600"
                        : darkMode
                        ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                        : "border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon size={18} className="mr-2" />
                    {tab.label}
                  </button>
                </li>
              )
          )}
        </ul>
      </div>

      {/* Success message */}
      {successMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between ${
            darkMode
              ? "bg-green-900/30 text-green-200"
              : "bg-green-100 text-green-800"
          } animate-fadeIn`}
        >
          <div className="flex items-center">
            <CheckCircle size={20} className="mr-2" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 p-1 rounded-full hover:bg-green-200/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between ${
            darkMode ? "bg-red-900/50 text-red-200" : "bg-red-100 text-red-800"
          }`}
        >
          <div className="flex items-center">
            <X size={20} className="mr-2" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-2 p-1 rounded-full hover:bg-red-200/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "users" && (
        <>
          {/* Search and filter */}
          <div className="flex items-center">
            <div
              className={`flex items-center px-4 py-3 rounded-lg flex-grow ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Search
                size={18}
                className={darkMode ? "text-gray-400" : "text-gray-600"}
              />
              <input
                type="text"
                placeholder="Search by username, email or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`ml-3 bg-transparent border-none outline-none w-full ${
                  darkMode
                    ? "text-white placeholder-gray-400"
                    : "text-gray-800 placeholder-gray-500"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`p-1 rounded-full ${
                    darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                  }`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filtering options */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div
              className={`flex items-center rounded-lg text-sm ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <span className="px-3 py-2 flex items-center">
                <Filter size={14} className="mr-2" />
                Role:
              </span>
              <button
                onClick={() => handleRoleFilter("all")}
                className={`px-3 py-2 transition-colors ${
                  tableState.filterRole === "all"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleRoleFilter("admin")}
                className={`px-3 py-2 transition-colors ${
                  tableState.filterRole === "admin"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => handleRoleFilter("superadmin")}
                className={`px-3 py-2 transition-colors ${
                  tableState.filterRole === "superadmin"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                Superadmin
              </button>
              <button
                onClick={() => handleRoleFilter("user")}
                className={`px-3 py-2 transition-colors ${
                  tableState.filterRole === "user"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                User
              </button>
            </div>

            <div
              className={`flex items-center rounded-lg text-sm ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <span className="px-3 py-2 flex items-center whitespace-nowrap">
                {tableState.sortDirection === "asc" ? (
                  <SortAsc size={14} className="mr-2" />
                ) : (
                  <SortDesc size={14} className="mr-2" />
                )}
                Sort by:
              </span>
              <button
                onClick={() => handleSort("username")}
                className={`px-3 py-2 transition-colors ${
                  tableState.sortField === "username"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                Username
              </button>
              <button
                onClick={() => handleSort("role")}
                className={`px-3 py-2 transition-colors ${
                  tableState.sortField === "role"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                Role
              </button>
              <button
                onClick={() => handleSort("createdAt")}
                className={`px-3 py-2 transition-colors ${
                  tableState.sortField === "createdAt"
                    ? darkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : ""
                }`}
              >
                Created
              </button>
            </div>

            <div className="flex-grow"></div>

            <div
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Showing {processedUsers.length > 0 ? indexOfFirstItem + 1 : 0}-
              {Math.min(indexOfLastItem, processedUsers.length)} of{" "}
              {processedUsers.length} users
            </div>
          </div>

          {/* Users table */}
          <div
            className={`rounded-lg overflow-x-auto shadow ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("username")}
                  >
                    <div className="flex items-center">
                      User
                      {tableState.sortField === "username" &&
                        (tableState.sortDirection === "asc" ? (
                          <ChevronUp size={14} className="ml-1" />
                        ) : (
                          <ChevronDown size={14} className="ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      Role
                      {tableState.sortField === "role" &&
                        (tableState.sortDirection === "asc" ? (
                          <ChevronUp size={14} className="ml-1" />
                        ) : (
                          <ChevronDown size={14} className="ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Created At
                      {tableState.sortField === "createdAt" &&
                        (tableState.sortDirection === "asc" ? (
                          <ChevronUp size={14} className="ml-1" />
                        ) : (
                          <ChevronDown size={14} className="ml-1" />
                        ))}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`h-12 w-12 rounded-full ${
                                darkMode ? "bg-gray-600" : "bg-gray-300"
                              }`}
                            ></div>
                            <div className="ml-4">
                              <div
                                className={`h-4 w-32 rounded ${
                                  darkMode ? "bg-gray-600" : "bg-gray-300"
                                }`}
                              ></div>
                              <div
                                className={`h-3 w-40 rounded mt-2 ${
                                  darkMode ? "bg-gray-600" : "bg-gray-300"
                                }`}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div
                            className={`h-6 w-24 rounded ${
                              darkMode ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          ></div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div
                            className={`h-4 w-28 rounded ${
                              darkMode ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          ></div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div
                            className={`h-8 w-20 rounded ${
                              darkMode ? "bg-gray-600" : "bg-gray-300"
                            } ml-auto`}
                          ></div>
                        </td>
                      </tr>
                    ))
                ) : currentItems.length > 0 ? (
                  currentItems.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:${
                        darkMode ? "bg-gray-750" : "bg-gray-50"
                      } transition-colors duration-150`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              darkMode ? "bg-blue-800" : "bg-blue-100"
                            } ${darkMode ? "text-blue-200" : "text-blue-700"}`}
                          >
                            <User size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">
                              {user.username}
                            </div>
                            <div
                              className={`text-sm flex items-center mt-1 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              <Mail size={14} className="mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`px-3 py-1.5 inline-flex items-center text-xs leading-5 font-semibold capitalize rounded-full ${
                              user.role === "superadmin"
                                ? darkMode
                                  ? "bg-red-900/30 text-red-200"
                                  : "bg-red-100 text-red-800"
                                : darkMode
                                ? "bg-green-900/30 text-green-200"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <Shield size={14} className="mr-1" />
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {/* Access Control button only for admin users when user is superadmin */}
                          {loggedInUser?.role === "superadmin" &&
                            user.role !== "superadmin" && (
                              <button
                                onClick={() => openAccessControlModal(user)}
                                className={`p-2 rounded-full ${
                                  darkMode
                                    ? "hover:bg-gray-700 text-indigo-300"
                                    : "hover:bg-indigo-100 text-indigo-600"
                                } transition-colors duration-200`}
                                title="Access Control"
                              >
                                <KeyRound size={16} />
                              </button>
                            )}
                          {/* Edit Button */}
                          {(loggedInUser?.role === "superadmin" &&
                            user.role !== "superadmin") ||
                          (loggedInUser?.role === "admin" &&
                            user.role === "user") ? (
                            <button
                              onClick={() => openEditModal(user)}
                              className={`p-2 rounded-full ${
                                darkMode
                                  ? "hover:bg-gray-700 text-blue-300"
                                  : "hover:bg-blue-100 text-blue-600"
                              } transition-colors duration-200`}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          ) : null}
                          {/* Delete Button */}
                          {(loggedInUser?.role === "superadmin" &&
                            user.role !== "superadmin") ||
                          (loggedInUser?.role === "admin" &&
                            user.role === "user") ? (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className={`p-2 rounded-full ${
                                darkMode
                                  ? "hover:bg-gray-700 text-red-300"
                                  : "hover:bg-red-100 text-red-600"
                              } transition-colors duration-200`}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-sm font-medium"
                    >
                      {searchQuery || tableState.filterRole !== "all" ? (
                        <div className="flex flex-col items-center">
                          <Search size={24} className="mb-2 opacity-40" />
                          <p>No users found with the current filters</p>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setTableState((prev) => ({
                                ...prev,
                                filterRole: "all",
                              }));
                            }}
                            className={`mt-2 text-sm ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <User size={24} className="mb-2 opacity-40" />
                          <p>No users available</p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className={`mt-2 text-sm ${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            Add your first user
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && processedUsers.length > tableState.itemsPerPage && (
            <div className="mt-4 flex items-center justify-between">
              <div>
                <select
                  value={tableState.itemsPerPage}
                  onChange={(e) =>
                    setTableState((prev) => ({
                      ...prev,
                      itemsPerPage: Number(e.target.value),
                      currentPage: 1,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    darkMode
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    paginate(Math.max(1, tableState.currentPage - 1))
                  }
                  disabled={tableState.currentPage === 1}
                  className={`p-2 rounded-md ${
                    tableState.currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : darkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, idx) => {
                      // Logic to determine which page numbers to show
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (tableState.currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (tableState.currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = tableState.currentPage - 2 + idx;
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => paginate(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            tableState.currentPage === pageNum
                              ? darkMode
                                ? "bg-blue-700 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() =>
                    paginate(Math.min(totalPages, tableState.currentPage + 1))
                  }
                  disabled={tableState.currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    tableState.currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : darkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity Log Tab Content */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-md`}
          >
            <div className="flex items-center mb-4">
              <ActivitySquare size={20} className="mr-2 text-blue-500" />
              <h2 className="text-xl font-bold">User Activity Log</h2>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                // Loading skeleton
                Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      } animate-pulse`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div
                            className={`h-6 w-6 rounded-full ${
                              darkMode ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          ></div>
                          <div
                            className={`ml-2 h-4 w-32 rounded ${
                              darkMode ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          ></div>
                        </div>
                        <div
                          className={`h-4 w-24 rounded ${
                            darkMode ? "bg-gray-600" : "bg-gray-300"
                          }`}
                        ></div>
                      </div>
                      <div
                        className={`mt-2 h-4 w-3/4 rounded ${
                          darkMode ? "bg-gray-600" : "bg-gray-300"
                        }`}
                      ></div>
                    </div>
                  ))
              ) : activities.length > 0 ? (
                // Activity items
                activities.map((activity) => (
                  <div
                    key={activity._id}
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    } border-l-4 ${
                      activity.action === "create"
                        ? "border-blue-500"
                        : activity.action === "update"
                        ? "border-green-500"
                        : activity.action === "delete"
                        ? "border-red-500"
                        : "border-yellow-500"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <User className="mr-2 text-blue-500" size={16} />
                        <span className="font-medium">
                          {typeof activity.userId === "object"
                            ? activity.userId.username
                            : "User"}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1">
                      {activity.action === "create" && "Created"}
                      {activity.action === "update" && "Updated"}
                      {activity.action === "delete" && "Deleted"}
                      {activity.action === "login" && "Logged in"}{" "}
                      {activity.details?.target || ""}
                    </p>
                  </div>
                ))
              ) : (
                // Empty state
                <div className="text-center py-8">
                  <Clock size={48} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium mb-2">
                    No activity logs found
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    User actions will appear here when they happen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Access Control Modal */}
      {showAccessControlModal && selectedAdminUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 z-0 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setShowAccessControlModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>

            {/* Modal panel */}
            <div
              className={`inline-block w-full z-10 max-w-3xl transform overflow-hidden rounded-lg text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle backdrop-blur-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 pt-6 pb-6 sm:p-8">
                <div className="sm:flex sm:items-start mb-6">
                  <div
                    className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${
                      darkMode ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <KeyRound
                      className={`h-7 w-7 ${
                        darkMode ? "text-blue-200" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl font-semibold leading-6">
                      Manage Access Permissions
                    </h3>
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Configure access permissions for{" "}
                        {selectedAdminUser.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {NAVIGATION_RESOURCES.map((resource) => (
                      <div
                        key={resource.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          darkMode
                            ? "border-gray-700 bg-gray-750 hover:bg-gray-700"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        } transition-colors duration-150`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-3 rounded-lg ${
                              darkMode ? "bg-gray-700" : "bg-white"
                            }`}
                          >
                            <resource.icon
                              size={22}
                              className={`text-${resource.color}-${
                                darkMode ? "400" : "500"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-base">
                              {resource.label}
                            </h4>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {resource.description}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="inline-flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className={`form-checkbox h-5 w-5 ${
                                darkMode
                                  ? "text-blue-500 border-gray-600 bg-gray-700 focus:ring-blue-600 focus:ring-opacity-25"
                                  : "text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-opacity-25"
                              } rounded`}
                              checked={
                                selectedAdminUser.permissions
                                  .find((p) => p.resource === resource.id)
                                  ?.actions.includes("view") ?? false
                              }
                              onChange={(e) =>
                                updateUserPermission(
                                  resource.id,
                                  "view",
                                  e.target.checked
                                )
                              }
                            />
                            <span
                              className={
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Allow Access
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAccessControlModal(false)}
                      className={`px-4 py-2 rounded-md ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      } transition-colors duration-200`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveUserPermissions}
                      disabled={isSavingPermissions}
                      className={`px-6 py-2 rounded-md ${
                        darkMode
                          ? "bg-blue-700 hover:bg-blue-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      } transition-colors flex items-center justify-center space-x-2`}
                    >
                      {isSavingPermissions ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
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
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          <span>Save All Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>

            {/* Modal panel */}
            <div
              className={`inline-block transform overflow-hidden rounded-lg text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle backdrop-blur-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 pt-6 pb-6 sm:p-8">
                <div className="sm:flex sm:items-start mb-6">
                  <div
                    className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${
                      darkMode ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <UserPlus
                      className={`h-7 w-7 ${
                        darkMode ? "text-blue-200" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl font-semibold leading-6">
                      Add New User
                    </h3>
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Create a new admin or superadmin user account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <form onSubmit={handleCreateUser} className="space-y-6">
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="username"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Username
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                            placeholder="Enter username"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Email
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Password
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="role"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Role
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role: e.target.value as
                                  | "admin"
                                  | "superadmin"
                                  | "user",
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 appearance-none ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                          >
                            <option value="user">User</option>
                            {loggedInUser?.role === "superadmin" && (
                              <>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className={`inline-flex w-full justify-center items-center rounded-md border px-4 py-2.5 text-base font-medium shadow-sm transition-colors duration-200 sm:text-sm ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex w-full justify-center items-center rounded-md border border-transparent px-4 py-2.5 text-base font-medium shadow-sm transition-colors duration-200 sm:text-sm ${
                          darkMode
                            ? "bg-blue-700 text-white hover:bg-blue-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Create User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 backdrop-blur-sm transition-opacity"
              onClick={() => setShowEditModal(false)}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>
            <div
              className={`inline-block transform overflow-hidden rounded-lg text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle backdrop-blur-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 pt-6 pb-6 sm:p-8">
                <div className="sm:flex sm:items-start mb-6">
                  <div
                    className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${
                      darkMode ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <Edit
                      className={`h-7 w-7 ${
                        darkMode ? "text-blue-200" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl font-semibold leading-6">
                      Edit User
                    </h3>
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Update {currentUser.username}'s account information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <form onSubmit={handleUpdateUser} className="space-y-6">
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="edit-username"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Username
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="text"
                            id="edit-username"
                            name="username"
                            required
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              })
                            }
                            className={`pl-10 block border w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="edit-email"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Email
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="email"
                            id="edit-email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className={`pl-10 block w-full rounded-md border shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="edit-password"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Password (leave empty to keep current)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <input
                            type="password"
                            id="edit-password"
                            name="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                            placeholder="Leave empty to keep current password"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="edit-role"
                          className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Role
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield
                              size={16}
                              className={
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }
                            />
                          </div>
                          <select
                            id="edit-role"
                            name="role"
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role: e.target.value as
                                  | "admin"
                                  | "superadmin"
                                  | "user",
                              })
                            }
                            className={`pl-10 border block w-full rounded-md shadow-sm sm:text-sm px-4 py-2.5 appearance-none ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "border-gray-300 text-gray-900"
                            } focus:border-blue-500 focus:ring-blue-500`}
                          >
                            <option value="user">User</option>
                            {loggedInUser?.role === "superadmin" && (
                              <>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className={`inline-flex w-full justify-center items-center rounded-md border px-4 py-2.5 text-base font-medium shadow-sm transition-colors duration-200 sm:text-sm ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex w-full justify-center items-center rounded-md border border-transparent px-4 py-2.5 text-base font-medium shadow-sm transition-colors duration-200 sm:text-sm ${
                          darkMode
                            ? "bg-blue-700 text-white hover:bg-blue-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Update User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 backdrop-blur-sm transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>
            <div
              className={`inline-block transform overflow-hidden rounded-lg text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle backdrop-blur-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 pt-6 pb-6 sm:p-8">
                <div className="sm:flex sm:items-start mb-6">
                  <div
                    className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${
                      darkMode ? "bg-red-900" : "bg-red-100"
                    }`}
                  >
                    <Trash2
                      className={`h-7 w-7 ${
                        darkMode ? "text-red-200" : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl font-semibold leading-6">
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Are you sure you want to delete the user &quot;
                        {currentUser.username}&quot;? This action cannot be
                        undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className={`w-full inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2.5 text-base font-medium shadow-sm sm:w-auto sm:text-sm ${
                      darkMode
                        ? "bg-red-700 text-white hover:bg-red-600"
                        : "bg-red-600 text-white hover:bg-red-700"
                    } transition-colors duration-200`}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className={`mt-3 w-full inline-flex justify-center items-center rounded-md border px-4 py-2.5 text-base font-medium shadow-sm sm:mt-0 sm:w-auto sm:text-sm ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    } transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
