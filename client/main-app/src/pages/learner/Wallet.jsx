import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    ExternalLink,
    ShieldCheck,
    FileText,
    Share2,
    CheckCircle
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';
import { Link } from 'react-router-dom';

const Wallet = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const res = await learnerApi.getCertificates();
                setCertificates(res.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch certificates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = cert.certificate_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.issuer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        // Add more filters if needed
        return matchesSearch;
    });

    if (loading) return <div className="p-10 text-center">Loading your wallet...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
                        <p className="text-gray-500 mt-1">Manage and share your verified credentials.</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search certificates..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-chill-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {filteredCertificates.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No certificates found</h3>
                        <p className="text-gray-500">You haven't earned any credentials yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCertificates.map((cert, index) => (
                            <CertificateCard key={cert.id} cert={cert} index={index} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

const CertificateCard = ({ cert, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
            {/* Card Header with Issuer Logo/Pattern */}
            <div className="h-32 bg-gradient-to-r from-blue-chill-600 to-blue-chill-800 relative p-6 flex items-center justify-center">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                </div>
                <div className="text-center">
                    <div className="h-12 w-12 bg-white rounded-full mx-auto flex items-center justify-center text-blue-chill-700 font-bold text-xl shadow-lg mb-2">
                        {cert.issuer?.name?.[0] || 'I'}
                    </div>
                    <p className="text-blue-50 text-xs font-medium uppercase tracking-wider">{cert.issuer?.name}</p>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2" title={cert.certificate_title}>
                    {cert.certificate_title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-4 mt-3">
                    {/* Mock Skills - In real app, extract from cert.metadata */}
                    {['Python', 'Data Science'].map(skill => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            {skill}
                        </span>
                    ))}
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">
                        NSQF L4
                    </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500 mb-6">
                    <div className="flex justify-between">
                        <span>Issued:</span>
                        <span className="font-medium text-gray-900">
                            {new Date(cert.issued_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Blockchain:</span>
                        <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-600 truncate max-w-[120px]" title={cert.tx_hash}>
                            {cert.tx_hash ? `${cert.tx_hash.substring(0, 6)}...${cert.tx_hash.substring(cert.tx_hash.length - 4)}` : 'Pending'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Link
                        to={`/credential/${cert.id}`}
                        className="flex-1 bg-blue-chill-50 text-blue-chill-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-chill-100 transition-colors text-center"
                    >
                        View Details
                    </Link>

                    <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <Download size={18} />
                    </button>

                    <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Share"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Wallet;
