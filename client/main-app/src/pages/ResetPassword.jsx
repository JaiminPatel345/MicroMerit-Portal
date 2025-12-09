import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { forgotPasswordLearner, forgotPasswordEmployer, forgotPasswordIssuer } from '../services/authServices';
import logo_1 from '../assets/logo_1.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, otp, type } = location.state || {};
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (!sessionId || !otp || !type) {
      navigate('/login');
    }
  }, [sessionId, otp, type, navigate]);

  useEffect(() => {
    const password = formData.newPassword;
    setPasswordStrength({
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [formData.newPassword]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (!Object.values(passwordStrength).every(v => v)) {
      newErrors.newPassword = 'Password does not meet all requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      let response;
      const payload = { sessionId, otp, newPassword: formData.newPassword };
      
      if (type === 'employer') {
        response = await forgotPasswordEmployer.reset(payload);
      } else if (type === 'issuer') {
        response = await forgotPasswordIssuer.reset(payload);
      } else {
        response = await forgotPasswordLearner.reset(payload);
      }

      if (response?.data?.success === true) {
        // Redirect to appropriate login page
        const loginPath = type === 'employer' ? '/employer/login' : 
                          type === 'issuer' ? '/issuer/login' : '/login';
        navigate(loginPath, { 
          state: { message: 'Password reset successfully! Please log in with your new password.' }
        });
      }
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Password reset failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      <span className={met ? 'text-green-700' : 'text-gray-600'}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-2">
            <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">Create a new password for your account</p>
        </div>

        {errors.submit && (
          <p className="text-red-600 text-center mb-4 font-medium">
            {errors.submit}
          </p>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                  placeholder="Enter new password"
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
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">Password must contain:</p>
              <PasswordRequirement met={passwordStrength.hasMinLength} text="At least 6 characters" />
              <PasswordRequirement met={passwordStrength.hasUpperCase} text="One uppercase letter" />
              <PasswordRequirement met={passwordStrength.hasLowerCase} text="One lowercase letter" />
              <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
              <PasswordRequirement met={passwordStrength.hasSpecialChar} text="One special character" />
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 
                    formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'border-green-500' :
                    'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              {/* Real-time password match indicator */}
              {formData.confirmPassword && !errors.confirmPassword && (
                <div className="mt-2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Passwords match!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
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
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
