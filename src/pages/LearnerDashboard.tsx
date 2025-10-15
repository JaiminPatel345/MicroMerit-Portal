import { useState, useEffect } from 'react';
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

export const LearnerDashboard = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'credentials' | 'portfolio' | 'pathways'>('credentials');
  
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLearner, loading } = useAppSelector((state) => state.learners);
  const { recommendations } = useAppSelector((state) => state.recommendations);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchLearnerById(user.id));
    }
  }, [dispatch, user?.id]);

  const handleUpload = async () => {
    setUploading(true);
    // Simulate upload and verification
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setUploading(false);
    setUploadModalOpen(false);
    toast.success('Credential uploaded and verified successfully!', {
      icon: '✅',
      duration: 4000,
    });
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
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <Award className="w-10 h-10 text-teal-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{currentLearner.credentials.length}</p>
            <p className="text-sm text-gray-600">Total Credentials</p>
          </div>
        </Card>

        <Card glassmorphism className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <CheckCircle className="w-10 h-10 text-emerald-600 mb-2" />
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
              onClick={() => toast('Credential details opened!')}
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
        onClose={() => setUploadModalOpen(false)}
        title="Upload Certificate"
        size="md"
      >
        {uploading ? (
          <VerifyingAnimation />
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-all cursor-pointer">
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drop your certificate here or click to browse
              </p>
              <p className="text-sm text-gray-500">Supports PDF, JPG, PNG (Max 10MB)</p>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Certificate Title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                placeholder="Issuing Organization"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="date"
                placeholder="Issue Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
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
