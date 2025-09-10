// SearchSuggestions.jsx
import React from "react";
import { User, Building2, Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SearchSuggestionsProps {
  searchQuery: string;
  onSelectTab: (id: string) => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchQuery,
  onSelectTab,
}) => {
  const { darkMode } = useTheme();

  // If search query is empty, don't show suggestions
  if (!searchQuery.trim()) {
    return null;
  }

  // Define available services
  const services = [
    {
      id: "personal",
      name: "Personal Personal Verification",
      description:
        "Generate and verify individual profiles with PAN details, credit scores, and compliance checks.",
      icon: User,
      keywords: ["personal", "individual", "pan", "credit", "person"],
    },
    {
      id: "business",
      name: "Business Verification",
      description:
        "Analyze businesses with GST details, PAN verification, financial health metrics, and compliance status.",
      icon: Building2,
      keywords: [
        "business",
        "company",
        "gst",
        "gstin",
        "corporate",
        "organization",
        "firm",
      ],
    },
  ];

  // Filter services based on search query
  const filteredServices = services.filter((service) => {
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.keywords.some((keyword) => keyword.includes(query))
    );
  });

  if (filteredServices.length === 0) {
    return (
      <div
        className={`absolute top-full right-0 mt-4 w-80 p-3 rounded-lg shadow-lg z-40 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border`}
      >
        <div className="flex items-center justify-center py-4">
          <Search size={18} className="text-gray-400 mr-2" />
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No matching services found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute top-full right-0 mt-4 w-80 rounded-lg shadow-lg z-40 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border overflow-hidden`}
    >
      <div className="p-2">
        <h3
          className={`text-xs uppercase font-medium mb-2 px-2 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Services
        </h3>

        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`p-3 rounded-lg cursor-pointer ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
            onClick={() => onSelectTab(service.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  service.id === "personal"
                    ? darkMode
                      ? "bg-blue-900/70 text-blue-200"
                      : "bg-blue-100 text-blue-600"
                    : darkMode
                    ? "bg-green-900/70 text-green-200"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <service.icon size={18} />
              </div>

              <div>
                <h4 className="font-medium text-sm">{service.name}</h4>
                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {service.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchSuggestions;
