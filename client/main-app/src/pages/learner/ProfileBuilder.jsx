import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Upload, CheckCircle, Lock } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';
import { completeProfile } from '../../services/authServices';
import { setNotification } from '../../utils/notification';

const ProfileBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { identifier, type, loginMethod, tempToken } = location.state || {};

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });

  const [consents, setConsents] = useState({
    digilockerConsent: loginMethod === 'digilocker',
    autoLinkConsent: false,
    blockchainConsent: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  useEffect(() => {
    if (loginMethod === 'google' || loginMethod === 'digilocker') {
      return;
    }
    if (!identifier || !type) {
      setNotification('Session expired or invalid access. Please sign up again.', 'error');
      navigate('/signup');
    }
  }, [identifier, type, loginMethod, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) newErrors.dateOfBirth = 'You must be at least 13 years old';
    }

    // ⬇️ Password validation added
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!consents.blockchainConsent) {
      newErrors.consents = 'Blockchain consent is required for using MicroMerit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsents((prev) => ({ ...prev, [name]: checked }));
    if (errors.consents) setErrors((prev) => ({ ...prev, consents: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profilePic: 'File size must be less than 5MB' }));
      return;
    }

    // Store the actual file for upload
    setProfilePhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Form data:', formData);
    console.log('Temp token:', tempToken);

    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    console.log('Validation passed, preparing request...');

    try {
      setLoading(true);

      // Create FormData for multipart/form-data submission (binary file upload)
      const submitData = new FormData();
      submitData.append('name', formData.fullName);

      // Password is optional
      if (formData.password && formData.password.trim()) {
        submitData.append('password', formData.password.trim());
      }

      // Add optional fields only if they have values
      // Backend expects 'dob' as ISO datetime string
      if (formData.dateOfBirth) {
        const dobDate = new Date(formData.dateOfBirth);
        submitData.append('dob', dobDate.toISOString());
      }

      // Map frontend gender values to backend enum
      if (formData.gender) {
        const genderMap = {
          'male': 'Male',
          'female': 'Female',
          'other': 'Others',
          'prefer_not_to_say': 'Not to disclose'
        };
        submitData.append('gender', genderMap[formData.gender] || formData.gender);
      }

      // Append the actual File object (binary data, not base64)
      if (profilePhotoFile) {
        submitData.append('profilePhoto', profilePhotoFile);
        console.log('Profile photo attached:', profilePhotoFile.name, profilePhotoFile.size, 'bytes');
      }

      // Log FormData entries
      console.log('FormData contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      console.log('Sending request to backend...');
      const response = await completeProfile.complete(submitData, {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });

      console.log('Response received:', response);

      if (response?.data?.success === true) {
        console.log('Registration successful, redirecting to dashboard...');
        dispatch(learnerLoginSuccess({
          learner: response.data.data.learner,
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken
        }));
        navigate('/dashboard');
      } else {
        console.log('Unexpected response format:', response);
      }

    } catch (err) {
      console.error('Profile completion error:', err);
      console.error('Error response:', err?.response);
      console.error('Error data:', err?.response?.data);
      setErrors((prev) => ({ ...prev, submit: err?.response?.data?.message || 'Failed to complete profile. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Tell us a bit about yourself to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {errors.submit && (
            <p className="text-red-600  mb-4 font-medium">
              {errors.submit}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
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
                  <input type="file" id="profilePic" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Errors for profile pic */}
            {errors.profilePic && <p className="text-sm text-red-600 text-center">{errors.profilePic}</p>}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>


              {/* DOB */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500`}
                  />
                </div>
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-chill-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500`}
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500`}
                    placeholder="Re-enter password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Consent Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Consent & Permissions</h3>
              <div className="space-y-4">
                {loginMethod === 'digilocker' && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="digilockerConsent"
                        checked={consents.digilockerConsent}
                        onChange={handleConsentChange}
                        className="h-5 w-5 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                      />
                    </div>
                    <label className="ml-3 text-sm text-gray-700">
                      I consent to MicroMerit fetching my documents from DigiLocker
                    </label>
                  </div>
                )}

                <div className="flex items-start  p-4 rounded-lg">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="blockchainConsent"
                      checked={consents.blockchainConsent}
                      onChange={handleConsentChange}
                      className="h-5 w-5 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                      required
                    />
                  </div>
                  <label className="ml-3 text-sm">
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

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-green-900">Your data is secure</p>
                <p>We use industry-standard encryption and blockchain technology to protect your credentials.</p>
              </div>
            </div>

            {/* Buttons */}
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
                disabled={loading}
                className="flex-1 bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileBuilder;
