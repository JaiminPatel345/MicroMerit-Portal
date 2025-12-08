import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import issuerReducer from './issuerSlice';
import employerReducer from './employerSlice';
import externalSyncReducer from './externalSyncSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        issuer: issuerReducer,
        employer: employerReducer,
        externalSync: externalSyncReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

