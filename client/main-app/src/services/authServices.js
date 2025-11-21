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
  getCertificates: () => api.get('/credentials/learner/my-credentials'),
};



export const mockIssuerData = {
keys: [
{ id: 'key_abc123', name: 'Production API Key', created: '2024-01-15', lastUsed: '2025-11-19', status: 'Active', key: 'sk-prod-********' },
{ id: 'key_def456', name: 'Testing Sandbox Key', created: '2024-05-01', lastUsed: '2025-09-10', status: 'Active', key: 'sk-test-********' },
{ id: 'key_ghi789', name: 'Old Key (Revoked)', created: '2023-12-01', lastUsed: '2024-03-20', status: 'Revoked', key: 'sk-old-********' },
]
};


export const mockAPI = {
getProfile: async (issuerId) => { await new Promise(r => setTimeout(r, 300)); return null; },
updateProfile: async (updates) => { await new Promise(r => setTimeout(r, 500)); return { success: true, newProfile: { ...updates } }; },
listKeys: async () => { await new Promise(r => setTimeout(r, 400)); return mockIssuerData.keys; },
createKey: async (keyName) => { await new Promise(r => setTimeout(r, 800)); const newId = `key_${Math.random().toString(36).substring(2,8)}`; const fullKey = `sk-new-${Math.random().toString(36).substring(2,20)}`; const newKey = { id: newId, name: keyName, created: new Date().toISOString().substring(0,10), lastUsed: 'Never', status: 'Active', key: fullKey }; mockIssuerData.keys.unshift(newKey); return { success: true, key: newKey }; },
revokeKey: async (keyId) => { await new Promise(r => setTimeout(r, 300)); const idx = mockIssuerData.keys.findIndex(k => k.id === keyId); if (idx !== -1) mockIssuerData.keys[idx].status = 'Revoked'; return { success: true }; }
};
