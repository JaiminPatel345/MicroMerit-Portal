import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Analytics } from '../types';
import { analyticsApi } from '../api';

interface AnalyticsState {
  data: Analytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async () => {
  return await analyticsApi.getAnalytics();
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      });
  },
});

export default analyticsSlice.reducer;
