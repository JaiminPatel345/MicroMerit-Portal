import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { issuerServices } from "../../services/issuerServices";
import {
  validateEmail,
  validateMobile,
  validateDomain,
  validateURL,
} from "../../utils/formValidation";
import { useDispatch } from "react-redux";


function IssuerSignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    official_domain: "",
    website_url: "",
    type: "",
    email: "",
    phone: "",
    contact_person_name: "",
    contact_person_designation: "",
    address: "",
    kyc_document_url: "",
    logo_url: "",
    password: "",
    confirm_password: "",
    consent: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // ---------------- VALIDATION (LOGIC UNCHANGED) ----------------
  const validateStep1 = () => {
    let err = {};

    // Name
    if (!form.name.trim()) err.name = "Organization name is required";

    // Email
    const emailValidation = validateEmail(form.email);
    if (emailValidation) err.email = emailValidation;

    // Official Domain (optional)
    if (form.official_domain.trim()) {
      const domainErr = validateDomain(form.official_domain.trim());
      if (domainErr) err.official_domain = domainErr;
    }

    // Website URL (optional)
    if (form.website_url.trim()) {
      const urlErr = validateURL(form.website_url.trim());
      if (urlErr) err.website_url = urlErr;
    }

    // Type
    if (!form.type) err.type = "Please select organization type";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    let err = {};

    // Phone
    const mobileValidation = validateMobile(form.phone);
    if (mobileValidation) err.phone = mobileValidation;

    if (!form.phone.trim()) {
      err.phone = "Phone number is required";
    }

    // Contact name
    if (!form.contact_person_name.trim())
      err.contact_person_name = "Contact person name required";

    // Designation 
    if (!form.contact_person_designation.trim()) {
      err.contact_person_designation = "Designation is required";
    } else if (form.contact_person_designation.trim().length < 2) {
      err.contact_person_designation = "Designation must be at least 2 characters";
    }


    // Address
    if (!form.address.trim()) err.address = "Address is required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep3 = () => {
    let err = {};

    // KYC URL
    if (!form.kyc_document_url.trim()) {
      err.kyc_document_url = "KYC document URL is required";
    } else {
      const kycErr = validateURL(form.kyc_document_url.trim());
      if (kycErr) err.kyc_document_url = kycErr;
    }

    // Logo URL (optional)
    if (form.logo_url.trim()) {
      const logoErr = validateURL(form.logo_url.trim());
      if (logoErr) err.logo_url = logoErr;
    }

    // Password
    if (!form.password || form.password.trim().length < 8) {
      err.password = "Password must be at least 8 characters";
    } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      err.password = "Password must contain letters and numbers";
    }

    // Confirm Password
    if (form.confirm_password !== form.password) {
      err.confirm_password = "Passwords do not match";
    }

    // Consent
    if (!form.consent) err.consent = "You must accept consent to continue";

    setErrors(err);
    return Object.keys(err).length === 0;
  };


  const submitSignup = async () => {
    // Validate all steps before submission
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    try {
      setLoading(true);

      // Filter only fields that have a value
      const filteredFormData = Object.fromEntries(
        Object.entries(form).filter(([key, value]) => {
          if (typeof value === "string") return value.trim() !== "";
          if (typeof value === "boolean") return value === true; // keep checkboxes only if checked
          return value != null; // keep non-null objects
        })
      );

      // Call API
      const response = await issuerServices.startRegistration(filteredFormData);

      if (response.success) {
        navigate("/verify-otp", {
          state: {
            sessionId: response.data.sessionId,
            type: "issuer",
            identifier: form.email,
          },
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      
      // Parse validation errors from backend
      let errorMessage = "Signup failed. Please try again.";
      
      if (error.response?.data?.error) {
        try {
          // Try to parse Zod validation errors
          const validationErrors = JSON.parse(error.response.data.error);
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            // Create a detailed error message from all validation errors
            errorMessage = validationErrors.map(err => {
              const field = err.path?.join('.') || 'field';
              return `${field}: ${err.message}`;
            }).join('; ');
          }
        } catch (parseError) {
          // If not JSON, use the error string directly
          errorMessage = error.response.data.error;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };


  // ---------------- UI ----------------

  const stepTitles = [
    "Organization Details (1/3)",
    "Contact & Address (2/3)",
    "Security & Compliance (3/3)"
  ];

  const getStepIndicatorClass = (s) => {
    if (step === s) return "bg-blue-chill-600 ring-2 ring-blue-chill-300";
    if (step > s) return "bg-green-500"; // Completed step
    return "bg-gray-300";
  };

  const renderField = (name, label, placeholder, type = "text", options = null, rows = 1) => {
    const isSelect = options !== null;
    const isTextarea = rows > 1;
    const isCheckbox = type === "checkbox";
    const error = errors[name];

    return (
      <div className={isCheckbox ? "flex items-start" : "space-y-1"}>
        {!isCheckbox && (
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
            {label}
            {!(name.includes("optional") || name.includes("domain") || name.includes("url")) && <span className="text-red-500">*</span>}
          </label>
        )}

        {isSelect ? (
          <select
            id={name}
            name={name}
            value={form[name]}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition duration-150 ${error ? 'border-red-400' : 'border-gray-300'}`}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : isTextarea ? (
          <textarea
            id={name}
            name={name}
            rows={rows}
            value={form[name]}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition duration-150 ${error ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={placeholder}
          />
        ) : isCheckbox ? (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={form[name]}
              onChange={handleChange}
              className="h-5 w-5 rounded text-blue-chill-600 border-gray-300 focus:ring-blue-chill-500"
            />
            <label htmlFor={name} className="text-sm text-gray-700">
              {label}
            </label>
          </div>
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={form[name]}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition duration-150 ${error ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={placeholder}
          />
        )}

        {error && (
          <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-chill-50 p-4 sm:p-6 font-sans">

      {/* Registration Card */}
      <div className="w-full max-w-xl bg-white p-6 sm:p-10 rounded-2xl shadow-2xl border border-gray-200">

        {/* Header & Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-2">
          Register as Issuer
        </h1>
        <p className="text-center text-md text-blue-chill-700 mb-6 font-medium border-b pb-4">
          {stepTitles[step - 1]}
        </p>

        {/* Step Indicators */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {[1, 2, 3].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-4 w-4 rounded-full ${getStepIndicatorClass(s)} transition-all duration-300`}
                title={`Step ${s}`}
              ></div>
              {index < 2 && <div className="w-8 h-0.5 bg-gray-300"></div>}
            </div>
          ))}
        </div>

        {/* Global Submission Error */}
        {errors.submit && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 font-medium text-sm">{errors.submit}</p>
          </div>
        )}

        {/* -------------------- STEP 1: Organization Details -------------------- */}
        {step === 1 && (
          <div className="space-y-6">
            {renderField("name", "Organization Name", "Ex: Indian Institute of Technology")}
            {renderField("email", "Official Email", "Ex: contact@institute.edu")}
            {renderField("official_domain", "Official Domain (Optional)", "Ex: institute.edu")}
            {renderField("website_url", "Website URL (Optional)", "https://your-organization.com")}

            {renderField("type", "Organization Type", null, "select", [
              { value: "", label: "Select Type" },
              { value: "university", label: "University" },
              { value: "edtech", label: "EdTech" },
              { value: "company", label: "Company" },
              { value: "training_provider", label: "Training Provider" },
            ])}

            <button
              className="w-full bg-blue-chill-600 text-white p-3 rounded-lg font-bold tracking-wide shadow-lg hover:bg-blue-chill-700 transition duration-200"
              onClick={() => validateStep1() && nextStep()}
            >
              Next
            </button>
          </div>
        )}

        {/* -------------------- STEP 2: Contact & Address -------------------- */}
        {step === 2 && (
          <div className="space-y-6">
            {renderField("phone", "Phone Number", "10-digit mobile number")}
            {renderField("contact_person_name", "Contact Person Name", "Full name")}
            {renderField("contact_person_designation", "Designation", "Ex: Registrar, HR Head")}

            {renderField(
              "address",
              "Address",
              "Office / campus / corporate address",
              "textarea",
              null,
              3
            )}

            <div className="flex justify-between gap-4 pt-4">
              <button
                className="w-1/2 p-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition duration-150"
                onClick={prevStep}
              >
                Back
              </button>
              <button
                className="w-1/2 bg-blue-chill-600 text-white p-3 rounded-lg font-bold tracking-wide shadow-lg hover:bg-blue-chill-700 transition duration-200"
                onClick={() => validateStep2() && nextStep()}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* -------------------- STEP 3: Security & Compliance -------------------- */}
        {step === 3 && (
          <div className="space-y-6">
            {renderField("kyc_document_url", "KYC Document URL", "Upload document and paste link (must be a valid URL)")}
            {renderField("logo_url", "Logo URL (Optional)", "Link to organization logo")}

            {renderField("password", "Password", "Minimum 8 characters (with letters and numbers)", "password")}
            {renderField("confirm_password", "Confirm Password", "Re-enter password", "password")}

            {/* CONSENT */}
            {renderField(
              "consent",
              "I give consent to receive invitations & OTP updates on this email.",
              null,
              "checkbox"
            )}
            {errors.consent && (
              <p className="text-red-500 text-xs mt-1 font-medium -mt-2 ml-10">{errors.consent}</p>
            )}

            <div className="flex justify-between gap-4 pt-4">
              <button
                className="w-1/2 p-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition duration-150"
                onClick={prevStep}
              >
                Back
              </button>

              <button
                className="w-1/2 bg-blue-chill-600 text-white p-3 rounded-lg font-bold tracking-wide shadow-lg transition duration-200 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center"
                disabled={loading}
                onClick={submitSignup}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </div>
                ) : "Create Account"}
              </button>
            </div>
          </div>
        )}


        {/* LOGIN LINK */}
        <div className="text-center mt-8 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/issuer/login"
              className="text-blue-chill-700 font-semibold hover:text-blue-chill-800 transition duration-150"
            >
              Login to Partner Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default IssuerSignUp;