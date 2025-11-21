import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import {
    fetchIssuers,
    setFilters,
    approveIssuer,
    unblockIssuer,
    setSelectedIssuer,
} from '../store/issuerSlice.ts';
import type { IssuerStatus, IssuerProfile } from '../api/issuerAPI.ts';
import IssuerDetailsModal from '../components/IssuerDetailsModal.tsx';
import RejectModal from '../components/RejectModal.tsx';
import BlockModal from '../components/BlockModal.tsx';

const Issuers = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { issuers, loading, filters } = useAppSelector((state) => state.issuer);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
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

    const handleUnblock = async (issuer: IssuerProfile) => {
        if (window.confirm(`Are you sure you want to unblock ${issuer.name}?`)) {
            await dispatch(unblockIssuer(issuer.id));
            dispatch(fetchIssuers(filters));
        }
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
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Issuer Management</h1>
                <p className="mt-2 text-gray-600">Manage and review all issuer applications</p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or email..."
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as IssuerStatus | '')}
                            className="input-field"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blocked</label>
                        <select
                            value={blockedFilter}
                            onChange={(e) => setBlockedFilter(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All</option>
                            <option value="true">Blocked Only</option>
                            <option value="false">Not Blocked</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button onClick={handleFilterChange} className="btn-primary w-full">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Issuers Table */}
            <div className="card">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredIssuers.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No issuers found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issuer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredIssuers.map((issuer) => (
                                    <tr key={issuer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {issuer.logo_url ? (
                                                    <img
                                                        src={issuer.logo_url}
                                                        alt={issuer.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-600 font-medium text-sm">
                                                            {issuer.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{issuer.name}</div>
                                                    <div className="text-sm text-gray-500">{issuer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 capitalize">
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
                                                    <span className="badge badge-blocked">Blocked</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(issuer.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(issuer)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    View
                                                </button>

                                                {issuer.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(issuer)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(issuer)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {issuer.status === 'approved' && (
                                                    <>
                                                        {issuer.is_blocked ? (
                                                            <button
                                                                onClick={() => handleUnblock(issuer)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBlock(issuer)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Block
                                                            </button>
                                                        )}
                                                    </>
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

                    <BlockModal
                        isOpen={showBlockModal}
                        onClose={() => {
                            setShowBlockModal(false);
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
