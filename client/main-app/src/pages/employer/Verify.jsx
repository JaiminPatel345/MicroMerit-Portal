import React, { useState } from 'react';
import { employerApi } from '../../services/authServices';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Search, Loader, Globe, FileText, ArrowLeft, Copy, Check, Camera, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import CameraCapture from '../../components/CameraCapture';

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
                            <p className="font-medium text-gray-900">{credential.issuer?.name || 'Unknown Issuer'}</p>
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

    const [bulkIds, setBulkIds] = useState('');
    const [bulkResults, setBulkResults] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

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
            const res = await employerApi.verifyCredential(payload);
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

    const handleBulkVerify = async () => {
        setLoading(true);
        setBulkResults(null);
        setError('');

        try {
            const ids = bulkIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id);
            if (ids.length === 0) {
                setError("Please enter at least one credential ID");
                setLoading(false);
                return;
            }
            const res = await employerApi.bulkVerify({ credential_ids: ids });
            setBulkResults(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Bulk verify failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Split by newlines and commas to get potential IDs
            const ids = text.split(/[\n,]+/)
                .map(id => id.trim())
                .filter(id => id); // Remove empty strings
            
            if (ids.length > 0) {
                // Determine if we append or replace. Let's append if there's existing content.
                const newContent = bulkIds ? `${bulkIds}\n${ids.join('\n')}` : ids.join('\n');
                setBulkIds(newContent);
            }
        };
        reader.readAsText(file);
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
                                            <p className="text-sm text-gray-500">Extracting ID from document...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                            <label htmlFor="single-file-upload" className="block relative cursor-pointer group">
                                                <span className="font-medium text-blue-chill-600 group-hover:text-blue-chill-700">Upload Document</span>
                                                <input 
                                                    id="single-file-upload" 
                                                    type="file" 
                                                    accept=".pdf,.png,.jpg,.jpeg" 
                                                    className="sr-only"
                                                    disabled={loading}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
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
                                                                    setError(res.data.data?.message || 'No Credential ID found in document. Please enter manually.');
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                                setError(err.response?.data?.message || 'Failed to process document');
                                                            } finally {
                                                                setLoading(false);
                                                                e.target.value = null;
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG</p>
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

                        {verifyResult && (
                            <div className={`border rounded-2xl overflow-hidden shadow-sm ${verifyResult.status === 'VALID' ? 'border-green-100' : 'border-red-100'}`}>
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
                                                <p className="font-medium text-gray-900">{verifyResult.credential.issuer?.name}</p>
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
                    <div className="max-w-3xl mx-auto pt-4">
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Enter Credential IDs (one per line or comma-separated)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="csv-upload"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className="cursor-pointer text-sm text-blue-chill-600 hover:text-blue-chill-700 font-medium flex items-center gap-1"
                                    >
                                        <FileText size={16} /> Import from CSV
                                    </label>
                                </div>
                            </div>
                            <textarea
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-chill-500 outline-none h-48 font-mono text-sm bg-gray-50"
                                placeholder="CRED-12345&#10;CRED-67890&#10;CRED-54321"
                                value={bulkIds}
                                onChange={(e) => setBulkIds(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end mb-8">
                            <button
                                onClick={handleBulkVerify}
                                disabled={loading}
                                className="bg-blue-chill-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-chill-700 transition-colors flex items-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" /> : <>Verify Bulk List <FileCheck size={18} /></>}
                            </button>
                        </div>

                        <div className="mb-6 relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-gray-500">Or upload bulk ZIP</span>
                            </div>
                        </div>

                        <div className="mb-8">
                             <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-chill-400 transition-colors cursor-pointer"
                                  onClick={() => document.getElementById('bulk-zip-upload').click()}>
                                <div className="space-y-1 text-center">
                                    <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="bulk-zip-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-chill-600 hover:text-blue-chill-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-chill-500">
                                            <span>Upload ZIP of Certificates</span>
                                            <input 
                                                id="bulk-zip-upload" 
                                                name="bulk-zip-upload" 
                                                type="file" 
                                                accept=".zip" 
                                                className="sr-only"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setLoading(true);
                                                        setBulkResults(null);
                                                        setError('');
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            const res = await employerApi.bulkVerifyUpload(formData);
                                                            
                                                            // The backend returns { report: { ... } }
                                                            // We normalize it to a flat list for the table if possible, or handle report structure
                                                            if (res.data.data.report) {
                                                                // Use the detailed verification results
                                                                const flatResults = res.data.data.report.verification_results.map(r => ({
                                                                    id: r.credential?.credential_id || r.id || r.credential_id || 'Unknown',
                                                                    status: r.status,
                                                                    valid: r.status === 'VALID',
                                                                    error: r.error || r.reason,
                                                                    credential: r.credential,
                                                                    verified_fields: r.verified_fields
                                                                }));
                                                                
                                                                // If there were extraction errors, append them too
                                                                if (res.data.data.report.extraction_errors && res.data.data.report.extraction_errors.length > 0) {
                                                                    res.data.data.report.extraction_errors.forEach(err => {
                                                                        flatResults.push({
                                                                            id: err.filename,
                                                                            status: 'ERROR',
                                                                            valid: false,
                                                                            error: `Extraction failed: ${err.error}`
                                                                        });
                                                                    });
                                                                }

                                                                if (flatResults.length === 0 && res.data.data.report.processed_files === 0) {
                                                                     setError("No valid certificate files found in ZIP.");
                                                                } else if (flatResults.length === 0) {
                                                                     setError("No credential IDs could be extracted from the files.");
                                                                } else {
                                                                    setBulkResults(flatResults);
                                                                }
                                                            } else {
                                                                // Fallback for CSV direct list
                                                                setBulkResults(res.data.data);
                                                            }
                                                        } catch (err) {
                                                            console.error("Bulk upload failed", err);
                                                            setError(err.response?.data?.message || 'Bulk verify upload failed');
                                                        } finally {
                                                            setLoading(false);
                                                            e.target.value = null;
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="pl-1">to verify multiple PDFs</p>
                                    </div>
                                    <p className="text-xs text-gray-500">ZIP archive containing PDFs</p>
                                </div>
                            </div>
                        </div>

                        {bulkResults && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 border-b pb-2">Batch Results ({bulkResults.length})</h3>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
                                                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                                <th className="px-6 py-4 font-semibold text-gray-600">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {bulkResults.map((res, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-gray-600">{res.id}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${res.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {!res.valid ? (
                                                            <span className="text-red-600 text-xs">{res.error || 'Verification Failed'}</span>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={14} /> Verified</span>
                                                                <button 
                                                                    onClick={() => setSelectedResult(res)}
                                                                    className="flex items-center gap-1 text-blue-chill-600 bg-blue-chill-50 px-2 py-1 rounded-md text-xs font-bold hover:bg-blue-chill-100 transition-colors"
                                                                >
                                                                    <Eye size={12} /> View
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
