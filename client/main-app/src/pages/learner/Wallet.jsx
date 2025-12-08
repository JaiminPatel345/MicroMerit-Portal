import React, { useEffect, useState } from 'react';
import {
    Search,
    Hash,
    Clock,
    ChevronDown
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';
import { Link } from 'react-router-dom';

const Wallet = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const res = await learnerApi.getCertificates({
                page,
                limit,
                search: searchTerm,
                status: statusFilter
            });
            const data = res.data?.data?.data || [];
            const pagination = res.data?.data?.pagination || {};

            setCertificates(data);
            setTotalPages(pagination.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch certificates", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCertificates();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, statusFilter]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                    <p className="text-gray-500 mt-1">Manage your verified credentials and achievements.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find a certificate..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 text-sm bg-white"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="relative min-w-[180px]">
                        <select
                            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-chill-500 text-sm"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="issued">Issued</option>
                            <option value="claimed">Claimed</option>
                            <option value="revoked">Revoked</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-chill-600 mx-auto mb-4"></div>
                        Loading certificates...
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900">No certificates found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl divide-y divide-gray-300 overflow-hidden">
                        {certificates.map((cert) => (
                            <CertificateRow key={cert.id} cert={cert} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm text-blue-chill-600 hover:bg-blue-chill-50 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:text-gray-400"
                        >
                            &lt; Previous
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm text-blue-chill-600 hover:bg-blue-chill-50 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:text-gray-400"
                        >
                            Next &gt;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CertificateRow = ({ cert }) => {
    // Generate a random color for the language/skill dot
    const dotColor = ['#f1e05a', '#3178c6', '#e34c26', '#563d7c'][Math.floor(Math.random() * 4)];

    // Try to get description from metadata, or fallback
    const description = cert.metadata?.description ||
        `Issued by ${cert.issuer?.name || 'Unknown Issuer'}. This credential verifies the completion of the course and mastery of the subject matter.`;

    return (
         <Link to={`/credential/${cert.id}`} >
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Link to={`/credential/${cert.id}`} className="text-lg font-bold text-blue-chill-600 hover:underline truncate">
                        {cert.certificate_title}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cert.status === 'revoked'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                        {cert.status || 'Verified'}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }}></span>
                        <span>{cert.issuer?.type || 'Certificate'}</span>
                    </div>

                    <div className="flex items-center gap-1" title="Credential ID">
                        <Hash size={14} />
                        <span className="font-mono">{cert.credential_id || cert.id.substring(0, 8)}</span>
                    </div>

                    <div className="flex items-center gap-1" title="Issued Date">
                        <Clock size={14} />
                        <span>{new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Link
                    to={`/credential/${cert.id}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                    View Details
                </Link>
            </div>
        </div>
     </Link>
    );
};

export default Wallet;
