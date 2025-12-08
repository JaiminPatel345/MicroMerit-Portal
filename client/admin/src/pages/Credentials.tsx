import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import axiosInstance from '../api/axiosInstance';

interface Credential {
    id: string;
    credential_id: string;
    certificate_title: string;
    learner_email: string;
    issued_at: string;
    status: string;
    tx_hash?: string | null;
    ipfs_cid?: string | null;
    metadata?: Record<string, any>;
    issuer?: {
        id: number;
        name: string;
        logo_url?: string | null;
    };
    learner?: {
        id: number;
        name: string;
    };
}

const Credentials = () => {
    const { viewMode } = useAppSelector((state) => state.externalSync);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCredentials = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('source', viewMode);
            params.append('limit', '50');

            const response = await axiosInstance.get(`/admin/credentials?${params.toString()}`);
            const data = response.data?.data || response.data || [];
            setCredentials(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch credentials:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch credentials');
            setCredentials([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [viewMode]);

    const filteredCredentials = credentials.filter((cred) => {
        const title = cred.certificate_title?.toLowerCase() || '';
        const email = cred.learner_email?.toLowerCase() || '';
        const issuerName = cred.issuer?.name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return title.includes(search) || email.includes(search) || issuerName.includes(search);
    });

    const formatDate = (date: string) => {
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return date;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            issued: 'bg-green-100 text-green-700 border-green-200',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            unclaimed: 'bg-blue-100 text-blue-700 border-blue-200',
            revoked: 'bg-red-100 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {viewMode === 'connector' ? 'External Credentials' : 'Platform Credentials'}
                    </h1>
                    <p className="mt-1 text-gray-500">
                        {viewMode === 'connector'
                            ? 'Credentials synced from external providers'
                            : 'Credentials issued by platform issuers'}
                    </p>
                </div>
                <button
                    onClick={fetchCredentials}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{credentials.length}</p>
                            <p className="text-sm text-gray-500">Total Credentials</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {credentials.filter(c => c.status === 'issued').length}
                            </p>
                            <p className="text-sm text-gray-500">Issued</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {credentials.filter(c => c.status === 'unclaimed').length}
                            </p>
                            <p className="text-sm text-gray-500">Unclaimed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {new Set(credentials.map(c => c.issuer?.id).filter(Boolean)).size}
                            </p>
                            <p className="text-sm text-gray-500">Issuers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title, email, or issuer..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Credentials List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredCredentials.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No credentials found</h3>
                        <p className="text-gray-500">
                            {viewMode === 'connector'
                                ? 'Trigger a sync from the Issuers page to fetch credentials'
                                : 'No credentials have been issued by platform issuers yet'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issuer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Blockchain</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredCredentials.map((cred) => (
                                    <tr key={cred.id || cred.credential_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{cred.certificate_title}</p>
                                                {cred.metadata?.sector && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{cred.metadata.sector}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{cred.learner?.name || cred.metadata?.learner_name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{cred.learner_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {cred.issuer?.logo_url ? (
                                                    <img src={cred.issuer.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                                                        {cred.issuer?.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <span className="text-sm text-gray-700">{cred.issuer?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDate(cred.issued_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(cred.status)}`}>
                                                {cred.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {cred.tx_hash ? (
                                                <span className="inline-flex items-center gap-1 text-green-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-xs font-medium">Confirmed</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-medium">Pending</span>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Credentials;
