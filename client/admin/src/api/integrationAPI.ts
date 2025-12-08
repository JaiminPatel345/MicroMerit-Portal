import axiosInstance from './axiosInstance';

export const forceSync = async () => {
    const response = await axiosInstance.post('/integrations/admin/sync-all');
    return response.data;
};
