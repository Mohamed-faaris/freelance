import React from "react";
import { useTheme } from "../context/ThemeContext";

// Trend interface for type safety
interface Trend {
  value: string;
  text: string;
  positive: boolean;
}

// Props interface for StatsCard
interface StatsCardProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  value: string;
  trend?: Trend;
  darkMode?: boolean;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  isLoading = false,
}) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`p-4 rounded-lg ${
        darkMode ? "bg-gray-800" : "bg-white"
      } shadow-md`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p
            className={`text-xs uppercase font-medium ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">
            {isLoading ? (
              <div
                className={`h-8 w-16 rounded ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              ></div>
            ) : (
              value
            )}
          </h3>
        </div>
        <div
          className={`p-2 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <Icon
            size={20}
            className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
          />
        </div>
      </div>
      {trend && !isLoading && (
        <div
          className={`flex items-center mt-2 text-xs ${
            trend.positive ? "text-green-500" : "text-red-500"
          }`}
        >
          <span className="font-medium">{trend.value}</span>
          <span className="ml-1">{trend.text}</span>
        </div>
      )}
      {isLoading && (
        <div
          className={`mt-2 h-4 w-24 rounded ${
            darkMode ? "bg-gray-700" : "bg-gray-200"
          } animate-pulse`}
        ></div>
      )}
    </div>
  );
};

export default StatsCard;
