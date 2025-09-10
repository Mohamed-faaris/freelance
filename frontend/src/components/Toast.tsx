import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const { darkMode } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 ${
        type === "success"
          ? darkMode
            ? "bg-green-800 text-green-100"
            : "bg-green-600 text-white"
          : darkMode
          ? "bg-red-800 text-red-100"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <Check size={18} className="mr-2" />
      ) : (
        <X size={18} className="mr-2" />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-3 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
