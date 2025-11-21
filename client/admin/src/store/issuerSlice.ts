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

// Helper to extract detailed error messages
const getErrorMessage = (error: any, defaultMessage: string) => {
    const data = error.response?.data;
    let message = data?.message || defaultMessage;

    if (data?.error) {
        try {
            // Try to parse if it's a stringified JSON
            const parsed = typeof data.error === 'string' ? JSON.parse(data.error) : data.error;

            if (Array.isArray(parsed)) {
                // Handle Zod errors array
                const details = parsed.map((e: any) => e.message).join(', ');
                if (details) {
                    message = `${message}: ${details}`;
                }
            } else if (typeof parsed === 'string') {
                message = `${message}: ${parsed}`;
            } else if (parsed.message) {
                message = `${message}: ${parsed.message}`;
            }
        } catch (e) {
            // Fallback if parsing fails but it's a string
            if (typeof data.error === 'string') {
                message = `${message}: ${data.error}`;
            }
        }
    }
    return message;
};

// Async thunks
export const fetchIssuers = createAsyncThunk(
    'issuer/fetchIssuers',
    async (filters: IssuerFilters | undefined, { rejectWithValue }) => {
        try {
            const response = await issuerAPI.getIssuers(filters);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, 'Failed to fetch issuers'));
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
            return rejectWithValue(getErrorMessage(error, 'Failed to approve issuer'));
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
            return rejectWithValue(getErrorMessage(error, 'Failed to reject issuer'));
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
            return rejectWithValue(getErrorMessage(error, 'Failed to block issuer'));
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
            return rejectWithValue(getErrorMessage(error, 'Failed to unblock issuer'));
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
