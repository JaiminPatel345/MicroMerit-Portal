import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { externalSyncAPI, type ExternalSyncStatus, type SyncJobResult } from '../api/externalSyncAPI';

interface ExternalSyncState {
    viewMode: 'connector' | 'platform';
    syncStatus: ExternalSyncStatus | null;
    syncLoading: boolean;
    syncResults: SyncJobResult[] | null;
    lastError: string | null;
}

const initialState: ExternalSyncState = {
    viewMode: 'connector',
    syncStatus: null,
    syncLoading: false,
    syncResults: null,
    lastError: null,
};

// Async thunks
export const fetchSyncStatus = createAsyncThunk(
    'externalSync/fetchStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await externalSyncAPI.getStatus();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch sync status');
        }
    }
);

export const triggerSync = createAsyncThunk(
    'externalSync/triggerSync',
    async (providerId: string | undefined, { rejectWithValue }) => {
        try {
            const response = await externalSyncAPI.triggerSync(providerId);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Sync failed');
        }
    }
);

const externalSyncSlice = createSlice({
    name: 'externalSync',
    initialState,
    reducers: {
        setViewMode: (state, action: PayloadAction<'connector' | 'platform'>) => {
            state.viewMode = action.payload;
        },
        clearSyncResults: (state) => {
            state.syncResults = null;
        },
        clearError: (state) => {
            state.lastError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSyncStatus.pending, (state) => {
                state.lastError = null;
            })
            .addCase(fetchSyncStatus.fulfilled, (state, action) => {
                state.syncStatus = action.payload;
            })
            .addCase(fetchSyncStatus.rejected, (state, action) => {
                state.lastError = action.payload as string;
            })
            .addCase(triggerSync.pending, (state) => {
                state.syncLoading = true;
                state.lastError = null;
                state.syncResults = null;
            })
            .addCase(triggerSync.fulfilled, (state, action) => {
                state.syncLoading = false;
                state.syncResults = action.payload;
            })
            .addCase(triggerSync.rejected, (state, action) => {
                state.syncLoading = false;
                state.lastError = action.payload as string;
            });
    },
});

export const { setViewMode, clearSyncResults, clearError } = externalSyncSlice.actions;
export default externalSyncSlice.reducer;
