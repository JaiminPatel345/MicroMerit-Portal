import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { learnerApi } from '../../services/authServices';
import { learnerUpateProfile } from '../../store/authLearnerSlice';
import { setNotification } from '../../utils/notification';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
    User, Calendar, Upload, ArrowLeft, Mail, Phone,
    Plus, Trash2, Check, X, Loader2, Shield
} from 'lucide-react';
import api from '../../services/axiosInstance';

export default function EditProfile() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const learner = useSelector(state => state.authLearner.learner);

    // Basic Info State
    const [formData, setFormData] = useState({
        name: learner?.name || '',
        gender: learner?.gender || '',
        dob: learner?.dob ? new Date(learner.dob) : null,
    });

    const [profilePreview, setProfilePreview] = useState(learner?.profileUrl || '');
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Contact Verification State
    const [contactVerification, setContactVerification] = useState({
        type: null, // 'primary-email', 'primary-phone', 'email'
        value: '',
        sessionId: null,
        otp: '',
        step: 'input', // 'input', 'otp', 'verified'
        loading: false,
        error: ''
    });

    // Secondary Emails State
    const [otherEmails, setOtherEmails] = useState(learner?.other_emails || []);
    const [showAddEmail, setShowAddEmail] = useState(false);

    const hasEmail = !!learner?.email;
    const hasPhone = !!learner?.phone;

    // Handle basic form changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, dob: date }));
        if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, profilePhoto: 'File size must be less than 5MB' }));
            return;
        }

        setProfilePhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Update basic profile info
    const handleUpdateBasicInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const submitData = new FormData();

            if (formData.name.trim()) submitData.append('name', formData.name.trim());
            if (formData.gender) submitData.append('gender', formData.gender);
            if (formData.dob) submitData.append('dob', formData.dob.toISOString());
            if (profilePhotoFile) submitData.append('profilePhoto', profilePhotoFile);

            const res = await learnerApi.updateProfile(submitData);

            if (res.data?.success) {
                dispatch(learnerUpateProfile(res.data.data));
                setNotification('Profile updated successfully', 'success');
                setProfilePhotoFile(null);
            }
        } catch (err) {
            console.error('Profile update error:', err?.response?.data);

            let errorMessage = err?.response?.data?.message || 'Update failed';

            if (err?.response?.data?.error) {
                try {
                    const validationErrors = JSON.parse(err.response.data.error);
                    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
                        const specificErrors = validationErrors.map(e => e.message).join(', ');
                        errorMessage = `${errorMessage}: ${specificErrors}`;
                    }
                } catch (parseErr) {
                    console.error('Failed to parse validation errors:', parseErr);
                }
            }

            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Request OTP for contact verification
    const handleRequestOTP = async (type) => {
        setContactVerification(prev => ({ ...prev, loading: true, error: '' }));

        try {
            // Client-side validation
            if (type === 'primary-phone') {
                const value = contactVerification.value.trim();

                // Remove any spaces or dashes
                const cleanedPhone = value.replace(/[\s-]/g, '');

                // Check for valid phone format
                // Pattern: optional +, optional 1-3 digit country code, then exactly 10 digits starting with 6-9
                const phoneRegex = /^(\+?\d{1,3})?[6-9]\d{9}$/;

                if (!phoneRegex.test(cleanedPhone)) {
                    setContactVerification(prev => ({
                        ...prev,
                        error: 'Invalid phone number. Must be 10 digits starting with 6-9. Format: 9876543210 or +919876543210',
                        loading: false
                    }));
                    return;
                }

                // Extract just the 10-digit part (last 10 digits)
                const last10Digits = cleanedPhone.slice(-10);

                // Verify it's exactly 10 digits and starts with 6-9
                if (last10Digits.length !== 10 || !/^[6-9]/.test(last10Digits)) {
                    setContactVerification(prev => ({
                        ...prev,
                        error: 'Phone number must be exactly 10 digits starting with 6-9',
                        loading: false
                    }));
                    return;
                }

            } else if (type === 'email' || type === 'primary-email') {
                const value = contactVerification.value.trim();

                // Strict email validation
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

                if (!emailRegex.test(value)) {
                    setContactVerification(prev => ({
                        ...prev,
                        error: 'Invalid email address format',
                        loading: false
                    }));
                    return;
                }

                // Additional checks
                if (value.length < 5 || value.length > 254) {
                    setContactVerification(prev => ({
                        ...prev,
                        error: 'Email address must be between 5 and 254 characters',
                        loading: false
                    }));
                    return;
                }
            }

            const payload = { type };

            if (type === 'primary-email' || type === 'email') {
                payload.email = contactVerification.value.trim();
            } else if (type === 'primary-phone') {
                // Send cleaned phone number
                payload.phone = contactVerification.value.trim().replace(/[\s-]/g, '');
            }

            const res = await api.post('/learner/contacts/request', payload);

            if (res.data?.success) {
                setContactVerification(prev => ({
                    ...prev,
                    sessionId: res.data.data.sessionId,
                    step: 'otp',
                    loading: false
                }));
                setNotification('OTP sent successfully', 'success');
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to send OTP';
            setContactVerification(prev => ({
                ...prev,
                error: errorMessage,
                loading: false
            }));
        }
    };
    // Verify OTP
    const handleVerifyOTP = async () => {
        setContactVerification(prev => ({ ...prev, loading: true, error: '' }));

        try {
            const payload = {
                type: contactVerification.type,
                sessionId: contactVerification.sessionId,
                otp: contactVerification.otp
            };

            const res = await api.post('/learner/contacts/verify', payload);

            if (res.data?.success) {
                setNotification(res.data.message, 'success');

                // Update local state based on type
                if (contactVerification.type === 'email') {
                    setOtherEmails(prev => [...prev, contactVerification.value]);
                }

                // Reset verification state
                setContactVerification({
                    type: null,
                    value: '',
                    sessionId: null,
                    otp: '',
                    step: 'input',
                    loading: false,
                    error: ''
                });

                setShowAddEmail(false);

                // Refresh profile
                const profileRes = await learnerApi.getProfile();
                if (profileRes.data?.success) {
                    dispatch(learnerUpateProfile(profileRes.data.data));
                }
            }
        } catch (err) {
            setContactVerification(prev => ({
                ...prev,
                error: err?.response?.data?.message || 'Invalid OTP',
                loading: false
            }));
        }
    };

    // Start adding primary contact
    const startAddingPrimaryContact = (type) => {
        setContactVerification({
            type,
            value: '',
            sessionId: null,
            otp: '',
            step: 'input',
            loading: false,
            error: ''
        });
    };

    // Start adding secondary email
    const startAddingSecondaryEmail = () => {
        setShowAddEmail(true);
        setContactVerification({
            type: 'email',
            value: '',
            sessionId: null,
            otp: '',
            step: 'input',
            loading: false,
            error: ''
        });
    };

    // Cancel verification
    const cancelVerification = () => {
        setContactVerification({
            type: null,
            value: '',
            sessionId: null,
            otp: '',
            step: 'input',
            loading: false,
            error: ''
        });
        setShowAddEmail(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-chill-50 to-white py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-chill-600 hover:text-blue-chill-700 mb-4 transition"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Profile</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                    <p className="text-gray-600 mt-1">Update your personal information and contact details</p>
                </div>

                {/* Basic Information Card */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-chill-600" />
                        Basic Information
                    </h2>

                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleUpdateBasicInfo} className="space-y-6">
                        {/* Profile Photo */}
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-chill-100 shadow-lg">
                                    <img
                                        src={profilePreview || `https://api.dicebear.com/7.x/thumbs/svg?seed=${learner?.email}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <label
                                    htmlFor="profilePhoto"
                                    className="absolute bottom-0 right-0 bg-blue-chill-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-chill-700 transition shadow-lg"
                                >
                                    <Upload size={18} />
                                    <input
                                        type="file"
                                        id="profilePhoto"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        {errors.profilePhoto && <p className="text-sm text-red-600 text-center">{errors.profilePhoto}</p>}

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent outline-none"
                                placeholder="Enter your full name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <DatePicker
                                        selected={formData.dob}
                                        onChange={handleDateChange}
                                        dateFormat={['dd/MM/yyyy', 'ddMMyyyy', 'dd-MM-yyyy']}
                                        showYearDropdown
                                        scrollableYearDropdown
                                        yearDropdownItemNumber={100}
                                        placeholderText="dd/mm/yyyy"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none"
                                        wrapperClassName="w-full"
                                        maxDate={new Date()}
                                    />
                                </div>
                                {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Other</option>
                                    <option value="Not to disclose">Prefer not to say</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Primary Contact Information */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-blue-chill-600" />
                        Primary Contact Information
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Your primary email and phone number are used for login and important notifications.
                    </p>

                    <div className="space-y-4">
                        {/* Primary Email */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail size={16} className="text-blue-chill-600" />
                                    Primary Email
                                </label>
                                {hasEmail && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                        Verified
                                    </span>
                                )}
                            </div>

                            {hasEmail ? (
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-900">{learner.email}</p>
                                    <p className="text-xs text-gray-500">Cannot be changed directly</p>
                                </div>
                            ) : (
                                <>
                                    {contactVerification.type === 'primary-email' ? (
                                        <div className="space-y-3">
                                            {contactVerification.step === 'input' && (
                                                <>
                                                    <input
                                                        type="email"
                                                        value={contactVerification.value}
                                                        onChange={(e) => setContactVerification(prev => ({ ...prev, value: e.target.value }))}
                                                        placeholder="Enter your email address"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none"
                                                    />
                                                    {contactVerification.error && (
                                                        <p className="text-sm text-red-600">{contactVerification.error}</p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRequestOTP('primary-email')}
                                                            disabled={!contactVerification.value || contactVerification.loading}
                                                            className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {contactVerification.loading ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                'Send OTP'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={cancelVerification}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {contactVerification.step === 'otp' && (
                                                <>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                                        OTP sent to {contactVerification.value}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={contactVerification.otp}
                                                        onChange={(e) => setContactVerification(prev => ({ ...prev, otp: e.target.value }))}
                                                        placeholder="Enter 6-digit OTP"
                                                        maxLength={6}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none text-center text-lg tracking-widest"
                                                    />
                                                    {contactVerification.error && (
                                                        <p className="text-sm text-red-600">{contactVerification.error}</p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleVerifyOTP}
                                                            disabled={contactVerification.otp.length !== 6 || contactVerification.loading}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {contactVerification.loading ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check size={16} />
                                                                    Verify
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setContactVerification(prev => ({ ...prev, step: 'input', otp: '', error: '' }))}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                                        >
                                                            Back
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startAddingPrimaryContact('primary-email')}
                                            className="flex items-center gap-2 text-blue-chill-600 hover:text-blue-chill-700 transition text-sm font-medium"
                                        >
                                            <Plus size={16} />
                                            Add Primary Email
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Primary Phone */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Phone size={16} className="text-blue-chill-600" />
                                    Primary Phone Number
                                </label>
                                {hasPhone && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                        Verified
                                    </span>
                                )}
                            </div>

                            {hasPhone ? (
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-900">{learner.phone}</p>
                                    <p className="text-xs text-gray-500">Cannot be changed directly</p>
                                </div>
                            ) : (
                                <>
                                    {contactVerification.type === 'primary-phone' ? (
                                        <div className="space-y-3">
                                            {contactVerification.step === 'input' && (
                                                <>
                                                    <input
                                                        type="tel"
                                                        value={contactVerification.value}
                                                        onChange={(e) => setContactVerification(prev => ({ ...prev, value: e.target.value }))}
                                                        placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none"
                                                    />
                                                    <p className="text-xs text-gray-500">Format: 10 digits starting with 6-9 (optional country code: +91)</p>
                                                    {contactVerification.error && (
                                                        <p className="text-sm text-red-600">{contactVerification.error}</p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRequestOTP('primary-phone')}
                                                            disabled={!contactVerification.value || contactVerification.loading}
                                                            className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {contactVerification.loading ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                'Send OTP'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={cancelVerification}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {contactVerification.step === 'otp' && (
                                                <>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                                        OTP sent to {contactVerification.value}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={contactVerification.otp}
                                                        onChange={(e) => setContactVerification(prev => ({ ...prev, otp: e.target.value }))}
                                                        placeholder="Enter 6-digit OTP"
                                                        maxLength={6}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none text-center text-lg tracking-widest"
                                                    />
                                                    {contactVerification.error && (
                                                        <p className="text-sm text-red-600">{contactVerification.error}</p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleVerifyOTP}
                                                            disabled={contactVerification.otp.length !== 6 || contactVerification.loading}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {contactVerification.loading ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check size={16} />
                                                                    Verify
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setContactVerification(prev => ({ ...prev, step: 'input', otp: '', error: '' }))}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                                        >
                                                            Back
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startAddingPrimaryContact('primary-phone')}
                                            className="flex items-center gap-2 text-blue-chill-600 hover:text-blue-chill-700 transition text-sm font-medium"
                                        >
                                            <Plus size={16} />
                                            Add Primary Phone Number
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Emails */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Mail size={20} className="text-blue-chill-600" />
                            Secondary Emails
                        </h2>
                        {!showAddEmail && (
                            <button
                                onClick={startAddingSecondaryEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition text-sm font-medium"
                            >
                                <Plus size={16} />
                                Add Email
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Add additional email addresses to your account. All emails require verification.
                    </p>

                    {/* Existing Secondary Emails */}
                    {otherEmails.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {otherEmails.map((email, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-gray-900">{email}</span>
                                    </div>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                        Verified
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Email Form */}
                    {showAddEmail && contactVerification.type === 'email' && (
                        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <h3 className="font-semibold text-gray-900 mb-3">Add New Email</h3>
                            <div className="space-y-3">
                                {contactVerification.step === 'input' && (
                                    <>
                                        <input
                                            type="email"
                                            value={contactVerification.value}
                                            onChange={(e) => setContactVerification(prev => ({ ...prev, value: e.target.value }))}
                                            placeholder="Enter email address"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none bg-white"
                                        />
                                        {contactVerification.error && (
                                            <p className="text-sm text-red-600">{contactVerification.error}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRequestOTP('email')}
                                                disabled={!contactVerification.value || contactVerification.loading}
                                                className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {contactVerification.loading ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    'Send OTP'
                                                )}
                                            </button>
                                            <button
                                                onClick={cancelVerification}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition bg-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}

                                {contactVerification.step === 'otp' && (
                                    <>
                                        <div className="bg-white border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                            OTP sent to {contactVerification.value}
                                        </div>
                                        <input
                                            type="text"
                                            value={contactVerification.otp}
                                            onChange={(e) => setContactVerification(prev => ({ ...prev, otp: e.target.value }))}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none text-center text-lg tracking-widest bg-white"
                                        />
                                        {contactVerification.error && (
                                            <p className="text-sm text-red-600">{contactVerification.error}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleVerifyOTP}
                                                disabled={contactVerification.otp.length !== 6 || contactVerification.loading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {contactVerification.loading ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={16} />
                                                        Verify
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setContactVerification(prev => ({ ...prev, step: 'input', otp: '', error: '' }))}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition bg-white"
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {otherEmails.length === 0 && !showAddEmail && (
                        <p className="text-gray-500 text-sm text-center py-4">No secondary emails added yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
