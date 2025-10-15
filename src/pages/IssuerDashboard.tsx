import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, FileCheck, Plus, Upload } from 'lucide-react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import learnersData from '../data/learners.json';

type IssueFormState = {
  learnerId: string;
  credentialType: string;
  nsqfLevel: string;
  issueDate: string;
  file: File | null;
};

const CREDENTIAL_OPTIONS = [
  'Advanced React Development',
  'Machine Learning Specialist',
  'Full Stack Web Development',
  'UI/UX Design Professional',
  'Data Science Professional',
];

const getInitialIssueForm = (): IssueFormState => ({
  learnerId: '',
  credentialType: CREDENTIAL_OPTIONS[0],
  nsqfLevel: '7',
  issueDate: '',
  file: null,
});

export const IssuerDashboard = () => {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueFormState>(getInitialIssueForm);
  const issueFileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = {
    totalIssued: 12500,
    activeIssuers: 8,
    pendingVerifications: 23,
    thisMonth: 145,
  };

  const resetIssueForm = () => {
    setIssueForm(getInitialIssueForm());
    if (issueFileInputRef.current) {
      issueFileInputRef.current.value = '';
    }
  };

  const handleIssueCredential = async () => {
    if (!issueForm.learnerId) {
      toast.error('Select a learner to issue the credential.');
      return;
    }

    if (!issueForm.credentialType) {
      toast.error('Choose a credential type.');
      return;
    }

    if (!issueForm.issueDate) {
      toast.error('Set the issued date.');
      return;
    }

    if (!issueForm.file) {
      toast.error('Attach the credential document.');
      return;
    }

    setIssuing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIssuing(false);
    toast.success(`${issueForm.credentialType} issued successfully!`, { icon: '🎓' });
    setIssueModalOpen(false);
    resetIssueForm();
  };

  const handleCloseIssueModal = () => {
    setIssueModalOpen(false);
    resetIssueForm();
  };

  const handleIssueFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIssueForm((prev) => ({ ...prev, file }));
    }
  };

  const removeIssueFile = () => {
    setIssueForm((prev) => ({ ...prev, file: null }));
    if (issueFileInputRef.current) {
      issueFileInputRef.current.value = '';
    }
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
          <Users className="w-10 h-10 text-blue-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.activeIssuers}</p>
          <p className="text-sm text-gray-600">Active Learners</p>
        </Card>
        <Card glassmorphism className="h-full">
          <FileCheck className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </Card>
        <Card glassmorphism className="h-full">
          <Award className="w-10 h-10 text-indigo-600 mb-2" />
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
        onClose={handleCloseIssueModal}
        title="Issue New Credential"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Learner</label>
            <select
              value={issueForm.learnerId}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, learnerId: event.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select a learner...</option>
              {learnersData.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Type</label>
            <select
              value={issueForm.credentialType}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, credentialType: event.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {CREDENTIAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">NSQF Level</label>
            <select
              value={issueForm.nsqfLevel}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, nsqfLevel: event.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
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
              type={issueForm.issueDate ? 'date' : 'text'}
              onFocus={(event) => {
                event.currentTarget.type = 'date';
              }}
              onBlur={(event) => {
                if (!event.currentTarget.value) {
                  event.currentTarget.type = 'text';
                }
              }}
              value={issueForm.issueDate}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, issueDate: event.target.value }))
              }
              placeholder="Issued date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-purple-500" />
              {issueForm.file ? (
                <>
                  <p className="font-semibold text-gray-900">{issueForm.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(issueForm.file.size / 1024).toFixed(1)} KB
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => issueFileInputRef.current?.click()}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Change file
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={removeIssueFile}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900">Attach credential proof</p>
                  <p className="text-sm text-gray-500">PDF or image formats up to 10MB</p>
                  <button
                    type="button"
                    onClick={() => issueFileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Browse files
                  </button>
                </>
              )}
            </div>
            <input
              ref={issueFileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleIssueFileChange}
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
