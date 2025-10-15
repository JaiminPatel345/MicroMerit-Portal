import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, FileCheck, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import learnersData from '../data/learners.json';

export const IssuerDashboard = () => {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const stats = {
    totalIssued: 12500,
    activeIssuers: 8,
    pendingVerifications: 23,
    thisMonth: 145,
  };

  const handleIssueCredential = async () => {
    setIssuing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIssuing(false);
    setIssueModalOpen(false);
    toast.success('Credential issued successfully!', { icon: '🎓' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Issuer Dashboard</h1>
          <p className="text-gray-600">Manage and issue micro-credentials</p>
        </div>
        <button
          onClick={() => setIssueModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Issue Credential
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card glassmorphism className="h-full">
          <Award className="w-10 h-10 text-indigo-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.totalIssued.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Issued</p>
        </Card>
        <Card glassmorphism className="h-full">
          <Users className="w-10 h-10 text-teal-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.activeIssuers}</p>
          <p className="text-sm text-gray-600">Active Learners</p>
        </Card>
        <Card glassmorphism className="h-full">
          <FileCheck className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </Card>
        <Card glassmorphism className="h-full">
          <Award className="w-10 h-10 text-emerald-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
          <p className="text-sm text-gray-600">This Month</p>
        </Card>
      </div>

      {/* Learners Table */}
      <Card glassmorphism>
        <h2 className="text-2xl font-bold mb-6">Manage Learners</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Learner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Credentials</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {learnersData.slice(0, 5).map((learner) => (
                <tr key={learner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={learner.avatar} alt={learner.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-gray-900">{learner.name}</p>
                        <p className="text-sm text-gray-500">{learner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-900 font-semibold">{learner.credentials.length}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toast('Viewing learner details...')}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Credential Modal */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Issue New Credential"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Learner</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option>Select a learner...</option>
              {learnersData.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option>Advanced React Development</option>
              <option>Machine Learning Specialist</option>
              <option>Full Stack Web Development</option>
              <option>UI/UX Design Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">NSQF Level</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              {[5, 6, 7, 8, 9].map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            onClick={handleIssueCredential}
            disabled={issuing}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {issuing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Issuing...
              </div>
            ) : (
              'Issue Credential'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};
