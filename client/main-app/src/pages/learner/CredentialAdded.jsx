import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    CheckCircle,
    XCircle,
    ArrowLeft,
    ExternalLink,
    Download,
    FileCheck,
    Shield,
    Hash,
    Share2,
    Check,
    ShieldCheck,
    FileText,
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

// ── Spinning SVG (matches NewIssuance style) ─────────────────────────────────
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

// ── Animated checkmark (CSS-only, no extra dep) ───────────────────────────────
const CheckAnim = () => (
    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 animate-[pop_0.4s_ease-out]">
        <CheckCircle className="h-12 w-12 text-green-600" />
    </div>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="ml-1.5 inline-flex items-center p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Copy"
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Hash className="h-3 w-3" />}
        </button>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const CredentialAdded = () => {
    const { id } = useParams();          // learner credential DB id
    const navigate = useNavigate();

    const [credential, setCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

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

    // ── Share link ─────────────────────────────────────────────────────────────
    const handleShare = async () => {
        const credId = credential?.credential_id || credential?.uid;
        if (!credId) return;
        const url = `${window.location.origin}/verify?id=${credId}`;
        try { await navigator.clipboard.writeText(url); } catch { /* fallback */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Loading / error states ─────────────────────────────────────────────────
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

    const bcStatus   = credential.metadata?.blockchain_status || 'pending';
    const ipfsStatus = credential.metadata?.ipfs_status        || 'pending';
    const txHash     = credential.tx_hash;
    const ipfsCid    = credential.ipfs_cid;
    const pdfUrl     = credential.pdf_url;
    const allConfirmed = bcStatus === 'confirmed' && ipfsStatus === 'confirmed';
    const anyPending   = bcStatus === 'pending'   || ipfsStatus === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            {/* Keyframe for pop animation */}
            <style>{`
                @keyframes pop {
                    0%   { transform: scale(0.6); opacity: 0; }
                    70%  { transform: scale(1.1); }
                    100% { transform: scale(1);   opacity: 1; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto space-y-8">

                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/wallet" className="hover:text-blue-600 flex items-center gap-1">
                        <ArrowLeft size={14} /> Wallet
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Certificate Added</span>
                </div>

                {/* ── Main card ── */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">

                    {/* Refreshing indicator strip */}
                    {refreshing && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-pulse" />
                    )}

                    <div className="p-8 space-y-8">

                        {/* ── Hero ── */}
                        <div className="text-center space-y-4">
                            <CheckAnim />
                            <h1 className="text-2xl font-bold text-gray-900">Certificate Added Successfully!</h1>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                {allConfirmed
                                    ? 'Your credential has been confirmed on the blockchain and stored on IPFS.'
                                    : 'Your credential is being processed. Blockchain confirmation and IPFS upload are running in the background.'}
                            </p>
                        </div>

                        {/* ── Two-column layout ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                            {/* Left: PDF preview */}
                            <div className="lg:col-span-2 space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Certificate Preview</h3>
                                <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden aspect-[1/1.414] flex items-center justify-center relative group">
                                    {pdfUrl ? (
                                        (() => {
                                            const lower = pdfUrl.toLowerCase();
                                            const isImg = lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.webp');
                                            return isImg ? (
                                                <img src={pdfUrl} alt="Certificate" className="w-full h-full object-contain" />
                                            ) : (
                                                <iframe
                                                    src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                                    className="w-full h-full border-0"
                                                    title="Certificate Preview"
                                                />
                                            );
                                        })()
                                    ) : (
                                        <div className="text-center p-6">
                                            <FileText size={40} className="text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">
                                                {anyPending ? 'PDF being prepared…' : 'Preview unavailable'}
                                            </p>
                                            {anyPending && <Spinner className="h-5 w-5 text-blue-400 mx-auto mt-3" />}
                                        </div>
                                    )}

                                    {/* Hover overlay */}
                                    {pdfUrl && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <a
                                                href={pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 bg-white rounded-full hover:scale-110 transition-transform"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* PDF download button */}
                                {pdfUrl ? (
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            ipfsStatus === 'confirmed'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {ipfsStatus === 'confirmed'
                                            ? <><FileCheck size={16} /> Download Signed PDF</>
                                            : <><Download size={16} /> Download PDF</>}
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    >
                                        <Spinner className="h-4 w-4" /> PDF Being Prepared…
                                    </button>
                                )}
                            </div>

                            {/* Right: Status + details */}
                            <div className="lg:col-span-3 space-y-6">

                                {/* Credential details */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Credential Details</h3>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                                        <div className="flex justify-between items-start px-4 py-3 gap-3">
                                            <span className="text-gray-500 shrink-0">Title</span>
                                            <span className="font-semibold text-gray-800 text-right">{credential.certificate_title}</span>
                                        </div>
                                        <div className="flex justify-between items-start px-4 py-3 gap-3">
                                            <span className="text-gray-500 shrink-0">Issuer</span>
                                            <span className="font-semibold text-gray-800">{credential.issuer?.name || credential.issuer_name}</span>
                                        </div>
                                        <div className="flex justify-between items-start px-4 py-3 gap-3">
                                            <span className="text-gray-500 shrink-0">Issued</span>
                                            <span className="font-medium text-gray-700">
                                                {credential.issued_at ? new Date(credential.issued_at).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Blockchain + IPFS status rows */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Verification Status</h3>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">

                                        {/* Blockchain row */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Shield size={15} className="text-purple-400" /> Blockchain
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {bcStatus === 'pending' && (
                                                    <>
                                                        <Spinner className="h-4 w-4 text-yellow-500" />
                                                        <span className="text-xs font-semibold text-yellow-600">Confirming…</span>
                                                    </>
                                                )}
                                                {bcStatus === 'confirmed' && (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span className="text-xs font-semibold text-green-600">Confirmed</span>
                                                    </>
                                                )}
                                                {bcStatus === 'failed' && (
                                                    <>
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                        <span className="text-xs font-semibold text-red-600">Failed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* IPFS row */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Hash size={15} className="text-blue-400" /> IPFS Storage
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {ipfsStatus === 'pending' && (
                                                    <>
                                                        <Spinner className="h-4 w-4 text-yellow-500" />
                                                        <span className="text-xs font-semibold text-yellow-600">
                                                            {bcStatus === 'pending' ? 'Waiting for blockchain…' : 'Uploading…'}
                                                        </span>
                                                    </>
                                                )}
                                                {ipfsStatus === 'confirmed' && (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span className="text-xs font-semibold text-green-600">Uploaded</span>
                                                    </>
                                                )}
                                                {ipfsStatus === 'failed' && (
                                                    <>
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                        <span className="text-xs font-semibold text-red-600">Failed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Transaction hash row */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-xs text-gray-500 shrink-0">Transaction Hash</span>
                                            {txHash ? (
                                                <div className="flex items-center gap-1 max-w-[55%]">
                                                    <code className="text-xs font-mono text-purple-600 truncate">{txHash}</code>
                                                    <CopyBtn text={txHash} />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pending confirmation…</span>
                                            )}
                                        </div>

                                        {/* IPFS CID row */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-xs text-gray-500 shrink-0">IPFS CID</span>
                                            {ipfsCid ? (
                                                <div className="flex items-center gap-1 max-w-[55%]">
                                                    <code className="text-xs font-mono text-blue-600 truncate">{ipfsCid}</code>
                                                    <CopyBtn text={ipfsCid} />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pending…</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Manual refresh + auto-poll hint */}
                                    {anyPending && (
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-xs text-gray-400">Auto-refreshing every 15 s</p>
                                            <button
                                                onClick={() => fetchStatus(false)}
                                                disabled={refreshing}
                                                className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50"
                                            >
                                                <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                {refreshing ? 'Checking…' : 'Check Now'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* View on IPFS */}
                                    {ipfsStatus === 'confirmed' && pdfUrl ? (
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                        >
                                            <ExternalLink size={15} /> View on IPFS
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200"
                                        >
                                            <Spinner className="h-4 w-4" /> View on IPFS
                                        </button>
                                    )}

                                    {/* View on Blockchain */}
                                    {bcStatus === 'confirmed' && txHash ? (
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                        >
                                            <ExternalLink size={15} /> View on Blockchain
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200"
                                        >
                                            <Spinner className="h-4 w-4" /> View on Blockchain
                                        </button>
                                    )}
                                </div>

                                {/* Share + Verify */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        {copied
                                            ? <><Check size={15} className="text-green-600" /> Link Copied!</>
                                            : <><Share2 size={15} /> Share Link</>}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/verify/${credential.credential_id || credential.uid}`)}
                                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                    >
                                        <ShieldCheck size={15} /> Verify Credential
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
                            <p className="text-xs text-gray-400">
                                You can view this credential anytime in your wallet.
                            </p>
                            <div className="flex gap-3">
                                <Link
                                    to={`/credential/${credential.uid || credential.credential_id}`}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                                >
                                    View Full Details
                                </Link>
                                <Link
                                    to="/wallet"
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 transition-colors"
                                >
                                    Go to Wallet
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CredentialAdded;
