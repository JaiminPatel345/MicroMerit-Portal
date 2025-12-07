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

import {
  employerLogout,
  refreshEmployerTokenSuccess,
} from "../store/authEmployerSlice";

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
  } else if (url.startsWith('/employer') || url.startsWith('/auth/employer')) {
    // Prioritize Employer token for employer-specific routes
    if (state.authEmployer.isAuthenticated) {
      token = state.authEmployer.accessToken;
    }
  }

  // Fallback: If no specific URL match or token not found yet, use default priority
  if (!token) {
    const active =
      state.authIssuer.isAuthenticated
        ? state.authIssuer
        : state.authEmployer.isAuthenticated
          ? state.authEmployer
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

    let isIssuer = false;
    let isEmployer = false;

    if (url.startsWith('/issuer') || url.startsWith('/auth/issuer')) {
      isIssuer = true;
    } else if (url.startsWith('/employer') || url.startsWith('/auth/employer')) {
      isEmployer = true;
    } else if (url.startsWith('/learner') || url.startsWith('/auth/learner') || url.startsWith('/ai')) {
      isIssuer = false;
      isEmployer = false;
    } else {
      // Fallback
      isIssuer = state.authIssuer.isAuthenticated;
      isEmployer = state.authEmployer.isAuthenticated;
    }

    const active = isIssuer ? state.authIssuer : (isEmployer ? state.authEmployer : state.authLearner);

    if (!active.refreshToken) {
      if (isIssuer) store.dispatch(issuerLogout());
      else if (isEmployer) store.dispatch(employerLogout());
      else store.dispatch(learnerLogout());
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
        : (isEmployer ? "/auth/employer/refresh" : "/auth/learner/refresh");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}${refreshUrl}`,
        { refreshToken: active.refreshToken }
      );

      // Adjust based on response structure. Usually res.data.data.accessToken or res.data.accessToken
      // Learner: res.data.data.accessToken (based on other code)
      // Employer service return tokens object directly in data? Controller says res.json({ success: true, data: tokens })
      // Tokens object has { accessToken, refreshToken }. We might need to update both?
      // For now assume standard access token update.
      const newAccessToken = res.data.data.accessToken || res.data.data;

      if (isIssuer) {
        store.dispatch(refreshIssuerTokenSuccess(newAccessToken));
      } else if (isEmployer) {
        store.dispatch(refreshEmployerTokenSuccess(newAccessToken));
      } else {
        store.dispatch(refreshLearnerTokenSuccess(newAccessToken));
      }

      processQueue(null, newAccessToken);

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      if (isIssuer) store.dispatch(issuerLogout());
      else if (isEmployer) store.dispatch(employerLogout());
      else store.dispatch(learnerLogout());
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
export default api;