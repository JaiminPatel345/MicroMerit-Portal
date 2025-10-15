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
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Card, CredentialCard } from '../components/Card';
import { AIAnalyzing, VerifyingAnimation, Skeleton } from '../components/Loaders';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchLearnerById } from '../features/learnerSlice';
import { fetchRecommendations } from '../features/recommendationSlice';
import toast from 'react-hot-toast';

const ORGANIZATION_OPTIONS = ['Not listed', 'NPTEL', 'IBM', 'NASSCOM', 'Skill India', 'IIT Bombay'];

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
  organization: ORGANIZATION_OPTIONS[0],
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
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'credentials' | 'portfolio' | 'pathways'>('credentials');
  const [uploadForm, setUploadForm] = useState<UploadFormState>(getInitialUploadForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const requiresCustomOrganization = uploadForm.organization === 'Not listed';

  const resetUploadForm = () => {
    setUploadForm(getInitialUploadForm());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (requiresCustomOrganization && !uploadForm.customOrganization.trim()) {
      toast.error('Provide the issuing organization name.');
      return;
    }

    setUploading(true);
    // Simulate upload and verification
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setUploading(false);
    resetUploadForm();
    setUploadModalOpen(false);
    toast.success(`${uploadForm.title || 'Credential'} uploaded and verified successfully!`, {
      icon: '✅',
      duration: 4000,
    });
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    resetUploadForm();
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
            onClick={() => setUploadModalOpen(true)}
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
            <p className="text-3xl font-bold text-gray-900">{currentLearner.credentials.length}</p>
            <p className="text-sm text-gray-600">Total Credentials</p>
          </div>
        </Card>

        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/10 rounded-full blur-2xl" />
          <div className="relative">
            <CheckCircle className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {currentLearner.credentials.filter((c) => c.status === 'verified').length}
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
            <p className="text-3xl font-bold text-gray-900">{currentLearner.portfolio.length}</p>
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
          {currentLearner.credentials.map((credential) => (
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
          {currentLearner.portfolio.map((project) => (
            <Card key={project.id} hover>
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Code className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
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
        {uploading ? (
          <VerifyingAnimation />
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
                <select
                  value={uploadForm.organization}
                  onChange={(event) =>
                    setUploadForm((prev) => ({ ...prev, organization: event.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition bg-white"
                >
                  {ORGANIZATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
