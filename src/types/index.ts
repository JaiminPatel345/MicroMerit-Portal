export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  nsqfLevel: number;
  verified: boolean;
}

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  issuerLogo: string;
  issueDate: string;
  expiryDate: string | null;
  nsqfLevel: number;
  status: 'verified' | 'pending' | 'rejected';
  blockchainHash: string | null;
  skills: string[];
  credentialUrl: string;
}

export interface Portfolio {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl: string;
}

export interface LearningPathway {
  id: string;
  pathway: string;
  progress: number;
  totalSkills: number;
  completedSkills: number;
  nextMilestone: string;
  estimatedCompletion: string;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'learner';
  skills: Skill[];
  credentials: Credential[];
  portfolio: Portfolio[];
  learningPathways: LearningPathway[];
  publicProfileUrl: string;
}

export interface Issuer {
  id: string;
  name: string;
  email: string;
  logo: string;
  type: string;
  accreditation: string;
  founded: string;
  coursesOffered: number;
  credentialsIssued: number;
  description: string;
  website: string;
  rating: number;
  verifiedBy: string;
}

export interface CredentialTemplate {
  id: string;
  title: string;
  description: string;
  issuer: string;
  issuerId: string;
  nsqfLevel: number;
  category: string;
  duration: string;
  skills: string[];
  prerequisites: string[];
  learningOutcomes: string[];
}

export interface Recommendation {
  skill: string;
  reason: string;
  nsqfLevel: number;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  relatedCredentials: string[];
  careerImpact: string;
  marketDemand: number;
}

export interface SkillGapAnalysis {
  currentLevel: string;
  targetLevel: string;
  gapPercentage: number;
  strengthAreas: string[];
  improvementAreas: string[];
  timeToTarget: string;
}

export interface AIRecommendation {
  id: string;
  learnerId: string;
  recommendations: Recommendation[];
  skillGapAnalysis: SkillGapAnalysis;
}

export interface SkillDemand {
  skill: string;
  demand: number;
  growth: number;
  avgSalary: string;
}

export interface IndustryTrend {
  month: string;
  webDev: number;
  aiMl: number;
  design: number;
  cloud: number;
}

export interface NSQFDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface TopEmployer {
  name: string;
  hirings: number;
  topSkills: string[];
  avgPackage: string;
}

export interface VerificationStats {
  totalCredentials: number;
  verified: number;
  pending: number;
  rejected: number;
  verificationRate: number;
  avgVerificationTime: string;
}

export interface PlatformStats {
  totalLearners: number;
  activeIssuers: number;
  totalCredentials: number;
  totalSkills: number;
  partnerEmployers: number;
  monthlyGrowth: number;
}

export interface Analytics {
  skillDemand: SkillDemand[];
  industryTrends: IndustryTrend[];
  nsqfDistribution: NSQFDistribution[];
  topEmployers: TopEmployer[];
  verificationStats: VerificationStats;
  platformStats: PlatformStats;
}

export type UserRole = 'learner' | 'issuer' | 'employer' | null;

export interface AuthState {
  user: Learner | Issuer | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
}
