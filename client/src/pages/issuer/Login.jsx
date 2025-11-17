import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/formValidation";

export default function IssuerLogin() {
  const navigate = useNavigate();

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
      // SIMULATED LOGIN API
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (form.email === "issuer@test.com" && form.password === "Password123") {
            resolve();
          } else {
            reject(new Error("Invalid email or password"));
          }
        }, 1200);
      });

      navigate("/issuer/dashboard"); // change as needed
    } catch (err) {
      setLoginError(err.message);
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
