import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { issuerAPI } from '../api/issuerAPI.ts';
import type { IssuerProfile, IssuerFilters, RejectIssuerPayload, BlockIssuerPayload } from '../api/issuerAPI.ts';

interface IssuerState {
    issuers: IssuerProfile[];
    selectedIssuer: IssuerProfile | null;
    loading: boolean;
    error: string | null;
    filters: IssuerFilters;
}

const initialState: IssuerState = {
    issuers: [],
    selectedIssuer: null,
    loading: false,
    error: null,
    filters: {},
};

// Async thunks
export const fetchIssuers = createAsyncThunk(
    'issuer/fetchIssuers',
    async (filters: IssuerFilters | undefined, { rejectWithValue }) => {
        try {
            const response = await issuerAPI.getIssuers(filters);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to fetch issuers';
            return rejectWithValue(message);
        }
    }
);

export const approveIssuer = createAsyncThunk(
    'issuer/approveIssuer',
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await issuerAPI.approveIssuer(id);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to approve issuer';
            return rejectWithValue(message);
        }
    }
);

export const rejectIssuer = createAsyncThunk(
    'issuer/rejectIssuer',
    async ({ id, payload }: { id: number; payload: RejectIssuerPayload }, { rejectWithValue }) => {
        try {
            const response = await issuerAPI.rejectIssuer(id, payload);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to reject issuer';
            return rejectWithValue(message);
        }
    }
);

export const blockIssuer = createAsyncThunk(
    'issuer/blockIssuer',
    async ({ id, payload }: { id: number; payload: BlockIssuerPayload }, { rejectWithValue }) => {
        try {
            await issuerAPI.blockIssuer(id, payload);
            return id;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to block issuer';
            return rejectWithValue(message);
        }
    }
);

export const unblockIssuer = createAsyncThunk(
    'issuer/unblockIssuer',
    async (id: number, { rejectWithValue }) => {
        try {
            await issuerAPI.unblockIssuer(id);
            return id;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to unblock issuer';
            return rejectWithValue(message);
        }
    }
);

const issuerSlice = createSlice({
    name: 'issuer',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<IssuerFilters>) => {
            state.filters = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setSelectedIssuer: (state, action: PayloadAction<IssuerProfile | null>) => {
            state.selectedIssuer = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch Issuers
        builder
            .addCase(fetchIssuers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssuers.fulfilled, (state, action: PayloadAction<IssuerProfile[]>) => {
                state.loading = false;
                state.issuers = action.payload;
            })
            .addCase(fetchIssuers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Approve Issuer
        builder
            .addCase(approveIssuer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveIssuer.fulfilled, (state, action: PayloadAction<IssuerProfile>) => {
                state.loading = false;
                const index = state.issuers.findIndex((i) => i.id === action.payload.id);
                if (index !== -1) {
                    state.issuers[index] = action.payload;
                }
            })
            .addCase(approveIssuer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Reject Issuer
        builder
            .addCase(rejectIssuer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectIssuer.fulfilled, (state, action: PayloadAction<IssuerProfile>) => {
                state.loading = false;
                const index = state.issuers.findIndex((i) => i.id === action.payload.id);
                if (index !== -1) {
                    state.issuers[index] = action.payload;
                }
            })
            .addCase(rejectIssuer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Block Issuer
        builder
            .addCase(blockIssuer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(blockIssuer.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                const issuer = state.issuers.find((i) => i.id === action.payload);
                if (issuer) {
                    issuer.is_blocked = true;
                }
            })
            .addCase(blockIssuer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Unblock Issuer
        builder
            .addCase(unblockIssuer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(unblockIssuer.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                const issuer = state.issuers.find((i) => i.id === action.payload);
                if (issuer) {
                    issuer.is_blocked = false;
                }
            })
            .addCase(unblockIssuer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilters, clearError, setSelectedIssuer } = issuerSlice.actions;
export default issuerSlice.reducer;
