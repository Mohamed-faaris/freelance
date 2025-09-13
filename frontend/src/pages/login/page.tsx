import { API_URL } from "../../../config";
import { useState, type FC, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ---------- ARGUS logo component - plain version ---------- */
const ArgusLogo: FC = () => (
  <div className="text-4xl font-bold text-blue-600 font-sans">ARGUS</div>
);

/* ---------- Floating-label input ---------- */
interface InputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}
const TextField: FC<InputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
}) => (
  <div className="relative mt-6">
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="peer block w-full rounded-lg border-0 border-b border-gray-300 bg-transparent px-3 pt-9 pb-2 text-base text-gray-900 placeholder-transparent focus:border-blue-600 focus:outline-none transition-colors duration-300"
      placeholder=" "
    />
    <label
      htmlFor={id}
      className={`absolute left-3 text-base text-gray-500 transition-all duration-300 pointer-events-none ${
        value
          ? "top-1 text-xs text-blue-600"
          : "top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600"
      }`}
    >
      {label}
    </label>
  </div>
);

/* ---------- Page ---------- */
export default function LoginPage() {
  const navigate = useNavigate();
  const { setUserData } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await response.json();
      console.log("Login response data:", data); // Debugging line
      setUserData(data.user);   

      if (!response.ok) throw new Error(data.error || "Authentication failed");

      // 📧 Store user email and username in localStorage after successful login
      if (data.success && data.user) {
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userUsername", data.user.username);
        localStorage.setItem("userId", data.user.id);

        console.log("User data stored in localStorage:", {
          email: data.user.email,
          username: data.user.username,
          id: data.user.id,
        });
      }

      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-[448px] rounded-2xl border border-gray-200 bg-white px-10 py-12 shadow-sm sm:px-12 animate-fadeIn">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <ArgusLogo />
        </div>

        <h1 className="mt-6 text-center text-2xl font-normal text-gray-800 animate-slideUp">
          Sign in
        </h1>
        <p
          className="mt-1 text-center text-sm text-gray-600 animate-slideUp"
          style={{ animationDelay: "0.2s" }}
        >
          Use your ARGUS Account
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="animate-slideUp" style={{ animationDelay: "0.4s" }}>
            <TextField
              id="email"
              label="Email or phone"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
            />
          </div>

          <div className="animate-slideUp" style={{ animationDelay: "0.6s" }}>
            <TextField
              id="password"
              label="Enter your password"
              type="password"
              value={formData.password}
              onChange={(value) =>
                setFormData({ ...formData, password: value })
              }
            />
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 animate-shake">{error}</p>
          )}

          <div
            className="mt-10 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row animate-slideUp"
            style={{ animationDelay: "0.8s" }}
          >
            <Link
              href="/register"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-300"
            >
              Create account
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="h-[44px] w-full rounded-md bg-[#1a73e8] px-6 text-sm font-medium text-white hover:bg-[#287ae6] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none sm:w-auto transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Next"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer links - like Google login page */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
        <Link
          href="/help"
          className="hover:text-gray-700 transition-colors duration-300"
        >
          Help
        </Link>
        <Link
          href="/privacy"
          className="hover:text-gray-700 transition-colors duration-300"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="hover:text-gray-700 transition-colors duration-300"
        >
          Terms
        </Link>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}
