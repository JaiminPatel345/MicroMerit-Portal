import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { learnerApi } from '../../services/authServices';
import CredentialIssuedResult from '../../components/CredentialIssuedResult';

// ── Spinning SVG ──────────────────────────────────────────────────────────────
const Spinner = ({ className = '' }) => (
    <svg
        className={`animate-spin ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
const CredentialAdded = () => {
    const { id } = useParams();          // learner credential DB id
    const navigate = useNavigate();

    const [credential, setCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // ── Fetch / refresh status ────────────────────────────────────────────────
    const fetchStatus = useCallback(async (silent = false) => {
        if (!id) return;
        if (!silent) setLoading(true);
        setRefreshing(true);
        try {
            const res = await learnerApi.getCredentialStatus(id);
            const data = res.data?.data || res.data;
            setCredential(data);
            setError(null);
        } catch (err) {
            if (!silent) setError('Failed to load credential.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    // Initial load
    useEffect(() => { fetchStatus(false); }, [fetchStatus]);

    // Auto-poll every 15 s while any status is pending
    useEffect(() => {
        if (!credential) return;
        const bcStatus   = credential.metadata?.blockchain_status || 'pending';
        const ipfsStatus = credential.metadata?.ipfs_status        || 'pending';
        if (bcStatus !== 'pending' && ipfsStatus !== 'pending') return;

        const initial  = setTimeout(() => fetchStatus(true), 4000);
        const interval = setInterval(() => fetchStatus(true), 15000);
        return () => { clearTimeout(initial); clearInterval(interval); };
    }, [credential?.metadata?.blockchain_status, credential?.metadata?.ipfs_status, fetchStatus]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <Spinner className="h-10 w-10 text-blue-500" />
                    <p className="text-sm font-medium">Loading credential…</p>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (error || !credential) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <XCircle className="h-14 w-14 text-red-400 mx-auto" />
                    <p className="text-lg font-semibold text-gray-800">Could not load credential</p>
                    <p className="text-sm text-gray-500">{error}</p>
                    <button
                        onClick={() => navigate('/wallet')}
                        className="mt-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Go to Wallet
                    </button>
                </div>
            </div>
        );
    }

    // ── Map learner credential data shape to shared component props ───────────
    const bcStatus   = credential.metadata?.blockchain_status || 'pending';
    const ipfsStatus = credential.metadata?.ipfs_status       || 'pending';
    const txHash     = credential.tx_hash;
    const ipfsCid    = credential.ipfs_cid;
    const pdfUrl     = credential.pdf_url;
    const credentialId = credential.credential_id || credential.uid;
    const issuerName = credential.metadata?.issuer_name || credential.issuer?.name || credential.issuer_name;
    const issuedAt   = credential.issued_at;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* ── Breadcrumb ─── */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/wallet" className="hover:text-blue-600 flex items-center gap-1">
                        <ArrowLeft size={14} /> Wallet
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Certificate Added</span>
                </div>

                {/* ── Shared success / status component ─── */}
                <CredentialIssuedResult
                    credentialId={credentialId}
                    certificateTitle={credential.certificate_title}
                    issuerName={issuerName}
                    issuedAt={issuedAt}
                    blockchainStatus={bcStatus}
                    ipfsStatus={ipfsStatus}
                    txHash={txHash}
                    ipfsCid={ipfsCid}
                    pdfUrl={pdfUrl}
                    refreshing={refreshing}
                    onRefresh={() => fetchStatus(false)}
                    onPrimaryAction={() => navigate('/wallet')}
                    primaryActionLabel="Go to Wallet"
                    onSecondaryAction={() => navigate(`/credential/${credentialId}`)}
                    secondaryActionLabel="View Full Details"
                    title="Certificate Added Successfully!"
                />
            </div>
        </div>
    );
};

export default CredentialAdded;
