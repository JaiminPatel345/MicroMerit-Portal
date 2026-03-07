import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { oauthGoogleLogin, signUpLeaner } from '../../services/authServices';
import logo_1 from '../../assets/logo_1.png';
import { APP_NAME } from '../../config/appConfig';


const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await signUpLeaner.start({ email: formData.email });
      if (response?.data?.success === true) {
        navigate('/verify-otp', {
          state: {
            identifier: formData.email,
            type: 'email',
            verificationType: 'signup',
            sessionId: response.data.data.sessionId
          }
        });
      }
    } catch (err) {
      setErrors({ email: err.response?.data?.message || 'Email signup failed. Please try again.' });
      console.error('Error during email signup:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      console.log('Google signup - Starting OAuth flow');
      const response = await oauthGoogleLogin.oauth();
      console.log('Google signup - OAuth response:', response);
      if (response?.data?.success) {
        console.log('Google signup - Redirecting to:', response.data.data.authUrl);
        window.location.href = response.data.data.authUrl;
      } else {
        console.log('Google signup - Response not successful:', response);
      }
    } catch (err) {
      setErrors({ submit: 'Google OAuth signup failed. Please try again.' });
      console.error('Google OAuth signup failed:', err);
      console.error('Error response:', err?.response);
    }
  };

  const handleDigiLockerSignup = () => {
    navigate('/profile-builder', {
      state: {
        loginMethod: 'digilocker'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-2">
            <img src={logo_1} alt={APP_NAME} className="h-30 w-auto mx-auto" />
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">{`Sign up to get started with ${APP_NAME}`}</p>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-chill-600 text-white py-3 px-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Continue'
              )}
            </button>
          </form>


          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-blue-chill-600 hover:text-blue-chill-700 font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
