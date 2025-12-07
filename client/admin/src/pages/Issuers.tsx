import { formatDate } from '../utils/dateUtils';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import {
    fetchIssuers,
    setFilters,
    approveIssuer,
    setSelectedIssuer,
} from '../store/issuerSlice.ts';
import type { IssuerStatus, IssuerProfile } from '../api/issuerAPI.ts';
import IssuerDetailsModal from '../components/IssuerDetailsModal.tsx';
import RejectModal from '../components/RejectModal.tsx';
import ApproveModal from '../components/ApproveModal.tsx';
import BlockModal from '../components/BlockModal.tsx';
import UnblockModal from '../components/UnblockModal.tsx';

const Issuers = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { issuers, loading, filters, error } = useAppSelector((state) => state.issuer);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedIssuerForAction, setSelectedIssuerForAction] = useState<IssuerProfile | null>(
        null
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<IssuerStatus | ''>('');
    const [blockedFilter, setBlockedFilter] = useState<string>('');

    useEffect(() => {
        // Read filters from URL
        const status = searchParams.get('status') as IssuerStatus | null;
        const blocked = searchParams.get('blocked');

        if (status) setStatusFilter(status);
        if (blocked) setBlockedFilter(blocked);

        const newFilters: any = {};
        if (status) newFilters.status = status;
        if (blocked === 'true') newFilters.is_blocked = true;
        if (blocked === 'false') newFilters.is_blocked = false;

        dispatch(setFilters(newFilters));
        dispatch(fetchIssuers(newFilters));
    }, [searchParams, dispatch]);

    const handleFilterChange = () => {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        if (blockedFilter) params.blocked = blockedFilter;

        setSearchParams(params);
    };

    const handleApprove = (issuer: IssuerProfile) => {
        setSelectedIssuerForAction(issuer);
        setShowApproveModal(true);
    };

    const handleReject = (issuer: IssuerProfile) => {
        setSelectedIssuerForAction(issuer);
        setShowRejectModal(true);
    };

    const handleBlock = (issuer: IssuerProfile) => {
        setSelectedIssuerForAction(issuer);
        setShowBlockModal(true);
    };

    const handleUnblock = (issuer: IssuerProfile) => {
        setSelectedIssuerForAction(issuer);
        setShowUnblockModal(true);
    };

    const handleViewDetails = (issuer: IssuerProfile) => {
        dispatch(setSelectedIssuer(issuer));
        setShowDetailsModal(true);
    };

    const filteredIssuers = issuers.filter((issuer) =>
        issuer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issuer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Issuer Management</h1>
                    <p className="mt-2 text-gray-600 text-lg">Manage and review all issuer applications</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Search</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as IssuerStatus | '')}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Blocked</label>
                        <div className="relative">
                            <select
                                value={blockedFilter}
                                onChange={(e) => setBlockedFilter(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="true">Blocked Only</option>
                                <option value="false">Not Blocked</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button onClick={handleFilterChange} className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Issuers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredIssuers.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No issuers found</h3>
                        <p className="text-gray-500">Try adjusting your filters to see more results</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Issuer
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Registered
                                    </th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-64">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredIssuers.map((issuer) => (
                                    <tr key={issuer.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center">
                                                {issuer.logo_url ? (
                                                    <img
                                                        src={issuer.logo_url}
                                                        alt={issuer.name}
                                                        className="h-12 w-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-xl shadow-sm">
                                                        {issuer.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="ml-5">
                                                    <div className="text-sm font-bold text-gray-900">{issuer.name}</div>
                                                    <div className="text-sm text-gray-500 mt-1">{issuer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm text-gray-700 capitalize bg-gray-100 px-3 py-1 rounded-full inline-block border border-gray-200 font-medium">
                                                {issuer.type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex flex-col space-y-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border inline-flex w-fit ${issuer.status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : issuer.status === 'approved'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}
                                                >
                                                    {issuer.status}
                                                </span>
                                                {issuer.is_blocked && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border bg-red-100 text-red-800 border-red-200 w-fit">
                                                        Blocked
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(issuer.created_at)}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => handleViewDetails(issuer)}
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>

                                                {issuer.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(issuer)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Approve"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(issuer)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Reject"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                                {issuer.status === 'approved' && !issuer.is_blocked && (
                                                    <button
                                                        onClick={() => handleBlock(issuer)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Block"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                    </button>
                                                )}
                                                {issuer.status === 'approved' && issuer.is_blocked && (
                                                    <button
                                                        onClick={() => handleUnblock(issuer)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Unblock"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <IssuerDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />

            {selectedIssuerForAction && (
                <>
                    <RejectModal
                        isOpen={showRejectModal}
                        onClose={() => {
                            setShowRejectModal(false);
                            setSelectedIssuerForAction(null);
                        }}
                        issuer={selectedIssuerForAction}
                    />

                    <ApproveModal
                        isOpen={showApproveModal}
                        onClose={() => {
                            setShowApproveModal(false);
                            setSelectedIssuerForAction(null);
                        }}
                        issuer={selectedIssuerForAction}
                    />

                    <BlockModal
                        isOpen={showBlockModal}
                        onClose={() => {
                            setShowBlockModal(false);
                            setSelectedIssuerForAction(null);
                        }}
                        issuer={selectedIssuerForAction}
                    />

                    <UnblockModal
                        isOpen={showUnblockModal}
                        onClose={() => {
                            setShowUnblockModal(false);
                            setSelectedIssuerForAction(null);
                        }}
                        issuer={selectedIssuerForAction}
                    />
                </>
            )}
        </div>
    );
};

export default Issuers;
