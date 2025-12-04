import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/formValidation";
import { issuerServices } from "../../services/issuerServices";
import { issuerLoginSuccess } from "../../store/authIssuerSlice";
import { useDispatch } from "react-redux";
import { setNotification } from "../../utils/notification";
import logo_1 from "../../assets/logo_1.png";

export default function IssuerLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // clear field-specific error
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};

    newErrors.email = validateEmail(form.email);
    newErrors.password = validatePassword(form.password);

    // remove empty validations
    Object.keys(newErrors).forEach(
      (key) => !newErrors[key] && delete newErrors[key]
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setLoginError("");

    try {
      const response = await issuerServices.login({
        email: form.email,
        password: form.password,
      });
      console.log("Login attempt response:", response);

      if (response.success) {
        dispatch(issuerLoginSuccess({
          issuer: response.data.issuer,
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken
        }));
        setNotification("Login successful!", "success");
        navigate("/issuer/dashboard");
      }

    } catch (err) {
      // Accessing the mock error structure
      setLoginError(err.response?.data?.message || "Login failed. Please try again.");
      setNotification("Login failed. Please check your credentials.", "error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-blue-chill-50 p-4 sm:p-6 font-sans">
      {/* Container Card - Professional, High-Trust Design */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">

        {/* Branding & Context */}
        <div className="text-center mb-2">
          <Link to="/" className="inline-block">
            <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
          </Link>
        </div>
        <p className="text-center text-sm font-semibold text-gray-500 mb-2 uppercase tracking-widest">
          MicroMerit Platform
        </p>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-2">
          Issuer Partner Login
        </h2>
        <p className="text-center text-base text-blue-chill-700 mb-8 font-medium border-b pb-4">
          Manage Secure Credential Issuance & Verification
        </p>

        {/* Error Message Alert Box */}
        {loginError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 font-medium text-sm">{loginError}</p>
          </div>
        )}

        <div className="space-y-6">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Official Email Address
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition duration-150"
              placeholder="e.g., registrar@university.edu "
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition duration-150"
              placeholder="•••••••• "
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold tracking-wide shadow-lg transition duration-200 ease-in-out transform hover:shadow-xl
              ${loading
                ? "bg-blue-chill-400 cursor-not-allowed flex items-center justify-center"
                : "bg-blue-chill-600 hover:bg-blue-chill-700 active:bg-blue-chill-800"
              }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </div>
            ) : "Secure Login"}
          </button>

          {/* Footer Link */}
          <div className="flex justify-center pt-4 border-t border-gray-100 mt-6">
            <span className="text-sm text-gray-500">
              New to MicroMerit?
            </span>
            <span
              onClick={() => navigate("/issuer/signup")}
              className="text-blue-chill-700 hover:text-blue-chill-800 cursor-pointer font-semibold ml-1 transition duration-150"
            >
              Register as an Issuer
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}