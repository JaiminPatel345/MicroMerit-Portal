import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employerApi } from '../../services/authServices';
import logo_1 from '../../assets/logo_1.png';
import { ArrowRight, ArrowLeft, Loader, UploadCloud, Phone } from 'lucide-react';
import { useRef } from 'react';
const EmployerSignup = () => {
    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        password: '',
        phone: '',
        company_website: '',
        company_address: '',
    });
    const [document, setDocument] = useState(null);
    const [step, setStep] = useState(1); // 1: Register, 2: OTP, 3: Success
    // OTP State and Logic
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleFileChange = (e) => {
        setDocument(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (document) data.append('document', document);

            const res = await employerApi.register(data);
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
            await employerApi.verifyEmail({ email: formData.email, otp: otpValue });
            setStep(3);
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
                    <Link to="/" className="inline-block mb-4">
                        <img src={logo_1} alt="MicroMerit" className="h-20 w-auto mx-auto" />
                    </Link>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <ArrowRight size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                    <p className="text-gray-600 mb-8">
                        Your email has been verified! Your account is now under review by our administrators.
                        You will be notified once approved.
                    </p>
                    <Link to="/employer/login" className="block w-full bg-blue-chill-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-chill-700">
                        Return to Login
                    </Link>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                        <input name="company_website" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" placeholder="https://..." onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                        <textarea name="company_address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" rows="2" onChange={handleChange} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof Document (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <UploadCloud size={24} />
                                <span className="text-sm">{document ? document.name : "Upload Registration Proof / GST / PAN"}</span>
                            </div>
                        </div>
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
