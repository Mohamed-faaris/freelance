import React, { useState, useEffect } from 'react';
import { Search, Scale, Building, Users, Crown } from 'lucide-react';

function AdvancedSearch() {
  const [selectedCourt, setSelectedCourt] = useState('consumer-forum');
  const [searchParams, setSearchParams] = useState({
    name: '',
    address: '',
    state: '',
    district: '',
    establishment: 'ANY',
    strictMode: false,
    searchIn: 'both',
    resultsPerPage: 10
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const courtModules = [
    {
      id: 'district-court',
      name: 'District Court',
      icon: <Scale className="w-5 h-5" />,
      endpoint: '/api/district-court/search'
    },
    {
      id: 'high-court',
      name: 'High Court',
      icon: <Building className="w-5 h-5" />,
      endpoint: '/api/high-court/search'
    },
    {
      id: 'consumer-forum',
      name: 'Consumer Forum',
      icon: <Users className="w-5 h-5" />,
      endpoint: '/api/consumer-forum/search'
    },
    {
      id: 'supreme-court',
      name: 'Supreme Court',
      icon: <Crown className="w-5 h-5" />,
      endpoint: '/api/supreme-court/search'
    }
  ];

  const establishmentTypes = [
    { value: 'ANY', label: 'All Establishments' },
    { value: 'NCDRC', label: 'NCDRC' },
    { value: 'STATE_COMMISSION', label: 'State Commission' },
    { value: 'DISTRICT_COMMISSION', label: 'District Commission' }
  ];

  const searchInOptions = [
    { value: 'both', label: 'Both Parties' },
    { value: 'petitioner', label: 'Petitioner' },
    { value: 'respondent', label: 'Respondent' }
  ];

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const buildRequestBody = () => {
    const baseBody = {
      name: searchParams.name.trim() || undefined, // Send undefined instead of empty string
      strictMode: searchParams.strictMode,
      searchIn: searchParams.searchIn
    };

    switch (selectedCourt) {
      case 'consumer-forum':
        return {
          ...baseBody,
          establishment: searchParams.establishment
        };
      case 'district-court':
      case 'high-court':
        return {
          ...baseBody,
          address: searchParams.address.trim() || undefined // Send undefined instead of empty string
        };
      case 'supreme-court':
      default:
        return baseBody;
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    // Validate required fields before making API call
    if (!searchParams.name.trim()) {
      setError('Party name is required');
      setLoading(false);
      return;
    }

    try {
      const requestBody = buildRequestBody();

      // Use your local API route
      const response = await fetch(`/api/search?page=1&limit=${searchParams.resultsPerPage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courtType: selectedCourt,
          ...requestBody
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      setSearchResults(data.results || []);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchFields = () => {
    switch (selectedCourt) {
      case 'consumer-forum':
        return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name *
                </label>
                <input
                    type="text"
                    value={searchParams.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="hdfc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                      value={searchParams.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Search for a state...</option>
                    <option value="delhi">Delhi</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="gujarat">Gujarat</option>
                    <option value="karnataka">Karnataka</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                    <button className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
                      Use AI Address Extractor
                    </button>
                  </label>
                  <select
                      value={searchParams.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Search for a district...</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Establishment Type
                </label>
                <select
                    value={searchParams.establishment}
                    onChange={(e) => handleInputChange('establishment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {establishmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                  ))}
                </select>
              </div>
            </>
        );

      case 'district-court':
      case 'high-court':
        return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name *
                </label>
                <input
                    type="text"
                    value={searchParams.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter party name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                    type="text"
                    value={searchParams.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
        );

      case 'supreme-court':
      default:
        return (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Name *
              </label>
              <input
                  type="text"
                  value={searchParams.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter party name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
        );
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Court Type
                  </label>
                  <select
                      value={selectedCourt}
                      onChange={(e) => setSelectedCourt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {courtModules.map(court => (
                        <option key={court.id} value={court.id}>
                          {court.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {renderSearchFields()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search In
                  </label>
                  <select
                      value={searchParams.searchIn}
                      onChange={(e) => handleInputChange('searchIn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {searchInOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Results Per Page
                  </label>
                  <select
                      value={searchParams.resultsPerPage}
                      onChange={(e) => handleInputChange('resultsPerPage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={searchParams.strictMode}
                        onChange={(e) => handleInputChange('strictMode', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Strict Mode (exact name match)</span>
                  </label>
                </div>
              </div>

              <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>{loading ? 'Searching...' : 'Search Cases'}</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h3>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg text-gray-900">
                              {result.title || result.caseName || result.name || `Case ${index + 1}`}
                            </h4>
                            <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {result.filingDate || result.date || 'Date not available'}
                          </span>
                              {result.score && (
                                  <div className="text-xs text-blue-600">
                                    Score: {result.score.toFixed(2)}
                                  </div>
                              )}
                            </div>
                          </div>

                          <div className="text-gray-700 mb-2 space-y-1">
                            <p><strong>Case Number:</strong> {result.cnr || result.caseNumber || result.id || 'N/A'}</p>
                            <p><strong>Court:</strong> {result.court || courtModules.find(c => c.id === selectedCourt)?.name}</p>

                            {/* Handle different API response structures */}
                            {result.petitioners && result.respondents && (
                                <>
                                  <p><strong>Petitioners:</strong> {
                                    Array.isArray(result.petitioners)
                                        ? result.petitioners.join(', ').replace(/<\/?em>/g, '')
                                        : result.petitioners
                                  }</p>
                                  <p><strong>Respondents:</strong> {
                                    Array.isArray(result.respondents)
                                        ? result.respondents.join(', ').replace(/<\/?em>/g, '')
                                        : result.respondents
                                  }</p>
                                </>
                            )}

                            {result.complainants && result.respondents && (
                                <>
                                  <p><strong>Complainants:</strong> {
                                    Array.isArray(result.complainants)
                                        ? result.complainants.join(', ').replace(/<\/?em>/g, '')
                                        : result.complainants
                                  }</p>
                                  <p><strong>Respondents:</strong> {
                                    Array.isArray(result.respondents)
                                        ? result.respondents.join(', ').replace(/<\/?em>/g, '')
                                        : result.respondents
                                  }</p>
                                </>
                            )}

                            {result.parties && <p><strong>Parties:</strong> {result.parties}</p>}

                            <p><strong>Status/Stage:</strong> {result.stage || result.status || 'Not specified'}</p>

                            {result.nextDate && (
                                <p><strong>Next Date:</strong> {result.nextDate}</p>
                            )}

                            {result.establishment && (
                                <p><strong>Establishment:</strong> {result.establishment}</p>
                            )}
                          </div>

                          {result.summary && (
                              <p className="text-gray-600 text-sm mt-2">{result.summary}</p>
                          )}

                          {/* Show additional metadata for debugging */}
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                              {result.cnr && <span>CNR: {result.cnr}</span>}
                              {result.caseNumber && <span>Case No: {result.caseNumber}</span>}
                              <span>Court: {courtModules.find(c => c.id === selectedCourt)?.name}</span>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {!loading && searchResults.length === 0 && searchParams.name && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No results found. Try adjusting your search criteria.</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default AdvancedSearch;