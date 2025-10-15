import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Learner } from '../types';
import { learnerApi } from '../api';

interface LearnerState {
  learners: Learner[];
  currentLearner: Learner | null;
  loading: boolean;
  error: string | null;
}

const initialState: LearnerState = {
  learners: [],
  currentLearner: null,
  loading: false,
  error: null,
};

export const fetchLearners = createAsyncThunk('learners/fetchAll', async () => {
  return await learnerApi.getLearners();
});

export const fetchLearnerById = createAsyncThunk('learners/fetchById', async (id: string) => {
  return await learnerApi.getLearnerById(id);
});

export const uploadCredential = createAsyncThunk(
  'learners/uploadCredential',
  async ({ learnerId, file }: { learnerId: string; file: File }) => {
    return await learnerApi.uploadCredential(learnerId, file);
  }
);

const learnerSlice = createSlice({
  name: 'learners',
  initialState,
  reducers: {
    setCurrentLearner: (state, action) => {
      state.currentLearner = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearners.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLearners.fulfilled, (state, action) => {
        state.learners = action.payload;
        state.loading = false;
      })
      .addCase(fetchLearners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch learners';
      })
      .addCase(fetchLearnerById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLearnerById.fulfilled, (state, action) => {
        state.currentLearner = action.payload;
        state.loading = false;
      })
      .addCase(fetchLearnerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch learner';
      });
  },
});

export const { setCurrentLearner } = learnerSlice.actions;
export default learnerSlice.reducer;
