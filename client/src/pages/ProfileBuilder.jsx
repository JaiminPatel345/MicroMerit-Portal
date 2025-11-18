import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Upload, CheckCircle } from 'lucide-react';

const ProfileBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { identifier, type, password, loginMethod, otpVerified } = location.state || {};

  const [formData, setFormData] = useState({
    fullName: '',
    email: type === 'email' ? identifier : '',
    mobile: type === 'mobile' ? identifier : '',
    dateOfBirth: '',
    gender: '',
    profilePicUrl: ''
  });

  const [consents, setConsents] = useState({
    digilockerConsent: loginMethod === 'digilocker',
    autoLinkConsent: false,
    blockchainConsent: true
  });

  const [errors, setErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

  useEffect(() => {
    if (loginMethod === 'google' || loginMethod === 'digilocker') {
      return;
    }
    if (!identifier || !type) {
      navigate('/signup');
    }
  }, [identifier, type, loginMethod, navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (type !== 'email' && formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (type !== 'mobile' && formData.mobile && !validateMobile(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    if (!consents.blockchainConsent) {
      newErrors.consents = 'Blockchain consent is required for using MicroMerit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsents(prev => ({ ...prev, [name]: checked }));
    if (errors.consents) {
      setErrors(prev => ({ ...prev, consents: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePic: 'File size must be less than 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
        setFormData(prev => ({ ...prev, profilePicUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Tell us a bit about yourself to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-blue-chill-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-blue-chill-600" />
                  )}
                </div>
                <label
                  htmlFor="profilePic"
                  className="absolute bottom-0 right-0 bg-blue-chill-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-chill-700 transition shadow-lg"
                >
                  <Upload className="w-5 h-5" />
                  <input
                    type="file"
                    id="profilePic"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {errors.profilePic && (
              <p className="text-sm text-red-600 text-center">{errors.profilePic}</p>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address {type === 'email' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={type === 'email'}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent ${
                      type === 'email' ? 'bg-gray-100' : ''
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number {type === 'mobile' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled={type === 'mobile'}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.mobile ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent ${
                      type === 'mobile' ? 'bg-gray-100' : ''
                    }`}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Consent & Permissions</h3>
              <div className="space-y-4">
                {loginMethod === 'digilocker' && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="digilockerConsent"
                        name="digilockerConsent"
                        checked={consents.digilockerConsent}
                        onChange={handleConsentChange}
                        className="h-5 w-5 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                      />
                    </div>
                    <label htmlFor="digilockerConsent" className="ml-3 text-sm text-gray-700">
                      I consent to MicroMerit fetching my documents from DigiLocker
                    </label>
                  </div>
                )}

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="autoLinkConsent"
                      name="autoLinkConsent"
                      checked={consents.autoLinkConsent}
                      onChange={handleConsentChange}
                      className="h-5 w-5 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                    />
                  </div>
                  <label htmlFor="autoLinkConsent" className="ml-3 text-sm text-gray-700">
                    I consent to auto-linking credentials issued to my email/phone number
                  </label>
                </div>

                <div className="flex items-start bg-blue-chill-50 p-4 rounded-lg">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="blockchainConsent"
                      name="blockchainConsent"
                      checked={consents.blockchainConsent}
                      onChange={handleConsentChange}
                      className="h-5 w-5 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                      required
                    />
                  </div>
                  <label htmlFor="blockchainConsent" className="ml-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      I consent to storing and verifying my certificates on blockchain
                    </span>
                    <span className="text-red-500"> *</span>
                    <p className="text-gray-600 mt-1">
                      This is mandatory for using MicroMerit as per legal requirements
                    </p>
                  </label>
                </div>
              </div>
              {errors.consents && (
                <p className="mt-2 text-sm text-red-600">{errors.consents}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-green-900">Your data is secure</p>
                <p>We use industry-standard encryption and blockchain technology to protect your credentials.</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Complete Setup
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileBuilder;
