import api from './axiosInstance';

// Learner Auth Services
export const signUpLeaner = {
  start: (payload) => api.post('/auth/learner/start-register', payload),
  verify: (payload) => api.post('/auth/learner/verify-otp', payload),
};

export const completeProfile = {
  complete: (payload, config) =>
    api.post('/auth/learner/complete-register', payload, config),
};

export const loginLearner = {
  login: (payload) => api.post('/auth/learner/login', payload),
};

export const oauthGoogleLogin = {
  oauth: () => api.get('/auth/learner/oauth/google'),
  callback: (code) => api.get(`/auth/learner/oauth/google/callback?code=${code}`),
};

export const oauthDigilockerLogin = {
  oauth: () => api.get('/auth/learner/oauth/digilocker'),
};

// Forgot Password Services
export const forgotPasswordLearner = {
  start: (payload) => api.post('/auth/learner/forgot-password', payload),
  verify: (payload) => api.post('/auth/learner/verify-reset-otp', payload),
  reset: (payload) => api.post('/auth/learner/reset-password', payload),
  resend: (payload) => api.post('/auth/learner/resend-otp', payload),
};

export const forgotPasswordEmployer = {
  start: (payload) => api.post('/auth/employer/forgot-password', payload),
  verify: (payload) => api.post('/auth/employer/verify-reset-otp', payload),
  reset: (payload) => api.post('/auth/employer/reset-password', payload),
  resend: (payload) => api.post('/auth/employer/resend-otp', payload),
};

export const forgotPasswordIssuer = {
  start: (payload) => api.post('/auth/issuer/forgot-password', payload),
  verify: (payload) => api.post('/auth/issuer/verify-reset-otp', payload),
  reset: (payload) => api.post('/auth/issuer/reset-password', payload),
  resend: (payload) => api.post('/auth/issuer/resend-otp', payload),
};

// Issuer Auth Services
export const signInIssuer = {
  start: (payload) => api.post('/auth/issuer/start-register', payload),
  verify: (payload) => api.post('/auth/issuer/verify-register', payload),
};

export const loginIssuer = {
  login: (payload) => api.post('/auth/issuer/login', payload),
};


// Leaner APIS
export const learnerApi = {
  getProfile: () => api.get('/learner/profile'),
  updateProfile: (payload) => api.put('/learner/profile', payload),
  getCertificates: (params) => api.get('/learner/credentials', { params }),
  getDashboard: () => api.get('/learner/dashboard'),
  getCredential: (id) => api.get(`/learner/credentials/${id}`),
  getPublicProfile: (id) => api.get(`/learner/public/${id}`),
  getRoadmap: () => api.get('/learner/roadmap'),
  getSkillProfile: () => api.get('/learner/skill-profile'),
  getPublicProfile: (id, params) => api.get(`/learner/public/${id}`, { params }),
  getPublicCredential: (id) => api.get(`/credentials/public/${id}`),
};

export const employerApi = {
  login: (payload) => api.post('/auth/employer/login', payload),
  register: (payload) => api.post('/auth/employer/register', payload),
  getProfile: () => api.get('/employer/me'),
  updateProfile: (payload) => api.put('/employer/me', payload),
  getDashboardStats: () => api.get('/employer/dashboard'),
  verifyCredential: (payload) => api.post('/employer/verify', payload),
  bulkVerify: (payload) => api.post('/employer/verify/bulk', payload),
  searchCandidates: (params) => api.get('/employer/search', { params }),
  verifyEmail: (payload) => api.post('/auth/employer/verify-email', payload),
  extractIdFromDoc: (formData) => api.post('/employer/extract-id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  bulkVerifyUpload: (formData) => api.post('/employer/bulk-verify-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  chatWithLearner: (payload) => api.post('/employer/chat', payload),
};



