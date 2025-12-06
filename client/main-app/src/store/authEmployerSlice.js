import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    employer: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
};

const authEmployerSlice = createSlice({
    name: "authEmployer",
    initialState,
    reducers: {
        employerLoginSuccess: (state, action) => {
            state.employer = action.payload.employer;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        },
        updateEmployerProfile: (state, action) => {
            state.employer = { ...state.employer, ...action.payload };
        },
        refreshEmployerTokenSuccess: (state, action) => {
            state.accessToken = action.payload;
            state.isAuthenticated = true;
        },
        employerLogout: (state) => {
            state.employer = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const {
    employerLoginSuccess,
    employerLogout,
    updateEmployerProfile,
    refreshEmployerTokenSuccess,
} = authEmployerSlice.actions;

export default authEmployerSlice.reducer;
