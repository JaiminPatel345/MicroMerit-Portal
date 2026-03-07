import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginLearner, oauthGoogleLogin, oauthDigilockerLogin } from '../../services/authServices';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';
import { APP_NAME } from '../../config/appConfig';
import { useDispatch } from 'react-redux';
import logo_1 from '../../assets/logo_1.png';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setErrors({ submit: decodeURIComponent(urlError) });
    }
  }, [searchParams]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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

    setIsLoading(true);
    try {
      const response = await loginLearner.login({ email: formData.email, password: formData.password });
      if (response?.data?.success === true) {
        dispatch(learnerLoginSuccess({
          learner: response.data.data.learner,
          accessToken: response.data.data.tokens.accessToken,
          refreshToken: response.data.data.tokens.refreshToken
        }));
        navigate('/dashboard');
      }
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false);
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

  const handleDigiLockerLogin = async () => {
    try {
      console.log('DigiLocker login - Starting OAuth flow');
      const response = await oauthDigilockerLogin.oauth();
      console.log('DigiLocker login - OAuth response:', response);
      if (response.data.success) {
        console.log('DigiLocker login - Redirecting to:', response.data.data.authUrl);
        window.location.href = response.data.data.authUrl;
      } else {
        console.log('DigiLocker login - Response not successful:', response);
      }
    } catch (error) {
      console.error("DigiLocker login failed", error);
      setErrors({ submit: 'Failed to initiate DigiLocker login. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-2">
            <img src={logo_1} alt={APP_NAME} className="h-20 w-auto mx-auto" />
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">{`Sign in to your ${APP_NAME} account`}</p>
        </div>

        {errors.submit && (
          <p className="text-red-600 text-center mb-4 font-medium">
            {errors.submit}
          </p>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Log In'
              )}
            </button>
          </form>


          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-chill-600 hover:text-blue-chill-700 font-semibold">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
