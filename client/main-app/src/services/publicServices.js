import api from './axiosInstance';

export const publicApi = {
    search: (query) => api.get(`/search?q=${query}`),
};
