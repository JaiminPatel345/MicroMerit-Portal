import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AIRecommendation } from '../types';
import { recommendationApi } from '../api';

interface RecommendationState {
  recommendations: AIRecommendation | null;
  loading: boolean;
  analyzing: boolean;
  error: string | null;
}

const initialState: RecommendationState = {
  recommendations: null,
  loading: false,
  analyzing: false,
  error: null,
};

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetch',
  async (learnerId: string) => {
    return await recommendationApi.getRecommendations(learnerId);
  }
);

export const analyzeSkillGap = createAsyncThunk(
  'recommendations/analyzeSkillGap',
  async (learnerId: string) => {
    return await recommendationApi.analyzeSkillGap(learnerId);
  }
);

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
        state.loading = false;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch recommendations';
      })
      .addCase(analyzeSkillGap.pending, (state) => {
        state.analyzing = true;
      })
      .addCase(analyzeSkillGap.fulfilled, (state, action) => {
        state.recommendations = action.payload;
        state.analyzing = false;
      })
      .addCase(analyzeSkillGap.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.error.message || 'Failed to analyze skill gap';
      });
  },
});

export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;
