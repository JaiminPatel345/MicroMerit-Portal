import axiosInstance from './axiosInstance';

export type EmployerStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

export interface EmployerProfile {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    company_website?: string;
    company_address?: string;
    industry_type?: string;
    company_size?: string;
    contact_person?: string;
    status: EmployerStatus;
    company_doc_url?: string | null;
    rejected_reason?: string | null;
    approved_at?: string | null;
    created_at: string;
}

export interface EmployerFilters {
    status?: EmployerStatus;
    search?: string;
}

export interface RejectEmployerPayload {
    reason: string;
}

export const employerAPI = {
    getEmployers: async (filters?: EmployerFilters, page = 1, limit = 10): Promise<{ success: boolean; data: { employers: EmployerProfile[], total: number, pages: number } }> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await axiosInstance.get(`/admin/employers?${params.toString()}`);
        return response.data;
    },

    approveEmployer: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`/admin/employers/${id}/approve`, {});
        return response.data;
    },

    rejectEmployer: async (id: number, payload: RejectEmployerPayload): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`/admin/employers/${id}/reject`, payload);
        return response.data;
    },
};
