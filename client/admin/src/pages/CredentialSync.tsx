import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
    getSyncStats,
    getSyncIssuers,
    getExternalCredentials,
    getDLQItems,
    retryDLQItem,
    forceSyncIssuer,
    triggerTestWebhook,
} from '../api/syncAPI';

interface SyncStats {
    totalExternal: number;
    verified: number;
    pending: number;
    rejected: number;
    dlqCount: number;
    featureEnabled: boolean;
    matchThreshold: number;
}

interface SyncIssuer {
    id: number;
    name: string;
    registryId: string | null;
    lastSyncAt: string | null;
    acceptExternal: boolean;
    reissueLocalVc: boolean;
    externalCredentialCount: number;
}

interface ExternalCredential {
    id: string;
    providerCredentialId: string;
    status: string;
    signatureVerified: boolean;
    verificationMethod: string | null;
    matchConfidence: number | null;
    issuer: string;
    learner: { name: string; email: string } | null;
    createdAt: string;
    processedAt: string | null;
}

interface DLQItem {
    id: string;
    job_type: string;
    job_id: string;
    reason: string;
    attempts: number;
    created_at: string;
}

export default function CredentialSync() {
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [issuers, setIssuers] = useState<SyncIssuer[]>([]);
    const [credentials, setCredentials] = useState<ExternalCredential[]>([]);
    const [dlqItems, setDLQItems] = useState<DLQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'dlq' | 'test'>('overview');
    const [testResult, setTestResult] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);

        try {
            const [statsRes, issuersRes, credsRes, dlqRes] = await Promise.all([
                getSyncStats().catch(() => ({ data: null })),
                getSyncIssuers().catch(() => ({ data: [] })),
                getExternalCredentials({ limit: 50 }).catch(() => ({ data: [] })),
                getDLQItems({ limit: 50 }).catch(() => ({ data: [] })),
            ]);

            setStats(statsRes.data);
            setIssuers(issuersRes.data || []);
            setCredentials(credsRes.data || []);
            setDLQItems(dlqRes.data?.items || dlqRes.data || []);
        } catch (error) {
            console.error('Failed to load sync data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleForceSync = async (issuerId: number) => {
        const toastId = toast.loading('Syncing...');
        try {
            await forceSyncIssuer(issuerId);
            toast.success('Sync triggered successfully', { id: toastId });
            loadData(true);
        } catch (error) {
            toast.error('Sync failed', { id: toastId });
        }
    };

    const handleRetryDLQ = async (id: string) => {
        const toastId = toast.loading('Retrying...');
        try {
            await retryDLQItem(id);
            toast.success('Retry triggered', { id: toastId });
            loadData(true);
        } catch (error) {
            toast.error('Retry failed', { id: toastId });
        }
    };

    const handleTestWebhook = async () => {
        const toastId = toast.loading('Sending webhook...');
        try {
            setTestResult('Sending...');
            const result = await triggerTestWebhook('provider-a');
            setTestResult(JSON.stringify(result, null, 2));
            toast.success('Webhook sent', { id: toastId });
            setTimeout(() => loadData(true), 2000);
        } catch (error: any) {
            setTestResult(`Error: ${error.message}`);
            toast.error(`Webhook failed: ${error.message}`, { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">External Credential Sync</h1>
                <p className="text-gray-600 mt-1">
                    Manage external credentials from NSDC/API-Setu
                    {stats?.featureEnabled === false && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Feature Disabled
                        </span>
                    )}
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalExternal}</div>
                        <div className="text-sm text-gray-500">Total External</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                        <div className="text-sm text-gray-500">Verified</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <div className="text-sm text-gray-500">Pending</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        <div className="text-sm text-gray-500">Rejected</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-gray-600">{stats.dlqCount}</div>
                        <div className="text-sm text-gray-500">In DLQ</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {(['overview', 'credentials', 'dlq', 'test'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'dlq' ? 'DLQ' : tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium">Issuers with External Sync</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registry ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credentials</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {issuers.map((issuer) => (
                                <tr key={issuer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {issuer.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {issuer.registryId || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {issuer.lastSyncAt ? new Date(issuer.lastSyncAt).toLocaleString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {issuer.externalCredentialCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleForceSync(issuer.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                            disabled={!issuer.registryId}
                                        >
                                            Force Sync
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {issuers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No issuers with external sync enabled
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Credentials Tab */}
            {activeTab === 'credentials' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium">External Credentials</h3>
                        <button onClick={() => loadData(true)} className="text-blue-600 hover:text-blue-800 text-sm">
                            Refresh
                        </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Learner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {credentials.map((cred) => (
                                <tr key={cred.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                        {cred.providerCredentialId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded ${cred.status === 'verified' ? 'bg-green-100 text-green-800' :
                                            cred.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {cred.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {cred.signatureVerified ? '✓' : '✗'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cred.matchConfidence ? `${(cred.matchConfidence * 100).toFixed(0)}%` : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cred.issuer}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cred.learner?.email || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(cred.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {credentials.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        No external credentials yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DLQ Tab */}
            {activeTab === 'dlq' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium">Dead Letter Queue</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dlqItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                        {item.job_id.slice(0, 20)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.job_type}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {item.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.attempts}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleRetryDLQ(item.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {dlqItems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No items in DLQ
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium mb-4">Test Webhook</h3>
                    <p className="text-gray-600 mb-4">
                        Send a test credential from the dummy API-Setu server to the webhook endpoint.
                        Make sure the dummy server is running on port 4000.
                    </p>
                    <button
                        onClick={handleTestWebhook}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Trigger Test Webhook
                    </button>
                    {testResult && (
                        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-48">
                            {testResult}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}
