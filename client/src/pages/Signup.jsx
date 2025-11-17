import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, Chrome } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

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

    if (loginMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (loginMethod === 'mobile') {
      if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!validateMobile(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (loginMethod === 'mobile') {
      navigate('/verify-otp', {
        state: {
          identifier: formData.mobile,
          type: 'mobile',
          verificationType: 'signup'
        }
      });
    } else if (loginMethod === 'email') {
      navigate('/verify-otp', {
        state: {
          identifier: formData.email,
          type: 'email',
          password: formData.password,
          verificationType: 'signup'
        }
      });
    }
  };

  const handleGoogleSignup = () => {
    navigate('/profile-builder', {
      state: {
        loginMethod: 'google'
      }
    });
  };

  const handleDigiLockerSignup = () => {
    navigate('/profile-builder', {
      state: {
        loginMethod: 'digilocker'
      }
    });
  };

  if (!loginMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Choose your preferred signup method</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setLoginMethod('email')}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-chill-500 hover:bg-blue-chill-50 rounded-xl p-6 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-chill-100 p-3 rounded-lg group-hover:bg-blue-chill-200 transition">
                  <Mail className="w-6 h-6 text-blue-chill-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Email & Password</p>
                  <p className="text-sm text-gray-500">Sign up with your email</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setLoginMethod('mobile')}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-chill-500 hover:bg-blue-chill-50 rounded-xl p-6 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-chill-100 p-3 rounded-lg group-hover:bg-blue-chill-200 transition">
                  <Phone className="w-6 h-6 text-blue-chill-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Mobile Number</p>
                  <p className="text-sm text-gray-500">Sign up with OTP verification</p>
                </div>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="w-full bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-xl p-4 transition flex items-center justify-center space-x-3 group"
            >
              <Chrome className="w-5 h-5 text-gray-700 group-hover:text-red-600" />
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Continue with Google</span>
            </button>

            <button
              onClick={handleDigiLockerSignup}
              className="w-full bg-blue-chill-600 hover:bg-blue-chill-700 text-white rounded-xl p-4 transition flex items-center justify-center space-x-3 font-semibold"
            >
              <Lock className="w-5 h-5" />
              <span>Continue with DigiLocker</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-blue-chill-600 hover:text-blue-chill-700 font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => setLoginMethod(null)}
            className="text-blue-chill-600 hover:text-blue-chill-700 font-medium mb-4 inline-flex items-center"
          >
            <span className="mr-2">←</span> Back
          </button>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {loginMethod === 'email' ? 'Sign Up with Email' : 'Sign Up with Mobile'}
          </h2>
          <p className="text-gray-600">Create your MicroMerit account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginMethod === 'email' && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
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
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="Re-enter password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {loginMethod === 'mobile' && (
              <div>
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number
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
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.mobile ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              {loginMethod === 'mobile' ? 'Send OTP' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
