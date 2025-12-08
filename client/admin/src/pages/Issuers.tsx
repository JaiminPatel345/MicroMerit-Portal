import { formatDate } from '../utils/dateUtils';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import {
    fetchIssuers,
    setFilters,
    setSelectedIssuer,
} from '../store/issuerSlice.ts';
import { fetchSyncStatus, triggerSync } from '../store/externalSyncSlice.ts';
import type { IssuerProfile } from '../api/issuerAPI.ts';
import IssuerDetailsModal from '../components/IssuerDetailsModal.tsx';
import RejectModal from '../components/RejectModal.tsx';
import ApproveModal from '../components/ApproveModal.tsx';
import BlockModal from '../components/BlockModal.tsx';
import UnblockModal from '../components/UnblockModal.tsx';

const Issuers = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { issuers, loading, error } = useAppSelector((state) => state.issuer);
    const { viewMode, syncStatus, syncLoading } = useAppSelector((state) => state.externalSync);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedIssuerForAction, setSelectedIssuerForAction] = useState<IssuerProfile | null>(null);
    const [syncingIssuerId, setSyncingIssuerId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [blockedFilter, setBlockedFilter] = useState('');

    // Fetch issuers when viewMode changes
    useEffect(() => {
        const status = searchParams.get('status');
        const blocked = searchParams.get('blocked');

        const newFilters: any = { source: viewMode };
        if (status) {
            newFilters.status = status;
            setStatusFilter(status);
        }
        if (blocked === 'true') newFilters.is_blocked = true;
        if (blocked === 'false') newFilters.is_blocked = false;
        setBlockedFilter(blocked || '');

        dispatch(setFilters(newFilters));
        dispatch(fetchIssuers(newFilters));

        // Fetch sync status for connector view
        if (viewMode === 'connector') {
            dispatch(fetchSyncStatus());
        }
    }, [viewMode, searchParams, dispatch]);

    const handleFilterChange = () => {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        if (blockedFilter) params.blocked = blockedFilter;
        setSearchParams(params);
    };

    const handleSyncIssuer = async (issuer: IssuerProfile) => {
        console.log('Sync button clicked for issuer:', issuer);

        const providerId = getProviderIdFromIssuerName(issuer.name);
        console.log('Detected provider ID:', providerId, 'for issuer name:', issuer.name);

        if (!providerId) {
            toast.error(`Could not determine provider for "${issuer.name}". Name must contain nsdc, udemy, jaimin, or sih.`);
            return;
        }

        setSyncingIssuerId(issuer.id);
        const loadingToast = toast.loading(`Syncing ${issuer.name}...`);

        try {
            console.log('Dispatching triggerSync with providerId:', providerId);
            const result = await dispatch(triggerSync(providerId)).unwrap();
            console.log('Sync result:', result);

            const providerResult = result.find((r: any) => r.provider_id === providerId);

            toast.dismiss(loadingToast);

            if (providerResult) {
                if (providerResult.credentials_created > 0) {
                    toast.success(
                        `✨ Synced ${providerResult.credentials_created} new credential${providerResult.credentials_created > 1 ? 's' : ''} from ${issuer.name}`,
                        { duration: 5000 }
                    );
                } else {
                    toast.success(`No new credentials from ${issuer.name}`, { duration: 3000 });
                }
            } else {
                toast.success('Sync completed', { duration: 3000 });
            }

            // Refresh sync status
            dispatch(fetchSyncStatus());
        } catch (error: any) {
            console.error('Sync failed:', error);
            toast.dismiss(loadingToast);
            toast.error(`Sync failed: ${error || 'Unknown error'}`);
        } finally {
            setSyncingIssuerId(null);
        }
    };

    // Helper to get provider ID from issuer name
    const getProviderIdFromIssuerName = (name: string): string | null => {
        const lowerName = name.toLowerCase();
        console.log('Checking issuer name:', lowerName);
        if (lowerName.includes('nsdc')) return 'nsdc';
        if (lowerName.includes('udemy')) return 'udemy';
        if (lowerName.includes('jaimin')) return 'jaimin';
        if (lowerName.includes('sih')) return 'sih';
        return null;
    };


    // Get sync state for an issuer
    const getSyncStateForIssuer = (issuer: IssuerProfile) => {
        if (!syncStatus) return null;
        const providerId = getProviderIdFromIssuerName(issuer.name);
        if (!providerId) return null;
        return syncStatus.providers.find(p => p.id === providerId);
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {viewMode === 'connector' ? 'External Connectors' : 'Platform Issuers'}
                    </h1>
                    <p className="mt-1 text-gray-500">
                        {viewMode === 'connector'
                            ? 'Manage external credential providers and sync credentials'
                            : 'Manage issuers who registered on the platform'}
                    </p>
                </div>

                {/* Sync status indicator for connectors */}
                {viewMode === 'connector' && syncStatus && (
                    <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl border border-primary-100">
                        <div className={`w-2 h-2 rounded-full ${syncStatus.scheduler.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-primary-700">
                            {syncStatus.scheduler.running ? 'Sync Active' : 'Sync Stopped'}
                        </span>
                        {syncStatus.scheduler.next_sync_at && (
                            <span className="text-xs text-primary-500">
                                • Next: {new Date(syncStatus.scheduler.next_sync_at).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-sm"
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
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-sm"
                        >
                            <option value="">All</option>
                            <option value="true">Blocked Only</option>
                            <option value="false">Not Blocked</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleFilterChange}
                            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all text-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Issuers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredIssuers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {viewMode === 'connector' ? 'No connectors configured' : 'No issuers found'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {viewMode === 'connector'
                                ? 'Configure connector issuer IDs in .env and run the seed script'
                                : 'Try adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issuer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    {viewMode === 'connector' && (
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sync Status</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredIssuers.map((issuer) => {
                                    const syncState = viewMode === 'connector' ? getSyncStateForIssuer(issuer) : null;
                                    const isSyncing = syncingIssuerId === issuer.id;

                                    return (
                                        <tr key={issuer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {issuer.logo_url ? (
                                                        <img src={issuer.logo_url} alt={issuer.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold">
                                                            {issuer.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{issuer.name}</p>
                                                        <p className="text-xs text-gray-500">{issuer.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md capitalize">
                                                    {issuer.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border w-fit ${issuer.status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : issuer.status === 'approved'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {issuer.status}
                                                    </span>
                                                    {issuer.is_blocked && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200 w-fit">
                                                            Blocked
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {viewMode === 'connector' && (
                                                <td className="px-6 py-4">
                                                    {syncState ? (
                                                        <div className="text-xs">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <div className={`w-2 h-2 rounded-full ${syncState.sync_state?.status === 'completed' ? 'bg-green-500' :
                                                                    syncState.sync_state?.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                                        syncState.sync_state?.status === 'failed' ? 'bg-red-500' :
                                                                            'bg-gray-400'
                                                                    }`}></div>
                                                                <span className="text-gray-600 capitalize">{syncState.sync_state?.status || 'idle'}</span>
                                                            </div>
                                                            {syncState.sync_state?.credentials_synced !== undefined && (
                                                                <span className="text-gray-500">
                                                                    {syncState.sync_state.credentials_synced} credentials
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(issuer.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1">
                                                    {/* Force Sync Button - Only for connectors */}
                                                    {viewMode === 'connector' && (
                                                        <button
                                                            onClick={() => handleSyncIssuer(issuer)}
                                                            disabled={syncLoading || isSyncing}
                                                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-50"
                                                            title="Force Sync"
                                                        >
                                                            {isSyncing ? (
                                                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleViewDetails(issuer)}
                                                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>

                                                    {issuer.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(issuer)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Approve"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(issuer)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Reject"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    {issuer.status === 'approved' && !issuer.is_blocked && (
                                                        <button
                                                            onClick={() => handleBlock(issuer)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Block"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                        </button>
                                                    )}
                                                    {issuer.status === 'approved' && issuer.is_blocked && (
                                                        <button
                                                            onClick={() => handleUnblock(issuer)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Unblock"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        onClose={() => { setShowRejectModal(false); setSelectedIssuerForAction(null); }}
                        issuer={selectedIssuerForAction}
                    />
                    <ApproveModal
                        isOpen={showApproveModal}
                        onClose={() => { setShowApproveModal(false); setSelectedIssuerForAction(null); }}
                        issuer={selectedIssuerForAction}
                    />
                    <BlockModal
                        isOpen={showBlockModal}
                        onClose={() => { setShowBlockModal(false); setSelectedIssuerForAction(null); }}
                        issuer={selectedIssuerForAction}
                    />
                    <UnblockModal
                        isOpen={showUnblockModal}
                        onClose={() => { setShowUnblockModal(false); setSelectedIssuerForAction(null); }}
                        issuer={selectedIssuerForAction}
                    />
                </>
            )}
        </div>
    );
};

export default Issuers;
