import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { employerLoginSuccess } from '../../store/authEmployerSlice';
import { employerApi } from '../../services/authServices';
import logo_1 from '../../assets/logo_1.png';
import { APP_NAME } from '../../config/appConfig';
import { ArrowRight, ArrowLeft, Loader, UploadCloud, Phone } from 'lucide-react';
import { useRef } from 'react';
const EmployerSignup = () => {
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        password: '',
        phone: '',
        company_website: '',
        company_address: '',
    });
    const [step, setStep] = useState(1); // 1: Register, 2: OTP, 3: Dashboard Redirect
    // OTP State and Logic
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (step === 2) {
            inputRefs[0].current?.focus();
            const interval = setInterval(() => {
                setTimer(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step]);

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) inputRefs[index + 1].current?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;
        const newOtp = [...otp];
        pastedData.split('').forEach((char, index) => { if (index < 6) newOtp[index] = char; });
        setOtp(newOtp);
        inputRefs[Math.min(pastedData.length, 5)].current?.focus();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Send JSON directly, no document upload needed
            const res = await employerApi.register(formData);
            if (res.data.success) {
                setStep(2);
            }
        } catch (err) {
            // Extract user-friendly error message
            let errorMessage = 'Registration failed. Please try again.';

            if (err.response?.data?.message) {
                // Use the backend's user-friendly message
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter a complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await employerApi.verifyEmail({ email: formData.email, otp: otpValue });

            // Extract tokens from the response
            if (res.data.success) {
                const { tokens, employer } = res.data.data;

                if (tokens) {
                    dispatch(employerLoginSuccess({
                        employer: employer,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken
                    }));
                    localStorage.setItem('token', tokens.accessToken);
                    localStorage.setItem('userRole', 'employer');
                }

                navigate('/employer/dashboard');
            }
        } catch (err) {
            // Extract user-friendly error message
            let errorMessage = 'Verification failed. Please try again.';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                    <button
                        onClick={() => setStep(1)}
                        className="flex items-center text-gray-600 hover:text-blue-chill-600 mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>

                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                            <img src={logo_1} alt={APP_NAME} className="h-20 w-auto mx-auto" />
                        </Link>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-chill-100 rounded-full mb-4">
                            <Phone className="w-8 h-8 text-blue-chill-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                        <p className="text-gray-600">
                            Enter the 6-digit code sent to<br />
                            <span className="font-semibold text-gray-900">{formData.email}</span>
                        </p>
                    </div>


                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    )}


                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="flex justify-center space-x-3 mb-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-chill-500 focus:ring-2 focus:ring-blue-chill-200 focus:outline-none transition"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-chill-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-chill-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : "Verify & Continue"}
                        </button>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            {timer > 0 ? (
                                <span>Resend OTP in {timer}s</span>
                            ) : (
                                <button type="button" className="text-blue-chill-600 hover:text-blue-chill-700 font-medium">Resend OTP</button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center p-4 py-10">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <img src={logo_1} alt={APP_NAME} className="h-20 w-auto mx-auto" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employee Registration</h1>
                    <p className="text-gray-500 mt-2 font-medium">Join as an Employer to verify credentials</p>
                </div>


                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}


                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                        <input name="contact_person" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" onChange={handleChange} placeholder="Your Full Name" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input name="company_name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input name="email" type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input name="phone" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input name="password" type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                        <textarea name="company_address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" rows="2" onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-chill-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-chill-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18} /></>}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/employer/login" className="text-blue-chill-600 font-medium hover:underline">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployerSignup;
