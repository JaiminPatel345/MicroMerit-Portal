import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employerApi } from '../../services/authServices';
import logo_1 from '../../assets/logo_1.png';
import { ArrowRight, ArrowLeft, Loader, UploadCloud, Phone, Check } from 'lucide-react';
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
        pan_number: '',
    });
    const [step, setStep] = useState(1); // 1: Register, 2: OTP, 3: Verifying PAN, 4: Dashboard Redirect
    // OTP State and Logic
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 2) {
            inputRefs[0].current?.focus();
            const interval = setInterval(() => {
                setTimer(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Mock PAN Verification Effect (Step 3)
    useEffect(() => {
        if (step === 3) {
            const timer = setTimeout(() => {
                // After 5s, navigate to dashboard
                // In real implementation, we would already have the token from verifyEmail steps
                navigate('/employer/dashboard');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [step, navigate]);

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
        // Auto-capitalize PAN
        if (e.target.name === 'pan_number') {
            setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic PAN Pattern Check
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
            setError('Please enter a valid PAN Number (e.g., ABCDE1234F)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Send JSON directly, no document upload needed
            const res = await employerApi.register(formData);
            if (res.data.success) {
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
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
            
            // Assuming response now contains tokens for auto-login
            if (res.data.tokens) {
                 localStorage.setItem('accessToken', res.data.tokens.accessToken);
                 localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
                 localStorage.setItem('role', 'employer'); // Just in case layout needs it
            }

            setStep(3); // Go to Mock PAN Verification Loader

        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-chill-200 to-white flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-blue-chill-50 rounded-full flex items-center justify-center relative">
                             <div className="absolute inset-0 rounded-full border-4 border-blue-chill-100 border-t-blue-chill-600 animate-spin"></div>
                             <Check size={28} className="text-blue-chill-600 opacity-50" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying PAN Details</h2>
                    <p className="text-gray-600 mb-2">
                        Verifying your business credentials against the official database...
                    </p>
                    <p className="text-sm text-gray-400">Do not refresh or close this window.</p>
                </div>
            </div>
        )
    }

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
                            <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
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

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}

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
                        <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Partner Registration</h1>
                    <p className="text-gray-500 mt-2 font-medium">Join as an Employer to verify credentials</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
                        {error}
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

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Corporate PAN Card Number</label>
                         <div className="relative">
                            <input 
                                name="pan_number" 
                                required 
                                maxLength={10}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none uppercase font-mono tracking-wider" 
                                placeholder="ABCDE1234F"
                                value={formData.pan_number || ''}
                                onChange={handleChange}
                            />
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <span className="text-xs font-bold border border-gray-400 rounded px-1">PAN</span>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 mt-1">Found on your valid Permanent Account Number card.</p>
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
