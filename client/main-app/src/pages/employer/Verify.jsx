import React, { useState } from 'react';
import { employerApi } from '../../services/authServices';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Search, Loader, Globe, FileText, ArrowLeft, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const EmployerVerify = () => {
    const [activeTab, setActiveTab] = useState('single');
    const [inputValue, setInputValue] = useState('');
    const [inputType, setInputType] = useState('credential_id'); // Default, but will auto-detect
    const [verifyResult, setVerifyResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [bulkIds, setBulkIds] = useState('');
    const [bulkResults, setBulkResults] = useState(null);

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
                                                        {res.error || (res.valid ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Verified</span> : 'Verification Failed')}
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
        </div>
    );
};

export default EmployerVerify;
