import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { employerAPI } from '../api/employerAPI.ts';
import type { EmployerProfile, EmployerFilters, RejectEmployerPayload } from '../api/employerAPI.ts';

interface EmployerState {
    employers: EmployerProfile[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    selectedEmployer: EmployerProfile | null;
    loading: boolean;
    error: string | null;
    filters: EmployerFilters;
}

const initialState: EmployerState = {
    employers: [],
    pagination: { total: 0, page: 1, limit: 10, pages: 0 },
    selectedEmployer: null,
    loading: false,
    error: null,
    filters: {},
};

const getErrorMessage = (error: any, defaultMessage: string) => {
    return error.response?.data?.message || defaultMessage;
};

export const fetchEmployers = createAsyncThunk(
    'employer/fetchEmployers',
    async ({ filters, page, limit }: { filters?: EmployerFilters; page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const response = await employerAPI.getEmployers(filters, page, limit);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, 'Failed to fetch employers'));
        }
    }
);

export const approveEmployer = createAsyncThunk(
    'employer/approveEmployer',
    async (id: number, { rejectWithValue }) => {
        try {
            await employerAPI.approveEmployer(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, 'Failed to approve employer'));
        }
    }
);

export const rejectEmployer = createAsyncThunk(
    'employer/rejectEmployer',
    async ({ id, payload }: { id: number; payload: RejectEmployerPayload }, { rejectWithValue }) => {
        try {
            await employerAPI.rejectEmployer(id, payload);
            return id;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, 'Failed to reject employer'));
        }
    }
);

const employerSlice = createSlice({
    name: 'employer',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<EmployerFilters>) => {
            state.filters = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setSelectedEmployer: (state, action: PayloadAction<EmployerProfile | null>) => {
            state.selectedEmployer = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch
        builder
            .addCase(fetchEmployers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployers.fulfilled, (state, action) => {
                state.loading = false;
                state.employers = action.payload.employers || [];
                state.pagination = {
                    total: action.payload.total || 0,
                    pages: action.payload.pages || 0,
                    page: state.pagination.page,
                    limit: state.pagination.limit
                };
            })
            .addCase(fetchEmployers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Approve
        builder.addCase(approveEmployer.fulfilled, (state, action) => {
            const index = state.employers.findIndex(e => e.id === action.payload);
            if (index !== -1) {
                state.employers[index].status = 'approved';
                state.employers[index].approved_at = new Date().toISOString();
            }
        });

        // Reject
        builder.addCase(rejectEmployer.fulfilled, (state, action) => {
            const index = state.employers.findIndex(e => e.id === action.payload);
            if (index !== -1) {
                state.employers[index].status = 'rejected';
            }
        });
    }
});

export const { setFilters, clearError, setSelectedEmployer } = employerSlice.actions;
export default employerSlice.reducer;
