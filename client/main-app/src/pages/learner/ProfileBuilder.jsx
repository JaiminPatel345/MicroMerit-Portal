import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Upload, CheckCircle, Lock, Check, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';
import { completeProfile } from '../../services/authServices';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
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

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.password, formData.confirmPassword]);

  const checkPasswordCriteria = (password) => {
    setPasswordCriteria({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    });
  };

  useEffect(() => {
    if (loginMethod === 'google' || loginMethod === 'digilocker') {
      return;
    }
    if (!identifier || !type) {
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
    } else {
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Password must contain an uppercase letter';
      if (!/[a-z]/.test(formData.password)) newErrors.password = 'Password must contain a lowercase letter';
      if (!/[0-9]/.test(formData.password)) newErrors.password = 'Password must contain a number';
      if (!/[^A-Za-z0-9]/.test(formData.password)) newErrors.password = 'Password must contain a special character';
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

    if (name === 'password') {
      checkPasswordCriteria(value);
    }

    if (name === 'password' || name === 'confirmPassword') {
      setConfirmPasswordError('');
    }
  };

  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsents((prev) => ({ ...prev, [name]: checked }));
    if (errors.consents) setErrors((prev) => ({ ...prev, consents: '' }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
    if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
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
              {/* DOB */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                    onChange={handleDateChange}
                    dateFormat={['dd/MM/yyyy', 'ddMMyyyy', 'dd-MM-yyyy']}
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    placeholderText="dd/mm/yyyy"
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none`}
                    wrapperClassName="w-full"
                    maxDate={new Date()}
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
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500`}
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}

                {/* Password Criteria Checklist */}
                {passwordFocused && (
                  <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-xs transform transition-all duration-200 ease-out">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password Requirements</p>
                    <ul className="space-y-2 text-sm">
                      {[
                        { met: passwordCriteria.minLength, text: 'At least 6 characters' },
                        { met: passwordCriteria.hasUpper, text: 'One uppercase letter' },
                        { met: passwordCriteria.hasLower, text: 'One lowercase letter' },
                        { met: passwordCriteria.hasNumber, text: 'One number' },
                        { met: passwordCriteria.hasSpecial, text: 'One special character' }
                      ].map((item, index) => (
                        <li key={index} className={`flex items-center ${item.met ? 'text-green-600' : 'text-gray-500'}`}>
                          {item.met ? (
                            <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full flex-shrink-0" />
                          )}
                          <span className={item.met ? 'font-medium' : ''}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Little arrow pointing up */}
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                  </div>
                )}
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
                    className={`block w-full pl-10 pr-3 py-3 border ${confirmPasswordError || errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-chill-500`}
                    placeholder="Re-enter password"
                  />
                </div>
                {(confirmPasswordError || errors.confirmPassword) && (
                  <p className="mt-1 text-sm text-red-600">{confirmPasswordError || errors.confirmPassword}</p>
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
