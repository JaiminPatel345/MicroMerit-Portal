import api from './axiosInstance';

export const issuerServices = {
    // Auth
    startRegistration: async (data) => {
        const response = await api.post('/auth/issuer/start-register', data);
        return response.data;
    },

    verifyRegistration: async (data) => {
        const response = await api.post('/auth/issuer/verify-register', data);
        return response.data;
    },

    login: async (data) => {
        const response = await api.post('/auth/issuer/login', data);
        return response.data;
    },

    refresh: async (refreshToken) => {
        const response = await api.post('/auth/issuer/refresh', { refreshToken });
        return response.data;
    },

    // Profile
    getProfile: async () => {
        const response = await api.get('/issuer/profile');
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await api.get('/issuer/stats');
        return response.data;
    },

    updateProfile: async (formData) => {
        const response = await api.put('/issuer/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // API Keys
    createApiKey: async (data) => {
        const response = await api.post('/issuer/api-keys', data);
        return response.data;
    },

    getApiKeys: async (params) => {
        const response = await api.get('/issuer/api-keys', { params });
        return response.data;
    },

    getApiKeyDetails: async (id) => {
        const response = await api.get(`/issuer/api-keys/${id}`);
        return response.data;
    },

    revokeApiKey: async (id) => {
        const response = await api.delete(`/issuer/api-keys/${id}`);
        return response.data;
    },
};
