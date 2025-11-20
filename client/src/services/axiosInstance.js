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

// api.interceptors.request.use((config) => {
//   const state = store.getState();

//   const active =
//     state.authIssuer.isAuthenticated
//       ? state.authIssuer
//       : state.authLearner.isAuthenticated
//       ? state.authLearner
//       : null;

//   if (active?.accessToken) {
//     config.headers.Authorization = `Bearer ${active.accessToken}`;
//   }

//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const original = error.config;

//     if (error.response?.status !== 401 || original._retry) {
//       return Promise.reject(error);
//     }

//     const state = store.getState();
//     const isIssuer = state.authIssuer.isAuthenticated;
//     const active = isIssuer ? state.authIssuer : state.authLearner;

//     if (!active.refreshToken) {
//       isIssuer ? store.dispatch(issuerLogout()) : store.dispatch(learnerLogout());
//       return Promise.reject(error);
//     }

//     if (isRefreshing) {
//       return new Promise((resolve, reject) => {
//         failedQueue.push({ resolve, reject });
//       }).then((token) => {
//         original.headers.Authorization = `Bearer ${token}`;
//         return api(original);
//       });
//     }

//     original._retry = true;
//     isRefreshing = true;

//     try {
//       const refreshUrl = isIssuer
//         ? "/api/issuer/auth/refresh"
//         : "/api/learner/auth/refresh";

//       const res = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}${refreshUrl}`,
//         { refresh_token: active.refreshToken }
//       );

//       const newAccessToken = res.data.data.accessToken;

//       if (isIssuer) {
//         store.dispatch(refreshIssuerTokenSuccess(newAccessToken));
//       } else {
//         store.dispatch(refreshLearnerTokenSuccess(newAccessToken));
//       }

//       processQueue(null, newAccessToken);

//       original.headers.Authorization = `Bearer ${newAccessToken}`;
//       return api(original);
//     } catch (err) {
//       processQueue(err, null);
//       isIssuer ? store.dispatch(issuerLogout()) : store.dispatch(learnerLogout());
//       return Promise.reject(err);
//     } finally {
//       isRefreshing = false;
//     }
//   }
// );
export default api;