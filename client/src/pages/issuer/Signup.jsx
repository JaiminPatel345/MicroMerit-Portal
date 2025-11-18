import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOTP } from "../../services/authServices";
import {
  validateEmail,
  validateMobile,
  validateDomain,
  validateURL,
} from "../../utils/formValidation";

function IssuerSignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  // ---------------- VALIDATION ----------------
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

    // Contact name
    if (!form.contact_person_name.trim())
      err.contact_person_name = "Contact person name required";

    // Designation (optional but needs min 2 chars)
    if (form.contact_person_designation.trim()) {
      if (form.contact_person_designation.trim().length < 2)
        err.contact_person_designation =
          "Designation must be at least 2 characters";
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

    // Consent
    if (!form.consent) err.consent = "You must accept consent to continue";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submitSignup = async () => {
    if (!validateStep3()) return;

    try {
      setLoading(true);
      await sendOTP(form.email);

      navigate("/verify-otp", {
        state: { email: form.email, type: "issuer" },
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-blue-chill-700 text-center mb-6">
          Register as Issuer
        </h2>

        {/* Step Indicators */}
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-3 w-3 rounded-full ${
                step === s ? "bg-blue-chill-600" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>

        {/* -------------------- STEP 1 -------------------- */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label>Organization Name</label>
              <input
                name="name"
                className="w-full p-3 border rounded-lg"
                placeholder="Ex: Indian Institute of Technology"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label>Email</label>
              <input
                name="email"
                className="w-full p-3 border rounded-lg"
                placeholder="Ex: contact@institute.edu"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Official domain */}
            <div>
              <label>Official Domain</label>
              <input
                name="official_domain"
                className="w-full p-3 border rounded-lg"
                placeholder="Ex: institute.edu"
                value={form.official_domain}
                onChange={handleChange}
              />
              {errors.official_domain && (
                <p className="text-red-500 text-sm">{errors.official_domain}</p>
              )}
            </div>

            {/* Website URL */}
            <div>
              <label>Website URL</label>
              <input
                name="website_url"
                className="w-full p-3 border rounded-lg"
                placeholder="https://your-organization.com"
                value={form.website_url}
                onChange={handleChange}
              />
              {errors.website_url && (
                <p className="text-red-500 text-sm">{errors.website_url}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label>Organization Type</label>
              <select
                name="type"
                className="w-full p-3 border rounded-lg"
                value={form.type}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                <option value="university">University</option>
                <option value="edtech">EdTech</option>
                <option value="company">Company</option>
                <option value="training_provider">Training Provider</option>
              </select>

              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type}</p>
              )}
            </div>

            <button
              className="w-full bg-blue-chill-600 text-white p-3 rounded-lg"
              onClick={() => validateStep1() && nextStep()}
            >
              Continue
            </button>
          </div>
        )}

        {/* -------------------- STEP 2 -------------------- */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label>Phone Number</label>
              <input
                name="phone"
                className="w-full p-3 border rounded-lg"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>

            {/* Contact name */}
            <div>
              <label>Contact Person Name</label>
              <input
                name="contact_person_name"
                className="w-full p-3 border rounded-lg"
                placeholder="Full name"
                value={form.contact_person_name}
                onChange={handleChange}
              />
              {errors.contact_person_name && (
                <p className="text-red-500 text-sm">
                  {errors.contact_person_name}
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label>Designation</label>
              <input
                name="contact_person_designation"
                className="w-full p-3 border rounded-lg"
                placeholder="Ex: Registrar, HR Head"
                value={form.contact_person_designation}
                onChange={handleChange}
              />
              {errors.contact_person_designation && (
                <p className="text-red-500 text-sm">
                  {errors.contact_person_designation}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label>Address</label>
              <textarea
                name="address"
                className="w-full p-3 border rounded-lg"
                placeholder="Office / campus / corporate address"
                rows={3}
                value={form.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>

            <div className="flex justify-between gap-4">
              <button className="w-1/2 p-3 border rounded-lg" onClick={prevStep}>
                Back
              </button>
              <button
                className="w-1/2 bg-blue-chill-600 text-white p-3 rounded-lg"
                onClick={() => validateStep2() && nextStep()}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* -------------------- STEP 3 -------------------- */}
        {step === 3 && (
          <div className="space-y-4">
            {/* KYC URL */}
            <div>
              <label>KYC Document URL</label>
              <input
                name="kyc_document_url"
                className="w-full p-3 border rounded-lg"
                placeholder="Upload document and paste link"
                value={form.kyc_document_url}
                onChange={handleChange}
              />
              {errors.kyc_document_url && (
                <p className="text-red-500 text-sm">{errors.kyc_document_url}</p>
              )}
            </div>

            {/* Logo URL */}
            <div>
              <label>Logo URL (optional)</label>
              <input
                name="logo_url"
                className="w-full p-3 border rounded-lg"
                placeholder="Link to organization logo"
                value={form.logo_url}
                onChange={handleChange}
              />
              {errors.logo_url && (
                <p className="text-red-500 text-sm">{errors.logo_url}</p>
              )}
            </div>

            {/* CONSENT */}
            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
              />
              <p className="text-sm">
                I give consent to receive invitations & OTP updates on this email.
              </p>
            </div>

            {errors.consent && (
              <p className="text-red-500 text-sm">{errors.consent}</p>
            )}

            <div className="flex justify-between gap-4">
              <button className="w-1/2 p-3 border rounded-lg" onClick={prevStep}>
                Back
              </button>

              <button
                className="w-1/2 bg-blue-chill-600 text-white p-3 rounded-lg disabled:bg-gray-300"
                disabled={loading}
                onClick={submitSignup}
              >
                {loading ? "Sending OTP..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

        {/* LOGIN LINK */}
        <div className="text-center mt-6">
          <p>
            Already have an account?{" "}
            <Link
              to="/issuer/login"
              className="text-blue-chill-600 font-medium hover:text-blue-chill-700"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default IssuerSignUp;
