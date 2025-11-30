import axios from "axios";
import { store } from "../store/store";

import {
  issuerLogout,
  refreshIssuerTokenSuccess,
} from "../store/authIssuerSlice";

import {
  learnerLogout,
  refreshLearnerTokenSuccess,
} from "../store/authLearnerSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const state = store.getState();
  const url = config.url || '';

  let token = null;

  // Determine which token to use based on URL
  if (url.startsWith('/learner') || url.startsWith('/auth/learner') || url.startsWith('/ai')) {
    // Prioritize Learner token for learner-specific routes
    if (state.authLearner.isAuthenticated) {
      token = state.authLearner.accessToken;
    }
  } else if (url.startsWith('/issuer') || url.startsWith('/auth/issuer')) {
    // Prioritize Issuer token for issuer-specific routes
    if (state.authIssuer.isAuthenticated) {
      token = state.authIssuer.accessToken;
    }
  }

  // Fallback: If no specific URL match or token not found yet, use default priority
  if (!token) {
    const active =
      state.authIssuer.isAuthenticated
        ? state.authIssuer
        : state.authLearner.isAuthenticated
          ? state.authLearner
          : null;

    if (active?.accessToken) {
      token = active.accessToken;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const state = store.getState();
    const url = original.url || '';

    // Determine which token to refresh based on URL, similar to request interceptor
    let isIssuer = false;

    if (url.startsWith('/issuer') || url.startsWith('/auth/issuer')) {
      isIssuer = true;
    } else if (url.startsWith('/learner') || url.startsWith('/auth/learner') || url.startsWith('/ai')) {
      isIssuer = false;
    } else {
      // Fallback for ambiguous URLs
      isIssuer = state.authIssuer.isAuthenticated;
    }

    const active = isIssuer ? state.authIssuer : state.authLearner;

    if (!active.refreshToken) {
      isIssuer ? store.dispatch(issuerLogout()) : store.dispatch(learnerLogout());
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshUrl = isIssuer
        ? "/auth/issuer/refresh"
        : "/auth/learner/refresh";

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}${refreshUrl}`,
        { refreshToken: active.refreshToken }
      );

      const newAccessToken = res.data.data.accessToken;

      if (isIssuer) {
        store.dispatch(refreshIssuerTokenSuccess(newAccessToken));
      } else {
        store.dispatch(refreshLearnerTokenSuccess(newAccessToken));
      }

      processQueue(null, newAccessToken);

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      isIssuer ? store.dispatch(issuerLogout()) : store.dispatch(learnerLogout());
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
export default api;