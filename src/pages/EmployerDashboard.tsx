import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, TrendingUp, Users, BadgeCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { VerifyingAnimation } from '../components/Loaders';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchLearners } from '../features/learnerSlice';
import { fetchAnalytics } from '../features/analyticsSlice';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export const EmployerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  
  const dispatch = useAppDispatch();
  const { learners, loading } = useAppSelector((state) => state.learners);
  const { data: analytics } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchLearners());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleVerifyCredential = async () => {
    setVerifying(true);
    setVerificationSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setVerifying(false);
    setVerificationSuccess(true);
    toast.success('Credential verified on blockchain!', { icon: '✅' });
  };

  const handleCloseVerifyModal = () => {
    setVerifyModalOpen(false);
    setVerifying(false);
    setVerificationSuccess(false);
    setSelectedLearner(null);
  };

  const filteredLearners = learners.filter(
    (learner) =>
      learner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learner.skills.some((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Employer Portal</h1>
        <p className="text-gray-600">Find and verify skilled professionals</p>
      </motion.div>

      {/* Stats */}
      {analytics && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card glassmorphism className="h-full">
            <Users className="w-10 h-10 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {analytics.platformStats.totalLearners.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Learners</p>
          </Card>
          <Card glassmorphism className="h-full">
            <CheckCircle className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {analytics.verificationStats.verified.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Verified Credentials</p>
          </Card>
          <Card glassmorphism className="h-full">
            <TrendingUp className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{analytics.platformStats.totalSkills.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Skills</p>
          </Card>
          <Card glassmorphism className="h-full">
            <Users className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {analytics.platformStats.partnerEmployers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Partner Employers</p>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card glassmorphism className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill, or NSQF level..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all">
            Search
          </button>
        </div>
      </Card>

      {/* Learner Results */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading learners...</p>
          </div>
        ) : (
          filteredLearners.slice(0, 6).map((learner, idx) => (
            <motion.div
              key={learner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="h-full"
            >
              <Card hover onClick={() => {
                setSelectedLearner(learner);
                setVerificationSuccess(false);
                setVerifyModalOpen(true);
              }} className="h-full flex flex-col">
                <div className="flex items-start gap-4 flex-1">
                  <img src={learner.avatar} alt={learner.name} className="w-16 h-16 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{learner.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{learner.email}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {learner.skills.slice(0, 3).map((skill: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {skill.name} - NSQF {skill.nsqfLevel}
                        </span>
                      ))}
                      {learner.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{learner.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        {learner.credentials.filter((c: any) => c.status === 'verified').length} verified
                      </span>
                      <span>{learner.credentials.length} total credentials</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card glassmorphism>
            <h2 className="text-xl font-bold mb-4">Industry Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.industryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="webDev" stroke="#3b82f6" name="Web Dev" />
                <Line type="monotone" dataKey="aiMl" stroke="#8b5cf6" name="AI/ML" />
                <Line type="monotone" dataKey="design" stroke="#ec4899" name="Design" />
                <Line type="monotone" dataKey="cloud" stroke="#10b981" name="Cloud" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card glassmorphism>
            <h2 className="text-xl font-bold mb-4">Skill Demand</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.skillDemand}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="demand" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Top Employers */}
      {analytics && (
        <Card glassmorphism>
          <h2 className="text-xl font-bold mb-4">Top Hiring Companies</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {analytics.topEmployers.map((employer, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{employer.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">{employer.hirings}</p>
                <p className="text-sm text-gray-600 mb-2">hirings this year</p>
                <p className="text-sm font-semibold text-gray-700">{employer.avgPackage}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {employer.topSkills.slice(0, 2).map((skill, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Verify Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={handleCloseVerifyModal}
        title="Learner Profile & Verification"
        size="lg"
      >
        {verifying ? (
          <VerifyingAnimation />
        ) : verificationSuccess && selectedLearner ? (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <BadgeCheck className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Credential verified!</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {selectedLearner.name}'s credential has been permanently recorded on the blockchain. You can safely proceed with the hiring workflow.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <button
                onClick={handleCloseVerifyModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => setVerificationSuccess(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 transition"
              >
                Verify another credential
              </button>
            </div>
          </div>
        ) : selectedLearner ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <img src={selectedLearner.avatar} alt={selectedLearner.name} className="w-24 h-24 rounded-full" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedLearner.name}</h2>
                <p className="text-gray-600 mb-4">{selectedLearner.email}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLearner.publicProfileUrl);
                    toast.success('Profile link copied!');
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Copy Public Profile Link
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedLearner.skills.map((skill: any, idx: number) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      skill.verified
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {skill.name} ({skill.level}) - NSQF {skill.nsqfLevel}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3">Credentials</h3>
              <div className="space-y-3">
                {selectedLearner.credentials.map((cred: any) => (
                  <div key={cred.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{cred.title}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          cred.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {cred.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{cred.issuer}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {new Date(cred.issueDate).toLocaleDateString()} | NSQF Level {cred.nsqfLevel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleVerifyCredential}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
            >
              Verify on Blockchain
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
