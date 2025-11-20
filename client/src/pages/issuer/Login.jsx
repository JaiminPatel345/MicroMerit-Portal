import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/formValidation";
import { loginIssuer } from "../../services/authServices";
import { issuerLoginSuccess } from "../../store/authIssuerSlice";
import { useDispatch } from "react-redux";

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

      const response = await loginIssuer.login({
        email: form.email,
        password: form.password,
      });
      console.log(response);
        
      if(response?.data?.success === true){
        dispatch(issuerLoginSuccess({
          issuer: response.data.data.issuer,
          accessToken: response.data.data.tokens.access,
          refreshToken: response.data.data.tokens.refresh
        }));
        navigate("/issuer/dashboard"); 
      }

    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-blue-chill-700 mb-6">
          Issuer Login
        </h2>

        {loginError && (
          <p className="text-red-600 text-center mb-4 font-medium">
            {loginError}
          </p>
        )}

        <div className="space-y-5">

          {/* Email */}
          <div>
            <label className="font-medium">Email</label>
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border rounded mt-1"
              placeholder="issuer@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border rounded mt-1"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white mt-3 ${
              loading
                ? "bg-blue-chill-300 cursor-not-allowed"
                : "bg-blue-chill-600 hover:bg-blue-chill-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Signup Link */}
          <p className="text-center mt-3 text-gray-600">
            Don't have an issuer account?{" "}
            <span
              onClick={() => navigate("/issuer/signup")}
              className="text-blue-chill-700 cursor-pointer font-medium"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
