import axiosInstance from './axiosInstance';

export interface SyncState {
    provider_id: string;
    last_sync_at: string;
    last_successful_sync_at?: string;
    credentials_synced: number;
    errors: string[];
    status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface ProviderInfo {
    id: string;
    name: string;
    enabled: boolean;
    has_issuer: boolean;
    sync_state?: SyncState;
}

export interface SchedulerStatus {
    running: boolean;
    interval_hours: number;
    is_syncing: boolean;
    last_sync_at: string | null;
    next_sync_at: string | null;
    started_at: string | null;
}

export interface ExternalSyncStatus {
    scheduler: SchedulerStatus;
    providers: ProviderInfo[];
}

export interface SyncJobResult {
    provider_id: string;
    credentials_processed: number;
    credentials_created: number;
    credentials_skipped: number;
    errors: string[];
    started_at: string;
    completed_at: string;
    duration_ms: number;
}

export const externalSyncAPI = {
    getStatus: async (): Promise<{ success: boolean; data: ExternalSyncStatus }> => {
        const response = await axiosInstance.get('/admin/external-sync/status');
        return response.data;
    },

    getProviders: async (): Promise<{ success: boolean; data: ProviderInfo[] }> => {
        const response = await axiosInstance.get('/admin/external-sync/providers');
        return response.data;
    },

    triggerSync: async (providerId?: string): Promise<{ success: boolean; data: SyncJobResult[] }> => {
        const response = await axiosInstance.post('/admin/external-sync/trigger', {
            provider_id: providerId
        });
        return response.data;
    },

    startScheduler: async (): Promise<{ success: boolean; data: SchedulerStatus }> => {
        const response = await axiosInstance.post('/admin/external-sync/scheduler/start');
        return response.data;
    },

    stopScheduler: async (): Promise<{ success: boolean; data: SchedulerStatus }> => {
        const response = await axiosInstance.post('/admin/external-sync/scheduler/stop');
        return response.data;
    },
};
