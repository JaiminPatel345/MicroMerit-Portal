import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { employerApi } from '../../services/authServices';
import { credentialServices } from '../../services/credentialServices';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Search, Loader, Globe, FileText, ArrowLeft, Copy, Check, Camera, Eye, X, Sparkles, Upload, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import CameraCapture from '../../components/CameraCapture';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Copy">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
};

const CredentialModal = ({ result, onClose }) => {
    if (!result || !result.credential) return null;
    const { credential } = result;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                    <h3 className="text-xl font-bold text-gray-900">Credential Details</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Status Header */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                        <CheckCircle size={24} className="text-green-600" />
                        <div>
                            <p className="font-bold">Valid Credential</p>
                            <p className="text-sm opacity-90">ID: {credential.credential_id}</p>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Certificate Title</p>
                            <p className="font-medium text-gray-900 text-lg">{credential.certificate_title}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issued On</p>
                            <p className="font-medium text-gray-900">{formatDate(credential.issued_at)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Learner Email</p>
                            <p className="font-medium text-gray-900">{credential.learner_email}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issuer</p>
                            <p className="font-medium text-gray-900">{credential.metadata?.issuer_name || credential.issuer?.name || 'Unknown Issuer'}</p>
                        </div>
                    </div>

                    {/* Metadata */}
                     {credential.metadata && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <h4 className="text-sm font-bold text-gray-700 mb-3">Additional Metadata</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(credential.metadata).map(([key, value]) => (
                                    <div key={key}>
                                        <p className="text-xs text-gray-500 uppercase mb-0.5">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-medium text-gray-900 truncate" title={String(value)}>{String(value)}</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* Links */}
                     <div className="flex flex-wrap gap-3 pt-2">
                        {credential.tx_hash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <Globe className="mr-2 h-4 w-4" /> Blockchain Record
                            </a>
                        )}
                        {credential.pdf_url && (
                             <a
                                href={credential.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-chill-600 text-white text-sm font-medium rounded-lg hover:bg-blue-chill-700 transition-colors shadow-lg shadow-blue-chill-600/20"
                            >
                                <FileText className="mr-2 h-4 w-4" /> View PDF
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployerVerify = () => {
    const [activeTab, setActiveTab] = useState('single');
    const [inputValue, setInputValue] = useState('');
    const [inputType, setInputType] = useState('credential_id'); // Default, but will auto-detect
    const [verifyResult, setVerifyResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showCamera, setShowCamera] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const resultRef = useRef(null);

    useEffect(() => {
        if (verifyResult) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [verifyResult]);

    // Bulk report state
    const [bulkReport, setBulkReport] = useState(null);
    const [resultsFilter, setResultsFilter] = useState('all');

    // AI Compare state
    const [aiCredentialId, setAiCredentialId] = useState('');
    const [aiFile, setAiFile] = useState(null);
    const [aiFileName, setAiFileName] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState('');

    const handleCameraCapture = async (file) => {
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await employerApi.extractIdFromDoc(formData);
            
            if (res.data.success && res.data.data.found && res.data.data.credential_id) {
                setInputValue(res.data.data.credential_id);
                if (res.data.data.status === 'needs_review') {
                    setError(`ID found with confidence ${res.data.data.confidence}%. Please verify: ${res.data.data.credential_id}`);
                }
            } else {
                setError(res.data.data?.message || 'No Credential ID found in image. Please enter manually.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to process image');
        } finally {
            setLoading(false);
        }
    };

    // Auto-detect input type logic from Verification.jsx
    const detectInputType = (value) => {
        value = value.trim();
        if (value.startsWith('0x') && value.length > 40) return 'tx_hash';
        if (value.startsWith('Qm') || value.startsWith('bafy')) return 'ipfs_cid';
        return 'credential_id';
    };

    const handleVerifySingle = async (e) => {
        e.preventDefault();
        setLoading(true);
        setVerifyResult(null);
        setError('');

        const type = detectInputType(inputValue);
        setInputType(type);

        try {
            const payload = { [type]: inputValue.trim() };
            const res = await axios.post(`${API_BASE_URL}/credentials/verify`, payload);
            setVerifyResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            if (err.response?.data?.data?.status === 'INVALID') {
                setVerifyResult(err.response.data.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const normalizeResultsToReport = (results) => {
        const normalized = results.map(r => ({ ...r, valid: r.valid || r.status === 'VALID' }));
        const total = normalized.length;
        const valid = normalized.filter(r => r.valid).length;
        const errors = normalized.filter(r => r.status === 'ERROR').length;
        const failed = total - valid - errors;
        const successRate = total > 0 ? Math.round((valid / total) * 100) : 0;
        return { total, valid, failed, errors, successRate, results: normalized };
    };

    const handleZipUpload = async (e) => {
        const zipFile = e.target.files[0];
        if (!zipFile) return;
        setLoading(true);
        setBulkReport(null);
        setError('');
        try {
            // Extract PDFs from ZIP in the browser
            const zip = await JSZip.loadAsync(zipFile);
            const pdfEntries = Object.entries(zip.files).filter(
                ([name, entry]) => !entry.dir && !name.startsWith('__MACOSX') && !name.startsWith('.') && name.toLowerCase().endsWith('.pdf')
            );

            if (pdfEntries.length === 0) {
                setError('No PDF files found in ZIP.');
                setLoading(false);
                e.target.value = null;
                return;
            }

            const results = [];

            // Verify each PDF using the SAME route as /verify: POST /credentials/verify-pdf
            for (const [name, entry] of pdfEntries) {
                const fileName = name.split('/').pop() || name;
                try {
                    const blob = await entry.async('blob');
                    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

                    // Same function used by single PDF verify and public /verify page
                    const response = await credentialServices.verifyCredentialFromPdf(pdfFile);

                    if (response.success) {
                        const r = response.data;
                        results.push({
                            id: r.credential?.credential_id || fileName,
                            status: r.status,
                            valid: r.status === 'VALID',
                            reason: r.reason,
                            credential: r.credential,
                            verified_fields: r.verified_fields,
                        });
                    } else {
                        results.push({
                            id: fileName,
                            status: 'INVALID',
                            valid: false,
                            error: response.message || 'Verification failed',
                        });
                    }
                } catch (err) {
                    results.push({
                        id: fileName,
                        status: 'ERROR',
                        valid: false,
                        error: err.response?.data?.message || err.message || 'Verification failed',
                    });
                }
            }

            if (results.length === 0) {
                setError('No valid certificate files found in ZIP.');
            } else {
                setBulkReport(normalizeResultsToReport(results));
                setResultsFilter('all');
            }
        } catch (err) {
            setError(err.message || 'Failed to process ZIP file');
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    const handleAiCompare = async (e) => {
        e.preventDefault();
        if (!aiFile) { setAiError('Please select a file to upload.'); return; }
        if (!aiCredentialId.trim()) { setAiError('Please enter the Credential ID.'); return; }
        setAiLoading(true);
        setAiResult(null);
        setAiError('');
        try {
            const formData = new FormData();
            formData.append('file', aiFile);
            formData.append('credential_id', aiCredentialId.trim());
            const res = await employerApi.aiCompareVerify(formData);
            setAiResult(res.data.data);
        } catch (err) {
            setAiError(err.response?.data?.message || 'AI verification failed. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 min-h-screen bg-gray-50/50">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Credential Verification</h1>
                <p className="text-gray-500 mt-1">Verify authenticity via ID, Transaction Hash, or IPFS CID.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('single')}
                    className={`pb-3 px-6 font-medium text-sm transition-colors relative ${activeTab === 'single' ? 'text-blue-chill-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Single Verification
                    {activeTab === 'single' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-chill-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('bulk')}
                    className={`pb-3 px-6 font-medium text-sm transition-colors relative ${activeTab === 'bulk' ? 'text-blue-chill-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Bulk Verification
                    {activeTab === 'bulk' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-chill-600"></div>}
                </button>
            </div>

            {/* Content box */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[500px]">
                {activeTab === 'single' ? (
                    <div className="max-w-3xl mx-auto pt-4">
                        {/* Blockchain method badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle size={12} /> 100% accurate and reliable
                            </span>
                            <span className="text-sm text-gray-500">Blockchain-backed cryptographic verification</span>
                        </div>

                        <form onSubmit={handleVerifySingle} className="space-y-4 mb-8">
                            <label className="block text-sm font-medium text-gray-700">Credential Identifier</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter Credential ID, Tx Hash, or IPFS CID..."
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-chill-100 focus:bg-white focus:border-blue-chill-400 outline-none transition-all"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-chill-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-chill-700 transition-all shadow-lg shadow-blue-chill-600/20 flex items-center gap-2"
                                >
                                    {loading ? <Loader className="animate-spin" /> : 'Verify'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">
                                Start typing an ID (e.g., CRED-...), a transaction hash (0x...), or an IPFS CID (Qm...).
                            </p>
                        </form>

                        <div className="mb-6 relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-gray-500">Or verify using file</span>
                            </div>
                        </div>

                        <div className="mb-8 relative bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-chill-400 transition-colors">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                {/* Upload Option */}
                                <div className="flex-1 text-center border-r md:border-r-gray-200 md:pr-6 w-full">
                                    {loading ? (
                                        <div className="py-4 flex flex-col items-center justify-center">
                                            <Loader className="h-10 w-10 text-blue-chill-600 animate-spin mb-2" />
                                            <p className="text-sm text-gray-500">Verifying PDF...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                            <label htmlFor="single-file-upload" className="block relative cursor-pointer group">
                                                <span className="font-medium text-blue-chill-600 group-hover:text-blue-chill-700">Upload Credential PDF</span>
                                                <input
                                                    id="single-file-upload"
                                                    type="file"
                                                    accept=".pdf"
                                                    className="sr-only"
                                                    disabled={loading}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setLoading(true);
                                                            setError('');
                                                            setVerifyResult(null);
                                                            try {
                                                                const response = await credentialServices.verifyCredentialFromPdf(file);
                                                                if (response.success) {
                                                                    setVerifyResult(response.data);
                                                                } else {
                                                                    setError(response.message || 'PDF verification failed');
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                                setError(err.response?.data?.message || 'Failed to verify PDF');
                                                            } finally {
                                                                setLoading(false);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">PDF only — credential with embedded metadata</p>
                                        </>
                                    )}
                                </div>

                                {/* Divider or "OR" text for mobile */}
                                <div className="block md:hidden w-full border-b border-gray-200 relative my-2">
                                     <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-xs text-gray-400">OR</span>
                                </div>

                                {/* Camera Option */}
                                <div className="flex-1 text-center w-full">
                                    <button 
                                        onClick={() => setShowCamera(true)}
                                        disabled={loading}
                                        className="flex flex-col items-center justify-center w-full group"
                                    >
                                        <Camera className="h-10 w-10 text-gray-400 mb-2 group-hover:text-blue-chill-500 transition-colors" />
                                        <span className="font-medium text-blue-chill-600 group-hover:text-blue-chill-700">Scan with Camera</span>
                                        <p className="text-xs text-gray-500 mt-1">Take a photo directly</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && !verifyResult && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {/* ─────────────────────────────────────────── */}
                        {/* AI-Powered Verification Section */}
                        {/* ─────────────────────────────────────────── */}
                        <div className="mt-10">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Sparkles size={18} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">AI-Powered Verification</h3>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700">
                                        <Sparkles size={10} /> More flexible
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-5 pl-11">
                                Don't have the exact original PDF? Upload a photo or a scanned copy of your marksheet or certificate and enter the Credential ID. Google Gemini AI will compare the core data fields against the original document stored on IPFS.
                            </p>

                            <form onSubmit={handleAiCompare} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Enter Credential ID (e.g. CRED-...)"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:bg-white focus:border-purple-400 outline-none transition-all text-sm"
                                            value={aiCredentialId}
                                            onChange={(e) => setAiCredentialId(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (Image or PDF)</label>
                                    <div
                                        className="relative border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer bg-purple-50/30"
                                        onClick={() => document.getElementById('ai-file-upload').click()}
                                    >
                                        {aiFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <FileText size={22} className="text-purple-500" />
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-gray-800">{aiFileName}</p>
                                                    <p className="text-xs text-gray-500">Click to change file</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setAiFile(null); setAiFileName(''); }}
                                                    className="ml-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-8 w-8 text-purple-400 mb-2" />
                                                <p className="text-sm font-medium text-purple-600">Click to upload image or PDF</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WEBP, PDF — max 15 MB</p>
                                            </>
                                        )}
                                        <input
                                            id="ai-file-upload"
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const f = e.target.files[0];
                                                if (f) { setAiFile(f); setAiFileName(f.name); }
                                                e.target.value = null;
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={aiLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {aiLoading ? (
                                        <><Loader className="animate-spin" size={18} /> Analyzing with AI...</>
                                    ) : (
                                        <><Sparkles size={18} /> Verify with AI</>
                                    )}
                                </button>
                            </form>

                            {/* AI Error */}
                            {aiError && (
                                <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                                    <AlertCircle size={18} />
                                    <p className="text-sm">{aiError}</p>
                                </div>
                            )}

                            {/* AI Result */}
                            {aiResult && (
                                <div className={`mt-6 rounded-2xl border overflow-hidden shadow-sm ${
                                    aiResult.ai_comparison.match ? 'border-green-100' : 'border-red-100'
                                }`}>
                                    {/* Header */}
                                    <div className={`p-6 text-center ${
                                        aiResult.ai_comparison.match ? 'bg-green-50/60' : 'bg-red-50/60'
                                    }`}>
                                        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                                            aiResult.ai_comparison.match ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {aiResult.ai_comparison.match ? <CheckCircle size={28} /> : <XCircle size={28} />}
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">
                                            {aiResult.ai_comparison.match ? 'Documents Match' : 'Documents Do Not Match'}
                                        </h4>
                                        <p className={`text-sm mt-1 ${
                                            aiResult.ai_comparison.match ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {aiResult.ai_comparison.summary}
                                        </p>
                                    </div>

                                    {/* Details */}
                                    <div className="bg-white p-6 space-y-4">
                                        {/* Credential info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Credential ID</p>
                                                <p className="font-mono text-gray-800">{aiResult.credential_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Certificate</p>
                                                <p className="font-medium text-gray-800">{aiResult.certificate_title}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Issued By</p>
                                                <p className="font-medium text-gray-800">{aiResult.issuer_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">AI Confidence</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                aiResult.ai_comparison.match ? 'bg-green-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${aiResult.ai_comparison.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{aiResult.ai_comparison.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mismatches */}
                                        {aiResult.ai_comparison.mismatches && aiResult.ai_comparison.mismatches.length > 0 && (
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                                <p className="text-sm font-bold text-red-700 mb-2">Detected Mismatches</p>
                                                <ul className="space-y-1.5">
                                                    {aiResult.ai_comparison.mismatches.map((m, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                                                            <XCircle size={14} className="mt-0.5 shrink-0" />
                                                            <span>{m}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {aiResult.ai_comparison.match && aiResult.ai_comparison.mismatches?.length === 0 && (
                                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-2 text-sm text-green-700">
                                                <CheckCircle size={16} />
                                                All core credential data fields match exactly.
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-400 pt-1">
                                            <Sparkles size={10} className="inline mr-1" />
                                            Verified using Google Gemini AI. AI comparison is a flexibility tool — for legal proof, use the blockchain-backed method above.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {verifyResult && (
                            <div ref={resultRef} className={`border rounded-2xl overflow-hidden shadow-sm ${verifyResult.status === 'VALID' ? 'border-green-100' : 'border-red-100'}`}>
                                {/* Header Status */}
                                <div className={`p-8 text-center ${verifyResult.status === 'VALID' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${verifyResult.status === 'VALID' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {verifyResult.status === 'VALID' ? <CheckCircle size={32} /> : <XCircle size={32} />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {verifyResult.status === 'VALID' ? 'Valid Credential' : 'Invalid Credential'}
                                    </h2>
                                    <p className={`${verifyResult.status === 'VALID' ? 'text-green-700' : 'text-red-700'}`}>
                                        {verifyResult.reason || 'Verification complete.'}
                                    </p>
                                </div>

                                {/* Verification Checks */}
                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100 bg-white">
                                    <div className="p-4 flex flex-col items-center gap-2">
                                        <span className={`text-xs font-bold uppercase ${verifyResult.verified_fields.hash_match ? 'text-green-600' : 'text-red-600'}`}>
                                            {verifyResult.verified_fields.hash_match ? 'Matched' : 'Failed'}
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium">Data Integrity</span>
                                    </div>
                                    <div className="p-4 flex flex-col items-center gap-2">
                                        <span className={`text-xs font-bold uppercase ${verifyResult.verified_fields.blockchain_verified ? 'text-green-600' : 'text-red-600'}`}>
                                            {verifyResult.verified_fields.blockchain_verified ? 'Verified' : 'Failed'}
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium">Blockchain Record</span>
                                    </div>
                                    <div className="p-4 flex flex-col items-center gap-2">
                                        <span className={`text-xs font-bold uppercase ${verifyResult.verified_fields.ipfs_cid_match ? 'text-green-600' : 'text-red-600'}`}>
                                            {verifyResult.verified_fields.ipfs_cid_match ? 'Verified' : 'Failed'}
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium">IPFS Storage</span>
                                    </div>
                                </div>

                                {/* Credential Details */}
                                {verifyResult.credential && (
                                    <div className="p-8 bg-white space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Credential Details</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Credential ID</p>
                                                <div className="flex items-center gap-2 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100 w-fit">
                                                    {verifyResult.credential.credential_id}
                                                    <CopyButton text={verifyResult.credential.credential_id} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                                                    {verifyResult.credential.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Certificate Title</p>
                                                <p className="font-medium text-gray-900">{verifyResult.credential.certificate_title}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issued On</p>
                                                <p className="font-medium text-gray-900">{formatDate(verifyResult.credential.issued_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Learner</p>
                                                <p className="font-medium text-gray-900">{verifyResult.credential.learner_email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issuer</p>
                                                <p className="font-medium text-gray-900">{verifyResult.credential.metadata?.issuer_name || verifyResult.credential.issuer?.name}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex flex-wrap gap-3">
                                            {verifyResult.credential.tx_hash && (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${verifyResult.credential.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    <Globe className="mr-2 h-4 w-4" /> View Blockchain Tx
                                                </a>
                                            )}
                                            {verifyResult.credential.pdf_url && (
                                                <a
                                                    href={verifyResult.credential.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <FileText className="mr-2 h-4 w-4" /> View Certificate PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto pt-4">
                        {/* ZIP Upload Panel */}
                        <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-4">Upload a ZIP archive containing certificate PDFs. Each PDF is verified individually — PDF checksum integrity is checked alongside blockchain confirmation.</p>
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${loading ? 'border-blue-chill-300 bg-blue-chill-50/30 cursor-default' : 'border-gray-300 hover:border-blue-chill-400 hover:bg-gray-50/50 cursor-pointer'}`}
                                    onClick={() => !loading && document.getElementById('bulk-zip-upload').click()}
                                >
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader className="h-12 w-12 text-blue-chill-600 animate-spin" />
                                            <p className="text-base font-semibold text-blue-chill-700">Processing certificates...</p>
                                            <p className="text-sm text-gray-400">Checking PDF integrity and verifying each certificate on the blockchain</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Archive className="mx-auto h-14 w-14 text-gray-300 mb-3" />
                                            <p className="text-base font-semibold text-gray-700 mb-1">
                                                Drop your ZIP or <span className="text-blue-chill-600 underline underline-offset-2">click to browse</span>
                                            </p>
                                            <p className="text-sm text-gray-400">ZIP archive of PDF certificates — up to 100 files at once</p>
                                        </>
                                    )}
                                    <input id="bulk-zip-upload" type="file" accept=".zip" className="sr-only" onChange={handleZipUpload} />
                                </div>
                            </div>

                        {/* Error */}
                        {error && !bulkReport && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 mb-4">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Results */}
                        {bulkReport && (
                            <div className="space-y-5 mt-2">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                                        <p className="text-4xl font-black text-gray-900">{bulkReport.total}</p>
                                        <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">Total</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                                        <p className="text-4xl font-black text-green-700">{bulkReport.valid}</p>
                                        <p className="text-xs font-semibold text-green-600 mt-1 uppercase tracking-wide">Valid</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                        <p className="text-4xl font-black text-red-700">{bulkReport.failed}</p>
                                        <p className="text-xs font-semibold text-red-600 mt-1 uppercase tracking-wide">Invalid</p>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
                                        <p className="text-4xl font-black text-orange-700">{bulkReport.errors}</p>
                                        <p className="text-xs font-semibold text-orange-600 mt-1 uppercase tracking-wide">Errors</p>
                                    </div>
                                </div>

                                {/* Success Rate Bar */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Verification Success Rate</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{bulkReport.valid} of {bulkReport.total} credentials verified on-chain</p>
                                        </div>
                                        <span className={`text-2xl font-black ${bulkReport.successRate >= 80 ? 'text-green-600' : bulkReport.successRate >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                                            {bulkReport.successRate}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-700 ${bulkReport.successRate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : bulkReport.successRate >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                            style={{ width: `${bulkReport.successRate}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex border-b border-gray-200 gap-1">
                                    {[
                                        { key: 'all', label: 'All', count: bulkReport.total },
                                        { key: 'valid', label: 'Valid', count: bulkReport.valid },
                                        { key: 'failed', label: 'Invalid', count: bulkReport.failed },
                                        { key: 'error', label: 'Errors', count: bulkReport.errors },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setResultsFilter(tab.key)}
                                            className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${resultsFilter === tab.key ? 'text-blue-chill-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {tab.label}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${resultsFilter === tab.key ? 'bg-blue-chill-100 text-blue-chill-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {tab.count}
                                            </span>
                                            {resultsFilter === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-chill-600" />}
                                        </button>
                                    ))}
                                </div>

                                {/* Results List */}
                                <div className="space-y-3 pb-4">
                                    {bulkReport.results
                                        .filter(r => {
                                            if (resultsFilter === 'valid') return r.valid;
                                            if (resultsFilter === 'failed') return !r.valid && r.status !== 'ERROR';
                                            if (resultsFilter === 'error') return r.status === 'ERROR';
                                            return true;
                                        })
                                        .map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`rounded-2xl border p-4 transition-shadow hover:shadow-sm ${item.valid ? 'border-green-100 bg-green-50/20' : item.status === 'ERROR' ? 'border-orange-100 bg-orange-50/20' : 'border-red-100 bg-red-50/20'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.valid ? 'bg-green-100' : item.status === 'ERROR' ? 'bg-orange-100' : 'bg-red-100'}`}>
                                                            {item.valid
                                                                ? <CheckCircle size={16} className="text-green-600" />
                                                                : item.status === 'ERROR'
                                                                ? <AlertCircle size={16} className="text-orange-600" />
                                                                : <XCircle size={16} className="text-red-600" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-mono text-xs text-gray-500 truncate">{item.id}</p>
                                                            {item.credential?.certificate_title && (
                                                                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{item.credential.certificate_title}</p>
                                                            )}
                                                            {item.credential?.learner_email && (
                                                                <p className="text-xs text-gray-500 mt-0.5">{item.credential.learner_email}</p>
                                                            )}
                                                            {(item.error || item.reason) && !item.valid && (
                                                                <p className={`text-xs mt-1 font-medium ${item.status === 'ERROR' ? 'text-orange-600' : 'text-red-600'}`}>
                                                                    {item.error || item.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.valid ? 'bg-green-100 text-green-700' : item.status === 'ERROR' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                            {item.status}
                                                        </span>
                                                        {item.valid && (
                                                            <button
                                                                onClick={() => setSelectedResult(item)}
                                                                className="flex items-center gap-1 text-blue-chill-600 bg-blue-chill-50 hover:bg-blue-chill-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                                                            >
                                                                <Eye size={12} /> Details
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.valid && item.verified_fields && (
                                                    <div className="mt-3 pt-3 border-t border-green-100 flex gap-6">
                                                        {[
                                                            { label: 'Data Integrity', key: 'hash_match' },
                                                            { label: 'Blockchain', key: 'blockchain_verified' },
                                                            { label: 'IPFS', key: 'ipfs_cid_match' },
                                                        ].map(check => (
                                                            <div key={check.key} className="flex items-center gap-1.5">
                                                                <span className={`text-sm font-bold ${item.verified_fields[check.key] ? 'text-green-500' : 'text-gray-300'}`}>
                                                                    {item.verified_fields[check.key] ? '✓' : '✗'}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{check.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    }
                                    {bulkReport.results.filter(r => {
                                        if (resultsFilter === 'valid') return r.valid;
                                        if (resultsFilter === 'failed') return !r.valid && r.status !== 'ERROR';
                                        if (resultsFilter === 'error') return r.status === 'ERROR';
                                        return true;
                                    }).length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <CheckCircle size={36} className="mx-auto mb-3 text-green-200" />
                                            <p className="text-sm font-medium">No {resultsFilter === 'valid' ? 'valid' : resultsFilter === 'failed' ? 'invalid' : 'error'} records in this batch</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {showCamera && (
                <CameraCapture 
                    onCapture={handleCameraCapture} 
                    onClose={() => setShowCamera(false)} 
                />
            )}
            
            {selectedResult && (
                <CredentialModal 
                    result={selectedResult} 
                    onClose={() => setSelectedResult(null)} 
                />
            )}
        </div>
    );
};

export default EmployerVerify;
