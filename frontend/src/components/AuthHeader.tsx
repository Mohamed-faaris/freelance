"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext"; // Adjust the import path as needed

export default function AuthHeader() {
  const { darkMode } = useTheme(); // Use the theme context if needed

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-b shadow-sm z-30 transition-all duration-300`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo */}
          <div className="ml-2">
            <Image
              src="/logo.png"
              alt="argus Logo"
              width={140}
              height={60}
              className={`${darkMode ? "invert" : ""}`}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className={`text-sm font-medium ${
              darkMode
                ? "text-gray-300 hover:text-gray-100"
                : "text-gray-700 hover:text-gray-900"
            } transition-colors`}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={`text-sm font-medium ${
              darkMode
                ? "text-gray-300 hover:text-gray-100"
                : "text-gray-700 hover:text-gray-900"
            } transition-colors`}
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
