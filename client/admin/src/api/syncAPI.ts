import axiosInstance from './axiosInstance';

// Get sync stats
export const getSyncStats = async () => {
    const response = await axiosInstance.get('/admin/sync/stats');
    return response.data;
};

// List issuers with sync status
export const getSyncIssuers = async () => {
    const response = await axiosInstance.get('/admin/sync/issuers');
    return response.data;
};

// List external credentials
export const getExternalCredentials = async (params?: {
    status?: string;
    issuerId?: number;
    limit?: number;
    offset?: number;
}) => {
    const response = await axiosInstance.get('/admin/sync/external-credentials', { params });
    return response.data;
};

// List DLQ items
export const getDLQItems = async (params?: { limit?: number; offset?: number }) => {
    const response = await axiosInstance.get('/admin/sync/dlq', { params });
    return response.data;
};

// Retry DLQ item
export const retryDLQItem = async (id: string) => {
    const response = await axiosInstance.post(`/admin/sync/dlq/${id}/retry`);
    return response.data;
};

// Force sync for issuer
export const forceSyncIssuer = async (issuerId: number, fullSync = false) => {
    const response = await axiosInstance.post(`/admin/sync/issuers/${issuerId}/sync`, { fullSync });
    return response.data;
};

// Get pending matches
export const getPendingMatches = async (params?: { limit?: number }) => {
    const response = await axiosInstance.get('/admin/sync/pending-matches', { params });
    return response.data;
};

// Trigger test webhook (via dummy server)
export const triggerTestWebhook = async (provider = 'provider-a', credentialId?: string) => {
    const dummyUrl = import.meta.env.VITE_DUMMY_APISETU_URL || 'http://localhost:4000';
    const response = await fetch(`${dummyUrl}/admin/push-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, credential_id: credentialId }),
    });
    return response.json();
};
