import api from './axiosInstance';

export const credentialServices = {
    // Issuer
    issueCredential: async (data) => {
        const response = await api.post('/credentials/issue', data);
        return response.data;
    },

    analyzeCredential: async (data) => {
        const response = await api.post('/credentials/analyze', data);
        return response.data;
    },

    revokeCredential: async (data) => {
        const response = await api.post('/credentials/revoke', data);
        return response.data;
    },

    getIssuerCredentials: async (params) => {
        const response = await api.get('/credentials/issuer/my-credentials', { params });
        return response.data;
    },

    verifyNSQFAlignment: async (credentialId, data) => {
        const response = await api.put(`/credentials/${credentialId}/nsqf-verification`, data);
        return response.data;
    },

    getIssuerRecipients: async () => {
        const response = await api.get('/credentials/issuer/recipients');
        return response.data;
    },

    generateUid: async () => {
        const response = await api.get('/credentials/generate-uid');
        return response.data;
    },

    getBlockchainStatus: async (credentialId) => {
        const response = await api.get(`/credentials/${credentialId}/blockchain-status`);
        return response.data;
    },

    // Learner
    claimCredential: async (data) => {
        const response = await api.post('/credentials/claim', data);
        return response.data;
    },

    getLearnerCredentials: async (params) => {
        const response = await api.get('/credentials/learner/my-credentials', { params });
        return response.data;
    },

    // Public
    getCredential: async (uid) => {
        const response = await api.get(`/credentials/${uid}`);
        return response.data;
    },

    getLatestCredentials: async () => {
        const response = await api.get('/credentials/latest');
        return response.data;
    },

    getTopIssuers: async (limit = 5) => {
        const response = await api.get('/credentials/top-issuers', { params: { limit } });
        return response.data;
    },
};
