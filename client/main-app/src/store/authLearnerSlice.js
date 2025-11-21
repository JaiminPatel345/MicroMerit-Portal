import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  learner: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authLearnerSlice = createSlice({
  name: "authLearner",
  initialState,
  reducers: {
    learnerLoginSuccess: (state, action) => {
      state.learner = action.payload.learner;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    learnerUpateProfile: (state, action) => {
      console.log("Updating learner profile in store", action.payload);
      state.learner = action.payload;
    },
    refreshLearnerTokenSuccess: (state, action) => {
      state.accessToken = action.payload;
    },
    learnerLogout: (state) => {
      state.learner = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  learnerLoginSuccess,
  refreshLearnerTokenSuccess,
  learnerLogout,
  learnerUpateProfile,
} = authLearnerSlice.actions;

export default authLearnerSlice.reducer;
