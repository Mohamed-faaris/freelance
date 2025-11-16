import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
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
        const res = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/user`, {
          // Add cache control headers to prevent caching
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          credentials: "include", // Ensure cookies are sent
        });

        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            navigate("/login");
            return;
          } else {
            throw new Error("Auth check failed");
          }
        }

        const data = await res.json();
        console.log("Auth check response data:", data); // Debugging line
        if (data.user) {
          setUser(data.user);
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
      const authRes = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
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

      if (userData.user) {
        // Set the user with full profile and permission bits from tokenPayload
        setUser(userData.user);
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
      const res = await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
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
