/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API_URL } from "../../config";
import { getPermissionNames } from "../utils/permissions";

interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    gender: string;
    mfaRequired: boolean;
  };
  emails: Array<{
    id: string;
    email: string;
    isVerified: boolean;
  }>;
  role: {
    id: string;
    name: string;
    description: string;
    permissions: string;
    isActive: boolean;
  };
  organization: any | null;
  recentActivity: any[];
  tokenPayload: {
    userId: string;
    sessionId: string;
    roleId: string;
    permissionBits: string;
    issuedAt: number;
    expiresAt: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${AUTH_API_URL}/user`, {
          credentials: "include", // Ensure cookies are sent
        });

        console.log("Auth check - Response status:", res.status);
        console.log(
          "Auth check - Response headers:",
          Object.fromEntries(res.headers.entries())
        );

        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            console.log("Navigating to /login - Unauthorized");
            navigate("/login");
            return;
          } else {
            console.log("Auth check failed with status:", res.status);
            throw new Error("Auth check failed");
          }
        }

        // Log raw response text before parsing
        const responseText = await res.text();
        console.log("Auth check - Raw response text:", responseText);

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Auth check - JSON parse error:", parseError);
          console.error(
            "Auth check - Response was not valid JSON:",
            responseText
          );
          throw new Error("Invalid JSON response from auth endpoint");
        }

        console.log("Auth check response data:", data); // Debugging line
        if (data) {
          // The response IS the user object, not wrapped in a user property
          const userObj = data.tokenPayload ? data : data.user;

          if (!userObj) {
            setUser(null);
            return;
          }

          // Convert permissionBits to permissions array
          // Try tokenPayload first, then fallback to role.permissions
          const permissionBitsStr =
            userObj.tokenPayload?.permissionBits ||
            userObj.role?.permissions ||
            "0";
          const permissionBits = BigInt(permissionBitsStr);
          const permissions = getPermissionNames(permissionBits);

          console.log(
            "Permission Bits:",
            permissionBitsStr,
            "Parsed:",
            permissionBits.toString(),
            "Names:",
            permissions
          );

          setUser({
            ...userObj,
            permissions,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Modify the login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // Step 1: Authenticate with credentials - external auth server handles this
      const authRes = await fetch(`${AUTH_API_URL}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Cookies set by external auth server
      });

      if (!authRes.ok) {
        if (authRes.status === 401) {
          throw new Error("Invalid credentials or not authenticated");
        }
        throw new Error("Login failed");
      }

      const userData = await authRes.json();

      if (userData) {
        // The response IS the user object, not wrapped in a user property
        const userObj = userData.tokenPayload ? userData : userData.user;

        if (!userObj) {
          throw new Error("No user data received");
        }

        // Convert permissionBits to permissions array
        // Try tokenPayload first, then fallback to role.permissions
        const permissionBitsStr =
          userObj.tokenPayload?.permissionBits ||
          userObj.role?.permissions ||
          "0";
        const permissionBits = BigInt(permissionBitsStr);
        const permissions = getPermissionNames(permissionBits);

        console.log(
          "Permission Bits:",
          permissionBitsStr,
          "Parsed:",
          permissionBits.toString(),
          "Names:",
          permissions
        );

        // Set the user with full profile and permission bits from tokenPayload
        setUser({
          ...userObj,
          permissions,
        });
        console.log("Navigating to / - Login successful");
        navigate("/");
      } else {
        throw new Error("No user data received");
      }
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      console.log("Navigating to /login - Logout successful");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
