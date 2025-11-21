import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  issuer: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authIssuerSlice = createSlice({
  name: "authIssuer",
  initialState,
  reducers: {
    issuerLoginSuccess: (state, action) => {
      state.issuer = action.payload.issuer;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    refreshIssuerTokenSuccess: (state, action) => {
      state.accessToken = action.payload;
    },
    issuerLogout: (state) => {
      state.issuer = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  issuerLoginSuccess,
  refreshIssuerTokenSuccess,
  issuerLogout,
} = authIssuerSlice.actions;

export default authIssuerSlice.reducer;
