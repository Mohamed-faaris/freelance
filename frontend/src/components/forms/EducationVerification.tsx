import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { UploadCloud } from "lucide-react";

function EducationVerification() {
  const { darkMode } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null); // To store the result from backend
  const [loading, setLoading] = useState(false); // For loading state
  const [error, setError] = useState<string | null>(null); // For error messages

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    // Reset states when a new file is selected
    setSubmitted(false);
    setVerificationResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload your education proof.");
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null); // Clear previous results

    const formData = new FormData();
    formData.append("file", file); // 'file' must match the parameter name in your FastAPI endpoint

    try {
      const response = await fetch("http://localhost:8000/verify-education/", {
        method: "POST",
        body: formData,
        // FastAPI handles content-type for FormData automatically
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Verification failed");
      }

      const data = await response.json();
      setVerificationResult(data);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "An unexpected error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg shadow-md max-w-xl mx-auto mt-10 ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UploadCloud size={20} />
          Education Verification
        </h2>
        <p
          className={`mt-1 text-sm ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Upload your education proof (10th / 12th / College certificate). File is mandatory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Education Proof <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            onChange={handleChange}
            className={`w-full text-sm rounded-lg border px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white file:bg-white file:text-black"
                : "bg-white border-gray-300 text-gray-800 file:bg-black file:text-white"
            } file:transition hover:file:opacity-80`}
          />
        </div>

        <button
          type="submit"
          className={`w-full mt-2 py-2 rounded-lg font-semibold text-sm ${
            darkMode
              ? "bg-blue-700 hover:bg-blue-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } transition ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Submit Document"}
        </button>

        {error && (
          <div className="text-center text-sm font-medium mt-3 text-red-500">
            ⚠️ {error}
          </div>
        )}

        {submitted && verificationResult && (
          <div
            className={`text-center text-sm font-medium mt-3 ${
              verificationResult.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {verificationResult.isValid ? (
              <>✅ Document is likely VALID!</>
            ) : (
              <>❌ Document is NOT VALID: {verificationResult.details}</>
            )}
            {verificationResult.isValid && verificationResult.details && (
                <div className={`${darkMode ? "text-gray-300" : "text-gray-700"} mt-2 text-xs`}>
                    <h4 className="font-bold">Extracted Information:</h4>
                    <ul className="list-disc list-inside">
                        {Object.entries(verificationResult.details).map(([key, value]) => (
                            <li key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {String(value)}</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default EducationVerification;