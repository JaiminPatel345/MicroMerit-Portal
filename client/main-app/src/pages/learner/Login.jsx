import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, Chrome, Eye, EyeOff } from 'lucide-react';
import { loginLearner, oauthGoogleLogin } from '../../services/authServices';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';
import { useDispatch } from 'react-redux';
const Login = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

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
    }

    if (loginMethod === 'mobile') {
      if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!validateMobile(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
    try {



      if (loginMethod === 'mobile') {

        const response = await loginLearner.login({ phone: formData.mobile, password: formData.password });
        if (response?.data?.success === true) {
          dispatch(learnerLoginSuccess({
            learner: response.data.data.learner,
            accessToken: response.data.data.tokens.accessToken,
            refreshToken: response.data.data.tokens.refreshToken
          }));
          navigate('/dashboard');
        }
      } else if (loginMethod === 'email') {

        const response = await loginLearner.login({ email: formData.email, password: formData.password });
        if (response?.data?.success === true) {
          dispatch(learnerLoginSuccess({
            learner: response.data.data.learner,
            accessToken: response.data.data.tokens.accessToken,
            refreshToken: response.data.data.tokens.refreshToken
          }));
          navigate('/dashboard');
        }
      }

    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Login failed. Please try again.' })
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('Google login - Starting OAuth flow');
      const response = await oauthGoogleLogin.oauth();
      console.log('Google login - OAuth response:', response);
      if (response.data.success) {
        console.log('Google login - Redirecting to:', response.data.data.authUrl);
        window.location.href = response.data.data.authUrl;
      } else {
        console.log('Google login - Response not successful:', response);
      }
    } catch (error) {
      console.error("Google login failed", error);
      console.error("Error response:", error?.response);
    }
  };

  const handleDigiLockerLogin = () => {
    navigate('/');
  };

  if (!loginMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your MicroMerit account</p>
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
                  <p className="text-sm text-gray-500">Login with your email</p>
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
                  <p className="text-sm text-gray-500">Login with your mobile number</p>
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
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-xl p-4 transition flex items-center justify-center space-x-3 group"
            >
              <Chrome className="w-5 h-5 text-gray-700 group-hover:text-red-600" />
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Continue with Google</span>
            </button>

            <button
              onClick={handleDigiLockerLogin}
              className="w-full bg-blue-chill-600 hover:bg-blue-chill-700 text-white rounded-xl p-4 transition flex items-center justify-center space-x-3 font-semibold"
            >
              <Lock className="w-5 h-5" />
              <span>Continue with DigiLocker</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-chill-600 hover:text-blue-chill-700 font-semibold">
              Sign up
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
            {loginMethod === 'email' ? 'Login with Email' : 'Login with Mobile'}
          </h2>
          <p className="text-gray-600">Enter your credentials to continue</p>
        </div>

        {errors.submit && (
          <p className="text-red-600  mb-4 font-medium">
            {errors.submit}
          </p>
        )}

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
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
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
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <a href="/forgot-password" className="text-sm text-blue-chill-600 hover:text-blue-chill-700 font-medium">
                    Forgot password?
                  </a>
                </div>
              </>
            )}

            {loginMethod === 'mobile' && (
              <>
                {/* Mobile Number */}
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
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                    />
                  </div>
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-chill-600 focus:ring-blue-chill-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <a href="/forgot-password" className="text-sm text-blue-chill-600 hover:text-blue-chill-700 font-medium">
                    Forgot password?
                  </a>
                </div>
              </>
            )}


            <button
              type="submit"
              className="w-full bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              {'LogIn'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
