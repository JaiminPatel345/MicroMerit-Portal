import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Lock } from './icons';
import { useSelector, useDispatch } from 'react-redux';
import { issuerServices } from '../../services/issuerServices';
import { issuerUpdateProfile } from '../../store/authIssuerSlice';


const IssuerProfile = () => {
    const issuer = useSelector(state => state.authIssuer.issuer);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        website_url: '',
        official_domain: '',
        type: '',
        phone: '',
        contact_person_name: '',
        contact_person_designation: '',
        address: '',
        kyc_document_url: '',
        logo: null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Phone Verification State
    const [phoneVerification, setPhoneVerification] = useState({
        isEditing: false,
        value: '',
        sessionId: null,
        otp: '',
        step: 'input', // 'input', 'otp'
        loading: false,
        error: ''
    });
    const dispatch = useDispatch();

    const statusMap = {
        approved: { icon: CheckCircle, color: 'text-green-600', text: 'Approved (Full access)' },
        pending: { icon: Clock, color: 'text-yellow-600', text: 'Pending (Awaiting admin review)' },
        rejected: { icon: XCircle, color: 'text-red-600', text: 'Rejected (Contact support)' },
        blocked: { icon: Lock, color: 'text-red-600', text: 'Blocked (Access restricted)' },
    };
    const currentStatus = statusMap[issuer?.status] || statusMap['pending'];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await issuerServices.getProfile();
                if (response.success) {
                    const data = response.data;
                    setFormData({
                        name: data.name || '',
                        email: data.email || '',
                        website_url: data.website_url || '',
                        official_domain: data.official_domain || '',
                        type: data.type || '',
                        phone: data.phone || '',
                        contact_person_name: data.contact_person_name || '',
                        contact_person_designation: data.contact_person_designation || '',
                        address: data.address || '',
                        kyc_document_url: data.kyc_document_url || '',
                        logo: null
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        if (e.target.name === 'logo') {
            setFormData({ ...formData, logo: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'logo') {
                    if (formData.logo) data.append('logo', formData.logo);
                } else if (key !== 'email' && key !== 'phone') { // Exclude phone from regular update
                    // Only append if value is present and not an empty string
                    // This prevents Zod validation errors for optional fields like url()
                    if (formData[key] && formData[key].trim() !== '') {
                        data.append(key, formData[key]);
                    }
                }
            });

            const result = await issuerServices.updateProfile(data);
            if (result.success) {
                dispatch(issuerUpdateProfile(result.data));
                setMessage('Profile updated successfully!');
                setIsEditing(false);
            }
        } catch (error) {
            setMessage('Failed to update profile. Try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    // Phone Verification Handlers
    const handleRequestOTP = async () => {
        setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const phone = phoneVerification.value.trim();
            // Basic validation
            if (!/^\d{10}$/.test(phone)) {
                setPhoneVerification(prev => ({ ...prev, loading: false, error: 'Please enter a valid 10-digit phone number' }));
                return;
            }

            const res = await issuerServices.requestPhoneUpdate(phone);
            if (res.success) {
                setPhoneVerification(prev => ({
                    ...prev,
                    sessionId: res.data.sessionId,
                    step: 'otp',
                    loading: false
                }));
            }
        } catch (error) {
            setPhoneVerification(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.message || 'Failed to send OTP'
            }));
        }
    };

    const handleVerifyOTP = async () => {
        setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const res = await issuerServices.verifyPhoneUpdate(phoneVerification.sessionId, phoneVerification.otp);
            if (res.success) {
                setFormData(prev => ({ ...prev, phone: res.data.phone }));
                setPhoneVerification({
                    isEditing: false,
                    value: '',
                    sessionId: null,
                    otp: '',
                    step: 'input',
                    loading: false,
                    error: ''
                });
                setMessage('Phone number updated successfully!');
            }
        } catch (error) {
            setPhoneVerification(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.message || 'Invalid OTP'
            }));
        }
    };

    const startPhoneEdit = () => {
        setPhoneVerification({
            isEditing: true,
            value: formData.phone || '',
            sessionId: null,
            otp: '',
            step: 'input',
            loading: false,
            error: ''
        });
    };

    const cancelPhoneEdit = () => {
        setPhoneVerification({
            isEditing: false,
            value: '',
            sessionId: null,
            otp: '',
            step: 'input',
            loading: false,
            error: ''
        });
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Issuer Profile</h3>
                    <p className="text-gray-500 text-sm">Manage your organization's details and branding.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-chill-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-chill-700 transition shadow-sm"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-lg border-l-4 ${currentStatus.color.replace('text', 'border')} ${currentStatus.color.replace('600', '50').replace('text', 'bg')} flex items-center space-x-3 shadow-sm`}>
                <currentStatus.icon className={`w-6 h-6 ${currentStatus.color}`} />
                <div>
                    <p className="font-bold text-gray-800">Status: {currentStatus.text}</p>
                    {issuer?.status !== 'approved' && <p className="text-sm text-gray-600">You must be 'Approved' to issue credentials.</p>}
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleUpdate} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Organization Details</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500">
                                    <option value="">Select Type</option>
                                    <option value="university">University</option>
                                    <option value="edtech">EdTech</option>
                                    <option value="company">Company</option>
                                    <option value="training_provider">Training Provider</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Official Domain</label>
                                <input type="text" name="official_domain" value={formData.official_domain} onChange={handleChange} placeholder="example.com" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://www.example.com" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
                                <input type="text" name="contact_person_name" value={formData.contact_person_name} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input type="text" name="contact_person_designation" value={formData.contact_person_designation} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                {!phoneVerification.isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            disabled
                                            className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={startPhoneEdit}
                                            className="px-3 py-2.5 bg-blue-chill-50 text-blue-chill-700 rounded-lg hover:bg-blue-chill-100 font-medium text-sm transition"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                                        {phoneVerification.step === 'input' ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="tel"
                                                    value={phoneVerification.value}
                                                    onChange={(e) => setPhoneVerification(prev => ({ ...prev, value: e.target.value }))}
                                                    placeholder="Enter new phone number"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 bg-white"
                                                />
                                                {phoneVerification.error && <p className="text-xs text-red-600">{phoneVerification.error}</p>}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleRequestOTP}
                                                        disabled={phoneVerification.loading || !phoneVerification.value}
                                                        className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg text-sm hover:bg-blue-chill-700 disabled:opacity-50"
                                                    >
                                                        {phoneVerification.loading ? 'Sending...' : 'Send OTP'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelPhoneEdit}
                                                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-blue-800">OTP sent to {phoneVerification.value}</p>
                                                <input
                                                    type="text"
                                                    value={phoneVerification.otp}
                                                    onChange={(e) => setPhoneVerification(prev => ({ ...prev, otp: e.target.value }))}
                                                    placeholder="Enter 6-digit OTP"
                                                    maxLength={6}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 text-center tracking-widest bg-white"
                                                />
                                                {phoneVerification.error && <p className="text-xs text-red-600">{phoneVerification.error}</p>}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyOTP}
                                                        disabled={phoneVerification.loading || phoneVerification.otp.length !== 6}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {phoneVerification.loading ? 'Verifying...' : 'Verify & Update'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhoneVerification(prev => ({ ...prev, step: 'input', otp: '', error: '' }))}
                                                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                                                    >
                                                        Back
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                                <input type="email" value={formData.email} disabled className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500" />
                            </div>
                        </div>

                        {/* Address & Docs */}
                        <div className="space-y-4 md:col-span-2">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Location & Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500"></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">KYC Document URL</label>
                                        <input type="url" name="kyc_document_url" value={formData.kyc_document_url} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-chill-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Update Logo</label>
                                        <input type="file" name="logo" onChange={handleChange} accept="image/*" className="w-full p-2 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-chill-50 file:text-blue-chill-700 hover:file:bg-blue-chill-100" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-chill-600 text-white rounded-lg font-bold hover:bg-blue-chill-700 transition shadow-md disabled:opacity-70">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            ) : (
                /* VIEW MODE */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Left Column: Logo & Main Info */}
                        <div className="md:col-span-1 flex flex-col items-center text-center space-y-4 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                {issuer?.logo_url ? (
                                    <img src={issuer.logo_url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150?text=Logo"; }} />
                                ) : (
                                    <span className="text-4xl text-gray-300 font-bold">{formData.name?.charAt(0) || 'I'}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{formData.name || 'Organization Name'}</h2>
                                <p className="text-blue-chill-600 font-medium">{formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : 'Organization Type'}</p>
                            </div>
                            <div className="w-full pt-4 space-y-2 text-sm text-gray-600">
                                {formData.website_url && (
                                    <a href={formData.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center hover:text-blue-chill-600 transition">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        Visit Website
                                    </a>
                                )}
                                {formData.official_domain && (
                                    <div className="flex items-center justify-center text-gray-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                        {formData.official_domain}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Contact Person</p>
                                        <p className="font-medium text-gray-900">{formData.contact_person_name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{formData.contact_person_designation}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{formData.email}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{formData.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Location & Legal</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="font-medium text-gray-900">{formData.address || 'N/A'}</p>
                                    </div>
                                    {formData.kyc_document_url && (
                                        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">KYC Document</p>
                                                <p className="font-medium text-gray-900">Document Uploaded</p>
                                            </div>
                                            <a href={formData.kyc_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-chill-600 hover:text-blue-chill-800 text-sm font-medium">View</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default IssuerProfile;