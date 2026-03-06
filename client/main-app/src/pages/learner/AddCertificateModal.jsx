import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Plus,
    AlertCircle,
    Loader2,
    ChevronDown,
    Info,
    Shield,
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

// ── Main Modal ────────────────────────────────────────────────────────────────
const AddCertificateModal = ({ onClose, onSuccess }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('form'); // 'form' | 'loading' | 'error'
    const [issuers, setIssuers] = useState([]);
    const [issuersLoading, setIssuersLoading] = useState(true);
    const [selectedIssuer, setSelectedIssuer] = useState('');
    const [credentialId, setCredentialId] = useState('');
    const [error, setError] = useState('');


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
            const data = res.data?.data || res.data;
            if (onSuccess) onSuccess();
            onClose();
            navigate(`/credential-added/${data.db_id}`);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Something went wrong.';
            setError(msg);
            setStep('error');
        }
    };

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

                    {/* success step removed — redirects to /credential-added/:id */}

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
