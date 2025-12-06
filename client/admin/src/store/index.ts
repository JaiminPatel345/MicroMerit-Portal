import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import issuerReducer from './issuerSlice';
import employerReducer from './employerSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        issuer: issuerReducer,
        employer: employerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
