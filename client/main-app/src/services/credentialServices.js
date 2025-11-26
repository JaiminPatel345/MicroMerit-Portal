import api from './axiosInstance';

export const credentialServices = {
    // Issuer
    issueCredential: async (data) => {
        const response = await api.post('/credentials/issue', data);
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

    generateUid: async () => {
        const response = await api.get('/credentials/generate-uid');
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
};
