import React, { useEffect, useState } from 'react';
import { employerApi } from '../../services/authServices';
import {
    Briefcase, Users, FileText, Verified, Edit3, X, HelpCircle, Send, MessageSquare,
    Loader, User, Building, Phone, Save, Mail, Globe, MapPin, ChevronRight, Layout
} from 'lucide-react';

const EmployerProfile = () => {
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Backup state to revert if cancel
    const [originalProfile, setOriginalProfile] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await employerApi.getProfile();
            setProfile(res.data.data);
            setOriginalProfile(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        setProfile(originalProfile);
        setIsEditing(false);
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // Sanitize payload: remove nulls, undefined, and empty strings for optional fields
        const cleanPayload = Object.fromEntries(
            Object.entries({
                company_name: profile.company_name,
                company_website: profile.company_website,
                company_address: profile.company_address,
                industry_type: profile.industry_type,
                company_size: profile.company_size,
                contact_person: profile.contact_person,
                phone: profile.phone
            }).filter(([_, v]) => v != null && v !== '')
        );

        if (profile.company_website === '') cleanPayload.company_website = '';

        try {
            const res = await employerApi.updateProfile(cleanPayload);
            setProfile(res.data.data);
            setOriginalProfile(res.data.data);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            console.error("Update error:", err);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader className="animate-spin text-blue-chill-600" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            {/* Top Banner */}
            <div className="h-60 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Logo / Avatar */}
                    <div className="shrink-0 relative mx-auto md:mx-0">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-gradient-to-br from-blue-chill-500 to-blue-600 shadow-xl flex items-center justify-center text-5xl sm:text-6xl font-bold text-white border-4 border-white">
                            {profile.company_name?.charAt(0).toUpperCase() || <Building size={64} />}
                        </div>
                        {profile.status === 'approved' && (
                            <div className="absolute -bottom-3 -right-3 bg-white p-1.5 rounded-full shadow-md">
                                <Verified className="text-blue-500 fill-blue-50" size={28} />
                            </div>
                        )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 text-center md:text-left space-y-3 z-10 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {isEditing ? (
                                    <div className="space-y-2 max-w-sm mx-auto md:mx-0">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Name</label>
                                        <input
                                            name="company_name"
                                            value={profile.company_name || ''}
                                            onChange={handleChange}
                                            className="w-full text-2xl font-bold p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight break-words">
                                        {profile.company_name}
                                    </h1>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center md:justify-end shrink-0">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Edit3 size={18} /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                                        >
                                            <X size={18} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition-all shadow-md hover:shadow-lg font-medium"
                                        >
                                            {saving ? <Loader className="animate-spin" size={18} /> : <><Save size={18} /> Save</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Badges/Tags */}
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center text-sm font-medium text-gray-600 mt-2">
                            {profile.industry_type && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                    <Briefcase size={14} /> {profile.industry_type}
                                </span>
                            )}
                            {profile.company_size && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <Users size={14} /> {profile.company_size} Employees
                                </span>
                            )}
                            {profile.company_website && (
                                <a href={profile.company_website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 truncate max-w-[200px] sm:max-w-xs">
                                    <Globe size={14} /> <span className="truncate">Website</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm animate-fade-in border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {message.type === 'success' ? <Verified size={20} className="mt-0.5 shrink-0" /> : <X size={20} className="mt-0.5 shrink-0" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Sidebar: Contact & Status */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                                <Layout size={20} className="text-gray-400" /> Account Status
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Verification</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${profile.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {profile.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                                <Phone size={20} className="text-gray-400" /> Contact Info
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
                                    <div className="flex items-center gap-2 text-gray-900 font-medium break-all">
                                        <Mail size={16} className="text-gray-400 shrink-0" />
                                        {profile.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
                                    {isEditing ? (
                                        <input
                                            name="phone"
                                            value={profile.phone || ''}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="+91..."
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                                            <Phone size={16} className="text-gray-400 shrink-0" />
                                            {profile.phone || 'N/A'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Address</label>
                                    {isEditing ? (
                                        <textarea
                                            name="company_address"
                                            rows="3"
                                            value={profile.company_address || ''}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Headquarters address..."
                                        />
                                    ) : (
                                        <div className="flex items-start gap-2 text-gray-900 font-medium text-sm leading-relaxed">
                                            <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                            <span className="break-words">{profile.company_address || 'No address provided'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Main Column: Company Details & Support */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Company Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Briefcase size={22} className="text-blue-chill-600" /> Organization Details
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Industry Sector</label>
                                        {isEditing ? (
                                            <select
                                                name="industry_type"
                                                value={profile.industry_type || ''}
                                                onChange={handleChange}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                            >
                                                <option value="">Select Industry</option>
                                                <option value="IT-ITeS">IT-ITeS</option>
                                                <option value="Manufacturing">Manufacturing</option>
                                                <option value="Healthcare">Healthcare</option>
                                                <option value="BFSI">BFSI</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900 font-medium">
                                                {profile.industry_type || 'Not Specified'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Company Size</label>
                                        {isEditing ? (
                                            <select
                                                name="company_size"
                                                value={profile.company_size || ''}
                                                onChange={handleChange}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                            >
                                                <option value="">Select Size</option>
                                                <option value="1-10">1-10 Employees</option>
                                                <option value="11-50">11-50 Employees</option>
                                                <option value="51-200">51-200 Employees</option>
                                                <option value="201-500">201-500 Employees</option>
                                                <option value="500+">500+ Employees</option>
                                            </select>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900 font-medium">
                                                {profile.company_size || 'Not Specified'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Website</label>
                                        {isEditing ? (
                                            <input
                                                name="company_website"
                                                value={profile.company_website || ''}
                                                onChange={handleChange}
                                                placeholder="https://example.com"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900 font-medium text-blue-600 hover:underline cursor-pointer truncate">
                                                {profile.company_website || 'Not Specified'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Primary Contact</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    name="contact_person"
                                                    value={profile.contact_person || ''}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="Name of contact person"
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900 font-medium flex items-center gap-2">
                                                <User size={18} className="text-gray-400" />
                                                {profile.contact_person || 'Not Specified'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Help & Support Section */}
                        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-xl shadow-lg border border-gray-700 p-6 sm:p-8 text-white relative overflow-hidden">
                            {/* Accent Circle */}
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <HelpCircle className="text-blue-400" /> Need Support?
                                </h3>
                                <p className="text-gray-300 mb-8 max-w-lg">
                                    Our team is here to help you manage your employer profile and verifications. Reach out anytime.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Direct Contacts */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                                                <Mail size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Email Us</p>
                                                <p className="font-semibold truncate">support@micromerit.com</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shrink-0">
                                                <Phone size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Call Us</p>
                                                <p className="font-semibold truncate">+91 8511633118</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Message Form */}
                                    <div className="bg-white/95 text-gray-900 p-5 rounded-lg shadow-sm">
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            <MessageSquare size={16} className="text-blue-600" /> Send a Message
                                        </h4>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            setMessage({ type: 'success', text: 'Support request received!' });
                                            e.target.reset();
                                        }} className="space-y-3">
                                            <input
                                                className="w-full text-sm p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Subject"
                                                required
                                            />
                                            <textarea
                                                className="w-full text-sm p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                rows="2"
                                                placeholder="How can we help?"
                                                required
                                            ></textarea>
                                            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors">
                                                Send Message
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployerProfile;
