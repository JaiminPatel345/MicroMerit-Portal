import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employerApi } from '../../services/authServices';
import { useDispatch } from 'react-redux';
import logo_1 from '../../assets/logo_1.png';
import { employerLoginSuccess } from '../../store/authEmployerSlice';
import { ArrowRight, Loader } from 'lucide-react';

// Simplified slice logic would be needed, or using local storage for MVP if slice not extended yet
// Assuming we store token in localStorage or use existing auth slice if generic enough.
// For now, manual token handling or existing auth actions if applicable.

const EmployerLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await employerApi.login(formData);
            if (res.data.success) {
                const { tokens, employer } = res.data.data;

                // Dispatch to Redux store
                dispatch(employerLoginSuccess({
                    employer: employer,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                }));

                // Also keep localStorage for redundancy if needed, but Redux persist handles main state
                localStorage.setItem('token', tokens.accessToken);
                localStorage.setItem('userRole', 'employer');

                navigate('/employer/dashboard');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);

            // If email not verified, we could redirect to a verification page if we had one separate.
            // For now just error is enough as user knows from message.
            if (msg.includes('verified')) {
                // Optionally offer to resend OTP or link to verify page if we built it separately
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employer Portal</h1>
                    <p className="text-gray-500 mt-2 font-medium">Access verification tools and candidate search</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition-colors"
                            placeholder="company@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition-colors"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-chill-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-chill-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        New Company? <Link to="/employer/signup" className="text-blue-chill-600 font-medium hover:underline">Register Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployerLogin;
