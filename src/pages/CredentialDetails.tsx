import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, ExternalLink, ShieldCheck, Clock, Download } from 'lucide-react';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Loaders';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchLearnerById } from '../features/learnerSlice';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  verified: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export const CredentialDetails = () => {
  const navigate = useNavigate();
  const { credentialId } = useParams<{ credentialId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLearner, loading } = useAppSelector((state) => state.learners);

  useEffect(() => {
    if (user?.id && (!currentLearner || currentLearner.id !== user.id)) {
      dispatch(fetchLearnerById(user.id));
    }
  }, [dispatch, user?.id, currentLearner?.id]);

  useEffect(() => {
    if (!credentialId) {
      toast.error('Credential not found.');
      navigate('/learner/dashboard');
    }
  }, [credentialId, navigate]);

  if (loading || !currentLearner) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const credential = currentLearner.credentials.find((item) => item.id === credentialId);

  if (!credential) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Card className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Credential unavailable</h2>
          <p className="text-sm text-slate-600">
            We couldn\'t find the credential you\'re looking for. It may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to credentials
          </button>
        </Card>
      </div>
    );
  }

  const statusClass = statusStyles[credential.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/learner/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to credentials
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card glassmorphism className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={credential.issuerLogo}
                alt={credential.issuer}
                className="w-20 h-20 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{credential.title}</h1>
                <p className="text-sm text-slate-600">Issued by {credential.issuer}</p>
                <div
                  className={`mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border ${statusClass}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {credential.status.charAt(0).toUpperCase() + credential.status.slice(1)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => {
                  if (credential.credentialUrl && credential.credentialUrl !== '#') {
                    window.open(credential.credentialUrl, '_blank');
                  } else {
                    toast('Credential file coming soon');
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Download credential
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-blue-400 transition"
                onClick={() => toast('Share link copied to clipboard')}
              >
                <ExternalLink className="w-4 h-4" />
                Share verification link
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Credential summary</h2>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Issued on</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(credential.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  {credential.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span>Expires on</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(credential.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>NSQF Level</span>
                    <span className="font-semibold text-blue-600">{credential.nsqfLevel}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Skills covered</h2>
                <div className="flex flex-wrap gap-2">
                  {credential.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                  Blockchain verification
                </h2>
                {credential.blockchainHash ? (
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-slate-900">Verified on DigiLedger chain</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono break-all">
                      {credential.blockchainHash}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credential.blockchainHash as string);
                        toast.success('Transaction hash copied');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Copy hash
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4" />
                    Pending blockchain verification
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Next steps</h2>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  <li>Share credential with employers via verification link.</li>
                  <li>Update your portfolio with this achievement.</li>
                  <li>If details are incorrect, contact the issuing organization.</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
