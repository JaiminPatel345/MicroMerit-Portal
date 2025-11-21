import axiosInstance from './axiosInstance';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AdminProfile {
    id: number;
    email: string;
    created_at: string;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        admin: AdminProfile;
        tokens: TokenResponse;
    };
}

export const authAPI = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await axiosInstance.post('/auth/admin/login', credentials);
        return response.data;
    },

    refresh: async (refreshToken: string): Promise<{ success: boolean; data: TokenResponse }> => {
        const response = await axiosInstance.post('/auth/admin/refresh', { refreshToken });
        return response.data;
    },

    getProfile: async (): Promise<{ success: boolean; data: AdminProfile }> => {
        const response = await axiosInstance.get('/admin/profile');
        return response.data;
    },
};
