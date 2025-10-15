import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import learnerReducer from '../features/learnerSlice';
import recommendationReducer from '../features/recommendationSlice';
import analyticsReducer from '../features/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    learners: learnerReducer,
    recommendations: recommendationReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
