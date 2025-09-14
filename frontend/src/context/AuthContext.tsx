import { API_URL } from "../../config";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  username: string;
  email: string;
  role?: "admin" | "superadmin"; // Added role field
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserDataAuto: () => Promise<void>;
  setUserData: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  setUserDataAuto: async () => {},
  setUserData: function (user: User | null): void {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const setUserData = (user: User | null) => {
    console.log("Setting user data:", user); // Debugging line
    setUser(user);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/auth`, {
          // Add cache control headers to prevent caching
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          credentials: "include", // Ensure cookies are sent
        });
        const data = await res.json();
        console.log("Auth check response data:", data); // Debugging line
        if (data.user) {
          setUser({
            id: data.user._id || data.user.id,
            username: data.user.username,
            email: data.user.email,
            role: data.user.role, // Include role from API response
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setUserDataAuto = async () => {
    console.log("Running setUserDataAuto");
    try {
      const res = await fetch(`${API_URL}/auth`, {
        // Add cache control headers to prevent caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        credentials: "include", // Ensure cookies are sent
      });
      console.log("Auth check response data:", res); // Debugging line
      const data = await res.json();
      console.log("Auth check response data:", data); // Debugging line
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
    }
  };

  // Modify the login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Make another request to get full user details including role
      const userRes = await fetch(`${API_URL}/auth`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        credentials: "include", // Ensure cookies are sent
      });

      const userData = await userRes.json();

      if (userData.user) {
        // Set the user with role information
        setUser({
          id: userData.user._id || userData.user.id,
          username: userData.user.username,
          email: userData.user.email,
          role: userData.user.role,
        });
        // Use React Router navigation instead of hard navigation
        navigate("/");
        return;
      } else {
        // Fallback to original data if user endpoint fails
        setUser(data.user);
      }
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
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
        setUserDataAuto, // Added to provider value
        setUserData, // Added to provider value
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
