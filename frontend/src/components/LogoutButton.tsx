import { useState } from "react";
import { LogOut } from "lucide-react";
import { API_URL } from "config";

export default function LogoutButton({ className }: { className?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout API
      await fetch(`${API_URL}/auth`, {
        method: "DELETE",
      });

      // 🗑️ Clear localStorage data
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userUsername");
      localStorage.removeItem("userId");

      console.log("User data cleared from localStorage");

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
        className || ""
      }`}
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Logout</span>
    </button>
  );
}
