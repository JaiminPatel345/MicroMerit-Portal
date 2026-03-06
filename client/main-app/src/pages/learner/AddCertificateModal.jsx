import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    Plus,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Shield,
    Database,
    Clock,
    ChevronDown,
    Info,
    Download,
    FileCheck,
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, label }) => {
    const config = {
        pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  icon: <Clock size={12} className="text-amber-500" /> },
        confirmed: { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  icon: <CheckCircle2 size={12} className="text-green-500" /> },
        failed:    { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: <AlertCircle size={12} className="text-red-500" /> },
    };
    const c = config[status] || config.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            {c.icon}{label}: <span className="capitalize">{status}</span>
        </span>
    );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const AddCertificateModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState('form'); // 'form' | 'loading' | 'success' | 'error'
    const [issuers, setIssuers] = useState([]);
    const [issuersLoading, setIssuersLoading] = useState(true);
    const [selectedIssuer, setSelectedIssuer] = useState('');
    const [credentialId, setCredentialId] = useState('');
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [statusChecking, setStatusChecking] = useState(false);
    const [statusResult, setStatusResult] = useState(null);

    // Fetch available issuers for dropdown
    useEffect(() => {
        const load = async () => {
            try {
                const res = await learnerApi.getExternalIssuers();
                setIssuers(res.data?.data || []);
            } catch {
                setIssuers([]);
            } finally {
                setIssuersLoading(false);
            }
        };
        load();
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedIssuer || !credentialId.trim()) {
            setError('Please select an issuer and enter a credential ID.');
            return;
        }
        setError('');
        setStep('loading');

        try {
            const res = await learnerApi.addCertificate({
                issuer_id: Number(selectedIssuer),
                credential_id: credentialId.trim(),
            });
            setResult(res.data?.data || res.data);
            setStep('success');
            if (onSuccess) onSuccess();
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Something went wrong.';
            setError(msg);
            setStep('error');
        }
    };

    const handleCheckStatus = useCallback(async () => {
        if (!result?.db_id) return;
        setStatusChecking(true);
        try {
            const res = await learnerApi.getCredentialStatus(result.db_id);
            setStatusResult(res.data?.data || res.data);
        } catch {
            setStatusResult(null);
        } finally {
            setStatusChecking(false);
        }
    }, [result]);

    const issuerName = issuers.find(i => String(i.id) === String(selectedIssuer))?.name || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Plus size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Add Certificate</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Claim a credential issued on an external platform</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    {/* ── Step: Form ── */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5">
                                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Enter the <strong>credential ID</strong> from your external certificate (e.g., a Credly badge UUID or course certificate number). We'll verify ownership and add it to your wallet.
                                </p>
                            </div>

                            {/* Issuer dropdown */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Issuing Platform <span className="text-red-400">*</span>
                                </label>
                                {issuersLoading ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                                        <Loader2 size={16} className="animate-spin" /> Loading issuers…
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={selectedIssuer}
                                            onChange={(e) => setSelectedIssuer(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 py-3 px-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">Select a platform…</option>
                                            {issuers.map((issuer) => (
                                                <option key={issuer.id} value={issuer.id}>
                                                    {issuer.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                )}
                            </div>

                            {/* Credential ID input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Credential ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={credentialId}
                                    onChange={(e) => setCredentialId(e.target.value)}
                                    placeholder={
                                        issuerName === 'Credly'
                                            ? 'e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890'
                                            : 'Enter your credential ID…'
                                    }
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 font-mono text-sm"
                                    required
                                />
                                {issuerName === 'Credly' && (
                                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                        <Shield size={11} className="text-gray-400" />
                                        Ownership verified via SHA-256 email hash (Credly standard)
                                    </p>
                                )}
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                                    <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={issuersLoading}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={16} /> Add Certificate
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: Loading ── */}
                    {step === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                <Loader2 size={32} className="text-blue-500 animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-800 mb-1">Verifying your credential…</p>
                                <p className="text-sm text-gray-500">Contacting {issuerName || 'issuer'} and checking ownership</p>
                            </div>
                        </div>
                    )}

                    {/* ── Step: Success ── */}
                    {step === 'success' && result && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                                <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                                <div>
                                    <p className="font-semibold text-green-800">Certificate Added!</p>
                                    <p className="text-xs text-green-600 mt-0.5">Now processing on blockchain & IPFS in the background</p>
                                </div>
                            </div>

                            {/* Credential snapshot */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Credential Details</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <span className="text-gray-500">Title</span>
                                        <span className="font-semibold text-gray-800 text-right max-w-[65%]">{result.title}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-gray-500">Issuer</span>
                                        <span className="font-semibold text-gray-800">{result.issuer_name}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-gray-500">Issued</span>
                                        <span className="font-medium text-gray-700">{result.issued_at ? new Date(result.issued_at).toLocaleDateString() : '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain & IPFS Status */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Verification Status</p>
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Database size={13} className="text-gray-400" />
                                        <StatusBadge
                                            status={statusResult?.metadata?.blockchain_status || statusResult?.blockchain_status || result.blockchain_status || 'pending'}
                                            label="Blockchain"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield size={13} className="text-gray-400" />
                                        <StatusBadge
                                            status={statusResult?.metadata?.ipfs_status || statusResult?.ipfs_status || result.ipfs_status || 'pending'}
                                            label="IPFS"
                                        />
                                    </div>
                                </div>

                                {/* Check Status button */}
                                <button
                                    onClick={handleCheckStatus}
                                    disabled={statusChecking}
                                    className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-all disabled:opacity-50"
                                >
                                    {statusChecking
                                        ? <><Loader2 size={13} className="animate-spin" /> Checking…</>
                                        : <><ExternalLink size={13} /> Check Status</>
                                    }
                                </button>
                            </div>

                            {/* PDF Download */}
                            {(() => {
                                const pdfUrl = statusResult?.pdf_url || result.pdf_url;
                                const ipfsStatus = statusResult?.metadata?.ipfs_status || statusResult?.ipfs_status || result.ipfs_status || 'pending';
                                const isSigned = ipfsStatus === 'confirmed';
                                return (
                                    <div className="pt-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Certificate PDF</p>
                                        {pdfUrl ? (
                                            <a
                                                href={pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                                                    isSigned
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                            >
                                                {isSigned
                                                    ? <><FileCheck size={15} /> Download Signed PDF</>
                                                    : <><Download size={15} /> Download PDF</>}
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-gray-100 border border-gray-200">
                                                <Clock size={14} className="text-amber-500 shrink-0" />
                                                <span className="text-xs text-gray-500">
                                                    PDF is being prepared — click <strong className="text-gray-700">Check Status</strong> to refresh
                                                </span>
                                            </div>
                                        )}
                                        {pdfUrl && !isSigned && (
                                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                                <Clock size={11} /> Blockchain signing in progress — re-check for verified version
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step: Error ── */}
                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                                <AlertCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-800">Could not add certificate</p>
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { setStep('form'); setError(''); }}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCertificateModal;
