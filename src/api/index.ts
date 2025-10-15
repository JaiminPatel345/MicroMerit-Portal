import type { Learner, Issuer, CredentialTemplate, AIRecommendation, Analytics } from '../types';
import learnersData from '../data/learners.json';
import issuersData from '../data/issuers.json';
import credentialsData from '../data/credentials.json';
import recommendationsData from '../data/recommendations.json';
import analyticsData from '../data/analytics.json';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Learner API
export const learnerApi = {
  getLearners: async (): Promise<Learner[]> => {
    await delay(800);
    return learnersData as Learner[];
  },

  getLearnerById: async (id: string): Promise<Learner | null> => {
    await delay(600);
    const learner = learnersData.find(l => l.id === id);
    return learner ? (learner as Learner) : null;
  },

  updateLearnerProfile: async (id: string, updates: Partial<Learner>): Promise<Learner> => {
    await delay(1000);
    const learner = learnersData.find(l => l.id === id);
    if (!learner) throw new Error('Learner not found');
    return { ...learner, ...updates } as Learner;
  },

  uploadCredential: async (_learnerId: string, _file: File): Promise<{ success: boolean; credentialId: string }> => {
    await delay(2500); // Longer delay to simulate verification
    return {
      success: true,
      credentialId: `C${Date.now()}`
    };
  }
};

// Issuer API
export const issuerApi = {
  getIssuers: async (): Promise<Issuer[]> => {
    await delay(700);
    return issuersData as Issuer[];
  },

  getIssuerById: async (id: string): Promise<Issuer | null> => {
    await delay(500);
    const issuer = issuersData.find(i => i.id === id);
    return issuer ? (issuer as Issuer) : null;
  },

  issueCredential: async (_issuerId: string, _learnerId: string, _credentialId: string): Promise<{ success: boolean }> => {
    await delay(1500);
    return { success: true };
  }
};

// Credential API
export const credentialApi = {
  getCredentials: async (): Promise<CredentialTemplate[]> => {
    await delay(600);
    return credentialsData as CredentialTemplate[];
  },

  getCredentialById: async (id: string): Promise<CredentialTemplate | null> => {
    await delay(500);
    const credential = credentialsData.find(c => c.id === id);
    return credential ? (credential as CredentialTemplate) : null;
  },

  verifyCredential: async (_credentialId: string): Promise<{ verified: boolean; blockchainHash: string }> => {
    await delay(1800);
    return {
      verified: true,
      blockchainHash: `0x${Math.random().toString(16).slice(2)}`
    };
  }
};

// AI Recommendations API
export const recommendationApi = {
  getRecommendations: async (learnerId: string): Promise<AIRecommendation | null> => {
    await delay(2000); // Longer delay to simulate AI processing
    const recommendation = recommendationsData.find(r => r.learnerId === learnerId);
    return recommendation ? (recommendation as AIRecommendation) : null;
  },

  analyzeSkillGap: async (learnerId: string): Promise<AIRecommendation | null> => {
    await delay(2500); // Simulate complex AI analysis
    const recommendation = recommendationsData.find(r => r.learnerId === learnerId);
    return recommendation ? (recommendation as AIRecommendation) : null;
  }
};

// Analytics API
export const analyticsApi = {
  getAnalytics: async (): Promise<Analytics> => {
    await delay(900);
    return analyticsData as Analytics;
  },

  searchLearners: async (query: {
    skill?: string;
    nsqfLevel?: number;
    issuer?: string;
  }): Promise<Learner[]> => {
    await delay(1000);
    let filtered = learnersData as Learner[];

    if (query.skill) {
      filtered = filtered.filter(learner =>
        learner.skills.some(s => s.name.toLowerCase().includes(query.skill!.toLowerCase()))
      );
    }

    if (query.nsqfLevel) {
      filtered = filtered.filter(learner =>
        learner.credentials.some(c => c.nsqfLevel === query.nsqfLevel)
      );
    }

    return filtered;
  }
};

// Auth API (dummy)
export const authApi = {
  login: async (_email: string, _password: string, role: 'learner' | 'issuer' | 'employer'): Promise<{ user: Learner | Issuer; role: string }> => {
    await delay(1200);
    
    if (role === 'learner') {
      return {
        user: learnersData[0] as Learner,
        role: 'learner'
      };
    } else if (role === 'issuer') {
      return {
        user: issuersData[0] as Issuer,
        role: 'issuer'
      };
    }
    
    // For employer, return a learner for demo
    return {
      user: learnersData[0] as Learner,
      role: 'employer'
    };
  },

  logout: async (): Promise<void> => {
    await delay(300);
  }
};
