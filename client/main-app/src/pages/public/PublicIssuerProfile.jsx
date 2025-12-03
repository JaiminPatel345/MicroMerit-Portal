import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { issuerServices } from '../../services/issuerServices';
import { CheckCircle, Clock, XCircle, Lock, Globe, Mail, Phone, MapPin, FileText, Award } from 'lucide-react';

const PublicIssuerProfile = () => {
    const { id } = useParams();
    const [issuer, setIssuer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await issuerServices.getPublicProfile(id);
                if (response.success) {
                    setIssuer(response.data);
                } else {
                    setError('Failed to load issuer profile');
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError('Issuer not found or error loading profile');
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchProfile();
        }
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!issuer) return null;

    const statusMap = {
        approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'Verified Issuer' },
        pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'Pending Verification' },
        rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Unverified' },
        blocked: { icon: Lock, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Suspended' },
    };

    const currentStatus = statusMap[issuer.status] || statusMap['pending'];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-chill-500 to-blue-chill-700"></div>
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                            <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-lg border border-gray-100">
                                <div className="w-full h-full rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {issuer.logo_url ? (
                                        <img src={issuer.logo_url} alt={issuer.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-4xl font-bold text-gray-300">{issuer.name?.charAt(0) || 'I'}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pt-2 md:pt-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{issuer.name}</h1>
                                        <p className="text-blue-chill-600 font-medium capitalize">{issuer.type?.replace('_', ' ')}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color}`}>
                                        <currentStatus.icon size={18} />
                                        <span className="font-semibold text-sm">{currentStatus.text}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Globe size={18} className="text-gray-400" /> Online Presence
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {issuer.website_url && (
                                        <a href={issuer.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-chill-600 hover:underline">
                                            <Globe size={14} /> {issuer.website_url}
                                        </a>
                                    )}
                                    {issuer.official_domain && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CheckCircle size={14} className="text-green-500" />
                                            Domain Verified: {issuer.official_domain}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin size={18} className="text-gray-400" /> Contact & Location
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {issuer.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="mt-1 flex-shrink-0" />
                                            <span>{issuer.address}</span>
                                        </div>
                                    )}
                                    {issuer.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} />
                                            <a href={`mailto:${issuer.email}`} className="hover:text-blue-chill-600">{issuer.email}</a>
                                        </div>
                                    )}
                                    {issuer.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} />
                                            <span>{issuer.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info / Stats could go here */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-chill-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(issuer.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Placeholder for other stats like "Credentials Issued" if available in public API */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                <Award size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-2">Credentials Offered</p>
                                {issuer.certificate_types && issuer.certificate_types.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {issuer.certificate_types.map((title, index) => (
                                            <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-100">
                                                {title}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm italic">No credentials issued yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PublicIssuerProfile;
