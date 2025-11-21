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
import BlockModal from '../components/BlockModal.tsx';
import UnblockModal from '../components/UnblockModal.tsx';

const Issuers = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { issuers, loading, filters } = useAppSelector((state) => state.issuer);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showUnblockModal, setShowUnblockModal] = useState(false);
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

    const handleApprove = async (issuer: IssuerProfile) => {
        if (window.confirm(`Are you sure you want to approve ${issuer.name}?`)) {
            await dispatch(approveIssuer(issuer.id));
            dispatch(fetchIssuers(filters));
        }
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

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or email..."
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as IssuerStatus | '')}
                            className="input-field cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Blocked</label>
                        <select
                            value={blockedFilter}
                            onChange={(e) => setBlockedFilter(e.target.value)}
                            className="input-field cursor-pointer"
                        >
                            <option value="">All</option>
                            <option value="true">Blocked Only</option>
                            <option value="false">Not Blocked</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button onClick={handleFilterChange} className="btn-primary w-full shadow-sm hover:shadow-md transform active:scale-95 transition-all">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Issuers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredIssuers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="h-10 w-10 text-gray-400"
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
                        <h3 className="text-lg font-medium text-gray-900">No issuers found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your filters to see more results</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Issuer
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredIssuers.map((issuer) => (
                                    <tr key={issuer.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {issuer.logo_url ? (
                                                    <img
                                                        src={issuer.logo_url}
                                                        alt={issuer.name}
                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm">
                                                        {issuer.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">{issuer.name}</div>
                                                    <div className="text-sm text-gray-500">{issuer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700 capitalize bg-gray-100 px-3 py-1 rounded-full inline-block">
                                                {issuer.type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span
                                                    className={`badge ${issuer.status === 'pending'
                                                        ? 'badge-pending'
                                                        : issuer.status === 'approved'
                                                            ? 'badge-approved'
                                                            : 'badge-rejected'
                                                        }`}
                                                >
                                                    {issuer.status}
                                                </span>
                                                {issuer.is_blocked && (
                                                    <span className="badge badge-blocked text-xs">Blocked</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(issuer.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                {/* Column 1: View */}
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleViewDetails(issuer)}
                                                        className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                </div>

                                                {/* Column 2: Approve */}
                                                <div className="flex justify-center">
                                                    {issuer.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApprove(issuer)}
                                                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                                                            title="Approve"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Column 3: Reject / Block / Unblock */}
                                                <div className="flex justify-center">
                                                    {issuer.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleReject(issuer)}
                                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                                            title="Reject"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    {issuer.status === 'approved' && !issuer.is_blocked && (
                                                        <button
                                                            onClick={() => handleBlock(issuer)}
                                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                                            title="Block"
                                                        >
                                                            Block
                                                        </button>
                                                    )}
                                                    {issuer.status === 'approved' && issuer.is_blocked && (
                                                        <button
                                                            onClick={() => handleUnblock(issuer)}
                                                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                                                            title="Unblock"
                                                        >
                                                            Unblock
                                                        </button>
                                                    )}
                                                </div>
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
