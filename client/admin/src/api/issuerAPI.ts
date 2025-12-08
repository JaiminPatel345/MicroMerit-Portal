import axiosInstance from './axiosInstance';

export type IssuerStatus = 'pending' | 'approved' | 'rejected';
export type IssuerType = 'university' | 'school' | 'training_center' | 'government' | 'corporate' | 'online_platform' | 'other';
export type IssuerSource = 'platform' | 'connector';

export interface IssuerProfile {
    id: number;
    name: string;
    email: string;
    type: IssuerType;
    status: IssuerStatus;
    is_blocked: boolean;
    source?: IssuerSource; // 'platform' for signup issuers, 'connector' for external providers
    logo_url?: string | null;
    website_url?: string | null;
    phone?: string | null;
    contact_person_name?: string | null;
    contact_person_designation?: string | null;
    official_domain?: string | null;
    address?: string | null;
    kyc_document_url?: string | null;
    created_at: string;
}

export interface IssuerFilters {
    status?: IssuerStatus;
    is_blocked?: boolean;
    source?: IssuerSource;
}

export interface RejectIssuerPayload {
    reason: string;
}

export interface BlockIssuerPayload {
    reason: string;
}

export const issuerAPI = {
    getIssuers: async (filters?: IssuerFilters): Promise<{ success: boolean; data: IssuerProfile[] }> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.is_blocked !== undefined) params.append('is_blocked', String(filters.is_blocked));
        if (filters?.source) params.append('source', filters.source);

        const response = await axiosInstance.get(`/admin/issuers?${params.toString()}`);
        return response.data;
    },

    approveIssuer: async (id: number): Promise<{ success: boolean; data: IssuerProfile }> => {
        const response = await axiosInstance.post(`/admin/issuers/${id}/approve`, {});
        return response.data;
    },

    rejectIssuer: async (id: number, payload: RejectIssuerPayload): Promise<{ success: boolean; data: IssuerProfile }> => {
        const response = await axiosInstance.post(`/admin/issuers/${id}/reject`, payload);
        return response.data;
    },

    blockIssuer: async (id: number, payload: BlockIssuerPayload): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`/admin/issuers/${id}/block`, payload);
        return response.data;
    },

    unblockIssuer: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`/admin/issuers/${id}/unblock`, {});
        return response.data;
    },
};
