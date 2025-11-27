import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Shield,
    Download,
    Share2,
    ExternalLink,
    Award,
    Cpu,
    ArrowRight,
    FileText,
    Hash
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

const CredentialDetails = () => {
    const { id } = useParams();
    const [credential, setCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCredential = async () => {
            try {
                // Since we don't have a direct get-by-id endpoint yet, we fetch all and find
                const res = await learnerApi.getCertificates();
                const found = res.data?.data?.find(c => c.id === id);

                if (found) {
                    setCredential(found);
                } else {
                    setError("Credential not found");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load credential details");
            } finally {
                setLoading(false);
            }
        };
        fetchCredential();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!credential) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">

                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/dashboard" className="hover:text-blue-chill-600">Dashboard</Link>
                    <span>/</span>
                    <Link to="/wallet" className="hover:text-blue-chill-600">Wallet</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{credential.certificate_title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Certificate Preview & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            {/* Placeholder for PDF/Image Preview */}
                            <div className="aspect-[1/1.414] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                {credential.pdf_url ? (
                                    <iframe src={credential.pdf_url} className="w-full h-full" title="Certificate Preview"></iframe>
                                ) : (
                                    <div className="text-center p-6">
                                        <FileText size={48} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Preview Unavailable</p>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                                        <Download size={20} />
                                    </button>
                                    <button className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                                        <ExternalLink size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full py-2.5 bg-blue-chill-600 text-white rounded-lg font-medium hover:bg-blue-chill-700 transition-colors flex items-center justify-center gap-2">
                                <Download size={18} /> Download PDF
                            </button>
                            <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <Share2 size={18} /> Share Public Link
                            </button>
                        </div>

                        {/* Trust Score */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="text-green-600" size={16} /> Trust Score
                            </h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-gray-900">98</span>
                                <span className="text-sm text-gray-500 mb-1">/ 100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '98%' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Issuer <strong>{credential.issuer?.name}</strong> is highly trusted.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Details & AI Insights */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Header Info */}
                        <div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{credential.certificate_title}</h1>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">
                                            {credential.issuer?.name}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-sm">Issued {new Date(credential.issued_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-green-100">
                                    <CheckCircle size={16} /> Verified
                                </div>
                            </div>
                        </div>

                        {/* Blockchain Proof */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Hash size={18} className="text-purple-500" /> Blockchain Proof
                            </h3>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                    <span className="text-gray-500 mb-1 sm:mb-0">Transaction Hash</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px]">
                                            {credential.tx_hash || 'Pending...'}
                                        </code>
                                        <ExternalLink size={14} className="text-blue-chill-600 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                    <span className="text-gray-500 mb-1 sm:mb-0">Data Hash</span>
                                    <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px]">
                                        {credential.data_hash}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Skills & NSQF */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Award size={18} className="text-orange-500" /> Skills & Standards
                            </h3>

                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">NSQF Mapping</h4>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                                        Level 4
                                    </span>
                                    <span className="text-sm text-gray-500">Aligned with National Skills Qualifications Framework</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Verified Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Python Programming', 'Data Analysis', 'Problem Solving'].map(skill => (
                                        <span key={skill} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* AI Insights */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Cpu size={120} />
                            </div>

                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 relative z-10">
                                <Cpu size={20} className="text-blue-400" /> AI Career Insights
                            </h3>

                            <div className="space-y-4 relative z-10">
                                <p className="text-gray-300 text-sm">
                                    This credential proves your competency in <strong>Software Development</strong>.
                                    Based on market trends, here is your recommended path:
                                </p>

                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-blue-300 group-hover:text-blue-200">Next: Advanced Data Structures</h4>
                                            <p className="text-xs text-gray-400 mt-1">Estimated salary increase: 15%</p>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-white" />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <Link to="/roadmap" className="text-sm text-blue-300 hover:text-blue-200 hover:underline">
                                        View Full Roadmap
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CredentialDetails;
