import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  Award,
  TrendingUp,
  Share2,
  Sparkles,
  CheckCircle,
  Code,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Card, CredentialCard } from '../components/Card';
import { AIAnalyzing, Skeleton } from '../components/Loaders';
import { MultiStepLoader } from '../components/MultiStepLoader';
import type { MultiStep } from '../components/MultiStepLoader';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchLearnerById } from '../features/learnerSlice';
import { fetchRecommendations } from '../features/recommendationSlice';
import toast from 'react-hot-toast';

const issuerLogoMap: Record<string, string> = {
  'TechEd India': new URL('../assets/issuers/teched.svg', import.meta.url).href,
  'CodeMaster Academy': new URL('../assets/issuers/codemaster.svg', import.meta.url).href,
  'Web Wizards Institute': new URL('../assets/issuers/webwizards.svg', import.meta.url).href,
  'AI Institute India': new URL('../assets/issuers/ai-institute.svg', import.meta.url).href,
  'DataCamp India': new URL('../assets/issuers/datacamp.svg', import.meta.url).href,
  'Design School India': new URL('../assets/issuers/designschool.svg', import.meta.url).href,
};

type PortfolioProject = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  highlights: string[];
  techStack: string[];
  timeline: string;
  github?: string;
  live?: string;
};

const curatedPortfolio: PortfolioProject[] = [
  {
    id: 'quizzer',
    title: 'Quizzer',
    imageUrl: 'https://opengraph.githubassets.com/1/jaiminpatel345/quizzer',
    description: 'AI powered quiz microservice that adapts to every learner.',
    highlights: [
      'Developed a backend-only TypeScript Node.js microservice leveraging Groq and Gemini AI to generate contextual quizzes.',
      'Implemented production-grade patterns including MongoDB aggregation, rate limiting, and cursor based pagination.',
      'Adaptive learning experience with real-time difficulty calibration based on user performance.',
      'Built leaderboards and analytics dashboards to foster competition and track engagement.',
    ],
    techStack: ['TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Docker', 'Azure'],
    timeline: 'Sept 2025',
    github: 'https://github.com/JaiminPatel345/quizzer',
  },
  {
    id: 'wanderlust',
    title: 'WANDERLUST',
    imageUrl: 'https://res.cloudinary.com/dm4xqk12g/image/upload/v1746385580/Wanderlust_pp6xrp.png',
    description: 'Travel & accommodation booking platform with a delightful experience.',
    highlights: [
      'End-to-end booking flow where travelers can explore, filter, and reserve unique stays.',
      'Rich UI with search, pagination, and MongoDB aggregation for lightning-fast discovery.',
      'Interactive Rive animations on authentication screens for an immersive onboarding.',
      'Owner dashboard with property management plus password reset links delivered via email.',
    ],
    techStack: [
      'JavaScript',
      'React',
      'Node.js',
      'MongoDB',
      'OAuth2',
      'Express.js',
      'Tailwind CSS',
      'Redis',
      'Zustand',
      'Rive',
      'Cloudinary',
      'Git',
      'Azure',
    ],
    timeline: 'Aug – Dec 2023',
    github: 'https://github.com/JaiminPatel345/wanderlust',
    live: 'https://wanderlust.jaimin-detroja.tech/',
  },
];

type OrganizationOption = {
  value: string;
  label: string;
  meta?: string;
};

const ORGANIZATION_OPTIONS: OrganizationOption[] = [
  { value: 'NPTEL', label: 'NPTEL', meta: 'Government of India' },
  { value: 'IBM', label: 'IBM SkillsBuild', meta: 'Global Tech Education' },
  { value: 'Google', label: 'Google Career Certificates' },
  { value: 'Microsoft', label: 'Microsoft Learn' },
  { value: 'Amazon Web Services', label: 'AWS Academy' },
  { value: 'Coursera', label: 'Coursera for Campus' },
  { value: 'Udacity', label: 'Udacity Nanodegree' },
  { value: 'Skill India', label: 'Skill India Digital' },
  { value: 'IIT Bombay', label: 'IIT Bombay Extension' },
  { value: 'Not listed', label: 'Not listed', meta: 'Add a new issuer' },
];

const buildVerificationSteps = (organization: string): MultiStep[] => [
  {
    title: 'Uploading credential',
    description: 'Encrypting your certificate and preparing it for verification.',
  },
  {
    title: 'Validating with issuer',
    description: `Connecting with ${organization || 'the issuer'} to confirm authenticity.`,
  },
  {
    title: 'Anchoring on blockchain',
    description: 'Recording a tamper-proof hash on the SkillChain ledger.',
  },
];

type UploadFormState = {
  title: string;
  organization: string;
  customOrganization: string;
  contactEmail: string;
  issueDate: string;
  file: File | null;
};

const getInitialUploadForm = (): UploadFormState => ({
  title: '',
  organization: '',
  customOrganization: '',
  contactEmail: '',
  issueDate: '',
  file: null,
});

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(size > 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export const LearnerDashboard = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'progress' | 'success'>('idle');
  const [activeVerificationStep, setActiveVerificationStep] = useState(0);
  const [verificationOrganization, setVerificationOrganization] = useState('');
  const [completedUploadMeta, setCompletedUploadMeta] = useState<
    | {
        title: string;
        organization: string;
        issueDate: string;
      }
    | null
  >(null);
  const [organizationDropdownOpen, setOrganizationDropdownOpen] = useState(false);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'credentials' | 'portfolio' | 'pathways'>('credentials');
  const [uploadForm, setUploadForm] = useState<UploadFormState>(getInitialUploadForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const organizationDropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLearner, loading } = useAppSelector((state) => state.learners);
  const { recommendations } = useAppSelector((state) => state.recommendations);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchLearnerById(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!organizationDropdownOpen) {
      setOrganizationSearchTerm('');
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        organizationDropdownRef.current &&
        !organizationDropdownRef.current.contains(event.target as Node)
      ) {
        setOrganizationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [organizationDropdownOpen]);

  const selectedOrganizationOption = ORGANIZATION_OPTIONS.find(
    (option) => option.value === uploadForm.organization,
  );
  const filteredOrganizationOptions = ORGANIZATION_OPTIONS.filter((option) => {
    const searchTerm = organizationSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      return true;
    }
    return (
      option.label.toLowerCase().includes(searchTerm) ||
      option.meta?.toLowerCase().includes(searchTerm)
    );
  });
  const requiresCustomOrganization = uploadForm.organization === 'Not listed';

  const resetUploadFormFields = () => {
    setUploadForm(getInitialUploadForm());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setOrganizationDropdownOpen(false);
    setOrganizationSearchTerm('');
  };

  const resetUploadExperience = () => {
    resetUploadFormFields();
    setUploadStage('idle');
    setActiveVerificationStep(0);
    setVerificationOrganization('');
    setCompletedUploadMeta(null);
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Please attach a credential file to proceed.');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Add a certificate title before uploading.');
      return;
    }

    if (!uploadForm.issueDate) {
      toast.error('Choose the issued date for this credential.');
      return;
    }

    if (!requiresCustomOrganization && !uploadForm.organization) {
      toast.error('Select the issuing organization.');
      return;
    }

    if (requiresCustomOrganization && !uploadForm.customOrganization.trim()) {
      toast.error('Provide the issuing organization name.');
      return;
    }

    const organizationLabel = requiresCustomOrganization
      ? uploadForm.customOrganization.trim()
      : uploadForm.organization;

    const credentialTitle = uploadForm.title.trim() || 'Credential';
    const verificationOrg = organizationLabel || 'the issuer';

    setVerificationOrganization(verificationOrg);
    setUploadStage('progress');
    setActiveVerificationStep(0);

    const stepDurations = [1600, 1900, 1400];
    for (let index = 1; index < stepDurations.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, stepDurations[index - 1]));
      setActiveVerificationStep(index);
    }

    await new Promise((resolve) => setTimeout(resolve, stepDurations.at(-1) ?? 1200));

    setCompletedUploadMeta({
      title: credentialTitle,
      organization: verificationOrg,
      issueDate: uploadForm.issueDate,
    });
    resetUploadFormFields();
    setUploadStage('success');

    toast.success(`${credentialTitle} verified successfully!`, {
      icon: '✅',
      duration: 3500,
    });
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    resetUploadExperience();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const removeSelectedFile = () => {
    setUploadForm((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOrganizationSelect = (value: string) => {
    setUploadForm((prev) => ({
      ...prev,
      organization: value,
      customOrganization: '',
      contactEmail: '',
    }));
    setOrganizationDropdownOpen(false);
    setOrganizationSearchTerm('');
  };

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    setAiModalOpen(true);
    if (user?.id) {
      await dispatch(fetchRecommendations(user.id));
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAnalyzing(false);
  };

  const handleShareProfile = () => {
    const url = currentLearner?.publicProfileUrl || 'https://micromerit.example.com/profile/demo';
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard!', { icon: '🔗' });
  };

  if (loading || !currentLearner) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const credentialsWithLogos = currentLearner.credentials.map((credential) => ({
    ...credential,
    issuerLogo: issuerLogoMap[credential.issuer] ?? credential.issuerLogo ?? '',
  }));

  const verifiedCredentials = credentialsWithLogos.filter((credential) => credential.status === 'verified');
  const portfolioProjects = curatedPortfolio;
  const organizationForPipeline =
    verificationOrganization ||
    (requiresCustomOrganization ? uploadForm.customOrganization : uploadForm.organization);
  const verificationSteps = buildVerificationSteps(organizationForPipeline);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome back, {currentLearner.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">Track your credentials and grow your skills</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share Profile
          </button>
          <button
            onClick={() => {
              resetUploadExperience();
              setUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload Certificate
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl" />
          <div className="relative">
            <Award className="w-10 h-10 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{credentialsWithLogos.length}</p>
            <p className="text-sm text-gray-600">Total Credentials</p>
          </div>
        </Card>

        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/10 rounded-full blur-2xl" />
          <div className="relative">
            <CheckCircle className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {verifiedCredentials.length}
            </p>
            <p className="text-sm text-gray-600">Verified</p>
          </div>
        </Card>

        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <TrendingUp className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{currentLearner.skills.length}</p>
            <p className="text-sm text-gray-600">Skills Acquired</p>
          </div>
        </Card>

        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <Code className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{portfolioProjects.length}</p>
            <p className="text-sm text-gray-600">Projects</p>
          </div>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card glassmorphism className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Skill Recommendations</h2>
              <p className="text-sm text-gray-600">Personalized suggestions based on your profile</p>
            </div>
          </div>
          <button
            onClick={handleAIAnalysis}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
          >
            Analyze Skills
          </button>
        </div>

        {recommendations ? (
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.recommendations.slice(0, 4).map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white rounded-lg border-2 border-purple-100 hover:border-purple-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{rec.skill}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>⏱️ {rec.estimatedTime}</span>
                  <span>📊 NSQF {rec.nsqfLevel}</span>
                  <span>📈 {rec.marketDemand}% demand</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Click "Analyze Skills" to get AI-powered recommendations</p>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['credentials', 'portfolio', 'pathways'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-2 font-semibold rounded-lg transition-all ${
              selectedTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on tab */}
      {selectedTab === 'credentials' && (
        <div className="grid md:grid-cols-2 gap-6">
          {credentialsWithLogos.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onClick={() => navigate(`/learner/credentials/${credential.id}`)}
            />
          ))}
        </div>
      )}

      {selectedTab === 'portfolio' && (
        <div className="grid md:grid-cols-2 gap-6">
          {portfolioProjects.map((project) => (
            <Card key={project.id} hover>
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
                loading="lazy"
              />
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {project.timeline}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{project.description}</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                {project.highlights.map((point, idx) => (
                  <li key={idx}>{point.replace(/\*\*/g, '')}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                {project.github && (
                  <a
                    href={project.github}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Code className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {project.live && (
                  <a
                    href={project.live}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Live Demo
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'pathways' && (
        <div>
          {currentLearner.learningPathways.map((pathway) => (
            <Card key={pathway.id} glassmorphism>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{pathway.pathway}</h3>
                  <p className="text-gray-600">
                    {pathway.completedSkills} of {pathway.totalSkills} skills completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{pathway.progress}%</p>
                  <p className="text-sm text-gray-500">Progress</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pathway.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Next Milestone</p>
                  <p className="text-lg font-bold text-gray-900">{pathway.nextMilestone}</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Est. Completion</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(pathway.estimatedCompletion).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={handleCloseUploadModal}
        title="Upload Certificate"
        size="md"
      >
        {uploadStage === 'progress' ? (
          <MultiStepLoader
            steps={verificationSteps}
            activeStep={activeVerificationStep}
            status="running"
          />
        ) : uploadStage === 'success' && completedUploadMeta ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-900">Credential verified!</h3>
              <p className="text-sm text-slate-600">
                {completedUploadMeta.title} from {completedUploadMeta.organization} is now secured on the blockchain.
              </p>
              {completedUploadMeta.issueDate && (
                <p className="text-sm text-slate-500">
                  Issued on {new Date(completedUploadMeta.issueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={resetUploadExperience}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Upload another
              </button>
              <button
                onClick={handleCloseUploadModal}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:shadow-lg"
              >
                Close modal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 transition-all">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>

                {uploadForm.file ? (
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">{uploadForm.file.name}</p>
                    <p className="text-sm text-slate-500">
                      {uploadForm.file.type.toUpperCase()} · {formatFileSize(uploadForm.file.size)}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Change file
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-slate-900">
                      Drag & drop credential
                    </p>
                    <p className="text-sm text-slate-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse files
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Certificate title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(event) =>
                    setUploadForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g., Advanced React Developer"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Issuing organization</label>
                <div ref={organizationDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setOrganizationDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-4 py-2.5 text-left transition focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  >
                    <span
                      className={`text-sm ${
                        uploadForm.organization ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {selectedOrganizationOption?.label || 'Select organization'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        organizationDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {organizationDropdownOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={organizationSearchTerm}
                          onChange={(event) => setOrganizationSearchTerm(event.target.value)}
                          placeholder="Search organizations"
                          className="w-full border-none p-0 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1">
                        {filteredOrganizationOptions.length > 0 ? (
                          filteredOrganizationOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleOrganizationSelect(option.value)}
                              className={`flex w-full items-start justify-between gap-3 px-4 py-2 text-left text-sm transition ${
                                uploadForm.organization === option.value
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{option.label}</p>
                                {option.meta && (
                                  <p className="text-xs text-slate-500">{option.meta}</p>
                                )}
                              </div>
                              {uploadForm.organization === option.value && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-slate-500">
                            No organizations match "{organizationSearchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {requiresCustomOrganization && (
                <div className="space-y-3 md:col-span-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Organization name
                    </label>
                    <input
                      type="text"
                      value={uploadForm.customOrganization}
                      onChange={(event) =>
                        setUploadForm((prev) => ({ ...prev, customOrganization: event.target.value }))
                      }
                      placeholder="Enter organization name"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Contact email (optional)
                    </label>
                    <input
                      type="email"
                      value={uploadForm.contactEmail}
                      onChange={(event) =>
                        setUploadForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                      }
                      placeholder="organization@email.com"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Issued date</label>
                <input
                  type={uploadForm.issueDate ? 'date' : 'text'}
                  onFocus={(event) => {
                    event.currentTarget.type = 'date';
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.value) {
                      event.currentTarget.type = 'text';
                    }
                  }}
                  value={uploadForm.issueDate}
                  onChange={(event) =>
                    setUploadForm((prev) => ({ ...prev, issueDate: event.target.value }))
                  }
                  placeholder="Issued date"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
            >
              Upload & Verify
            </button>
          </div>
        )}
      </Modal>

      {/* AI Analysis Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Skill Analysis"
        size="lg"
      >
        {analyzing ? (
          <AIAnalyzing />
        ) : recommendations ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-bold mb-4">Skill Gap Analysis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Level</p>
                  <p className="text-lg font-bold text-gray-900">
                    {recommendations.skillGapAnalysis.currentLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Target Level</p>
                  <p className="text-lg font-bold text-gray-900">
                    {recommendations.skillGapAnalysis.targetLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gap</p>
                  <p className="text-lg font-bold text-orange-600">
                    {recommendations.skillGapAnalysis.gapPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time to Target</p>
                  <p className="text-lg font-bold text-blue-600">
                    {recommendations.skillGapAnalysis.timeToTarget}
                  </p>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="text-xl font-bold mb-4">Recommended Skills</h3>
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{rec.skill}</h4>
                      <span className="text-sm font-semibold text-blue-600">
                        {rec.marketDemand}% demand
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.careerImpact}</p>
                    <p className="text-xs text-gray-500">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
