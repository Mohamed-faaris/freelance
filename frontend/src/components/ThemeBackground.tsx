"use client";

import { useTheme } from "../context/ThemeContext";

interface ThemeBackgroundProps {
  children: React.ReactNode;
}

export function ThemeBackground({ children }: ThemeBackgroundProps) {
  const { darkMode } = useTheme();

  return (
    <div className={`h-full ${!darkMode ? "bg-gray-50" : ""}`}>{children}</div>
  );
}
