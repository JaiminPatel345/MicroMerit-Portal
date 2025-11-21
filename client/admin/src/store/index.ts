import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import issuerReducer from './issuerSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        issuer: issuerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
