// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";

import authIssuerReducer from "./authIssuerSlice";
import authLearnerReducer from "./authLearnerSlice";

export const store = configureStore({
  reducer: {
    authIssuer: authIssuerReducer,
    authLearner: authLearnerReducer,
  },
});

export * from "./authIssuerSlice";
export * from "./authLearnerSlice";
