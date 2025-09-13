import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Clock,
  ExternalLink,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Filter,
} from "lucide-react";
import { API_URL } from "../../../config";

// Interface for News Article
interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// Interface for API Response
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

// Filter category option type
interface FilterOption {
  id: string;
  label: string;
  description: string;
  apiParams: {
    endpoint: string;
    params: Record<string, string>;
  };
}

interface NewsTabProps {
  searchQuery?: string;
}

const NewsTab: React.FC<NewsTabProps> = ({ searchQuery = "" }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("indian-law");
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useTheme();

  // Filter categories with descriptions and API parameters
  const filterOptions: FilterOption[] = [
    {
      id: "tech",
      label: "Technology",
      description: "Latest tech news and trends",
      apiParams: {
        endpoint: "everything",
        params: {
          category: "technology",
          country: "in", // Default to India since user location is Gurugram, Haryana, IN
        },
      },
    },
    {
      id: "indian-law",
      label: "Indian Law",
      description: "Updates on legal developments in India",
      apiParams: {
        endpoint: "everything",
        params: {
          q: "indian law legal supreme court",
          sortBy: "publishedAt",
        },
      },
    },
    {
      id: "govt-policies",
      label: "Govt Policies",
      description: "New government policies and regulations",
      apiParams: {
        endpoint: "everything",
        params: {
          q: "india government policy regulation",
          sortBy: "publishedAt",
        },
      },
    },
    {
      id: "cybersecurity",
      label: "Cybersecurity",
      description: "Security threats and solutions",
      apiParams: {
        endpoint: "everything",
        params: {
          q: "cybersecurity hacking security breach",
          sortBy: "publishedAt",
        },
      },
    },
    {
      id: "ai",
      label: "AI & ML",
      description: "Artificial intelligence and machine learning",
      apiParams: {
        endpoint: "everything",
        params: {
          q: "artificial intelligence machine learning AI",
          sortBy: "relevancy",
        },
      },
    },
  ];

  // Sync local search query with prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get the current filter's API parameters
  const getCurrentFilterApiParams = () => {
    const currentFilter = filterOptions.find((option) => option.id === filter);
    return currentFilter?.apiParams || filterOptions[0].apiParams;
  };

  // Fetch news based on the selected filter and search query
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get the API parameters for the current filter
        const apiParams = getCurrentFilterApiParams();

        // Construct the query parameters
        const queryParams = new URLSearchParams({
          endpoint: apiParams.endpoint,
          filter: filter,
          pageSize: "20",
        });

        // Add search query if it exists
        if (localSearchQuery) {
          queryParams.append("query", localSearchQuery);
        }

        // Construct the final API URL
        const apiUrl = `${API_URL}/news?${queryParams.toString()}`;
        console.log("Fetching news from:", apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data: NewsApiResponse = await response.json();

        // Filter out articles without images or description
        const filteredArticles = data.articles
          .filter((article) => article.urlToImage && article.description)
          .slice(0, 10); // Show only 10 articles with images

        setNews(filteredArticles);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Failed to load news. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to avoid too many requests
    const handler = setTimeout(() => {
      fetchNews();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filter, localSearchQuery]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Truncate text to a specific length
  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  // Function to handle filter search input changes
  const handleFilterSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSearchQuery(e.target.value);
  };

  // Function to clear search
  const clearSearch = () => {
    setLocalSearchQuery("");
  };

  // Function to clear filter search
  const clearFilterSearch = () => {
    setFilterSearchQuery("");
  };

  // Function to handle filter change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setShowFilters(false); // Hide the filters dropdown after selection
    setFilterSearchQuery(""); // Clear filter search query
  };

  // Filter the filter options based on search query
  const filteredOptions = filterSearchQuery
    ? filterOptions.filter(
        (option) =>
          option.label
            .toLowerCase()
            .includes(filterSearchQuery.toLowerCase()) ||
          option.description
            .toLowerCase()
            .includes(filterSearchQuery.toLowerCase())
      )
    : filterOptions;

  // Get the current filter label
  const currentFilter = filterOptions.find((option) => option.id === filter);

  return (
    <div
      className={`rounded-lg shadow-md ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Header with search and filters */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <h2 className="text-xl font-bold">Latest News</h2>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            {/* Search input */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  size={16}
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                />
              </div>
              <input
                type="text"
                placeholder="Search news..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {localSearchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X
                    size={16}
                    className={darkMode ? "text-gray-400" : "text-gray-500"}
                  />
                </button>
              )}
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-between w-full sm:w-auto px-4 py-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } transition-colors`}
              >
                <div className="flex items-center">
                  <Filter size={16} className="mr-2" />
                  <span>{currentFilter?.label || "Filter"}</span>
                </div>
                <ChevronDown size={16} className="ml-2" />
              </button>

              {/* Filter options dropdown */}
              {showFilters && (
                <div
                  className={`absolute right-0 mt-1 w-64 rounded-md shadow-lg z-10 ${
                    darkMode ? "bg-gray-700" : "bg-white"
                  } border ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  } max-h-80 overflow-y-auto`}
                >
                  {/* Filter search input */}
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-inherit z-10">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Search
                          size={14}
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={filterSearchQuery}
                        onChange={handleFilterSearchChange}
                        className={`w-full pl-7 pr-7 py-1.5 text-sm rounded border ${
                          darkMode
                            ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500"
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {filterSearchQuery && (
                        <button
                          onClick={clearFilterSearch}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center"
                        >
                          <X
                            size={14}
                            className={
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter options list */}
                  <div className="py-1">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleFilterChange(option.id)}
                          className={`w-full text-left px-4 py-2 ${
                            filter === option.id
                              ? darkMode
                                ? "bg-blue-900/30 text-blue-300"
                                : "bg-blue-50 text-blue-700"
                              : ""
                          } hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {option.description}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        No categories match your search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 md:p-6">
        {/* Error handling */}
        {error && (
          <div
            className={`p-4 mb-4 rounded-lg flex items-center ${
              darkMode
                ? "bg-red-900/50 text-red-200"
                : "bg-red-100 text-red-800"
            }`}
          >
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="animate-pulse flex flex-col sm:flex-row gap-4"
              >
                <div
                  className={`h-40 sm:h-24 sm:w-40 ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  } rounded-lg flex-shrink-0`}
                ></div>
                <div className="flex-1 space-y-3 py-1">
                  <div
                    className={`h-4 ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    } rounded w-3/4`}
                  ></div>
                  <div
                    className={`h-3 ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    } rounded w-full`}
                  ></div>
                  <div
                    className={`h-3 ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    } rounded w-1/2`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // News list
          <div className="space-y-6">
            {/* No results state */}
            {news.length === 0 ? (
              <div
                className={`text-center py-12 rounded-lg ${
                  darkMode
                    ? "bg-gray-750 text-gray-300"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                <div className="flex flex-col items-center">
                  <Search className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">No news found</p>
                  <p className="text-sm max-w-md mx-auto">
                    {localSearchQuery
                      ? `No results for "${localSearchQuery}" in ${
                          currentFilter?.label || "selected category"
                        }. Try a different search term or category.`
                      : `No ${
                          currentFilter?.label || "selected category"
                        } news available right now. Try a different category.`}
                  </p>
                  <button
                    onClick={() => {
                      clearSearch();
                      setFilter("tech");
                    }}
                    className={`mt-4 flex items-center px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-blue-700 hover:bg-blue-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } transition-colors`}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              // News articles
              news.map((article, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg transition-colors ${
                    darkMode
                      ? "hover:bg-gray-700 bg-gray-750"
                      : "hover:bg-gray-50 bg-white"
                  } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-40 h-40 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={article.urlToImage || ""}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3
                        className={`text-base font-semibold ${
                          darkMode ? "text-gray-100" : "text-gray-800"
                        } line-clamp-2`}
                      >
                        {article.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        } line-clamp-2`}
                      >
                        {truncateText(article.description, 150)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
                      <div
                        className={`flex items-center text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Clock size={12} className="mr-1" />
                        {formatDate(article.publishedAt)}
                        <span className="mx-2">•</span>
                        <span className="truncate max-w-[180px]">
                          {article.source.name}
                        </span>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center text-xs font-medium ${
                          darkMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-700"
                        } transition-colors`}
                      >
                        Read More
                        <ExternalLink size={12} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Show results count if we have news */}
      {!isLoading && news.length > 0 && (
        <div
          className={`px-6 py-3 border-t ${
            darkMode
              ? "border-gray-700 text-gray-400"
              : "border-gray-200 text-gray-500"
          } text-xs`}
        >
          Showing {news.length} results
          {localSearchQuery && ` for "${localSearchQuery}"`}
          {filter && ` in ${currentFilter?.label}`}
        </div>
      )}
    </div>
  );
};

export default NewsTab;
