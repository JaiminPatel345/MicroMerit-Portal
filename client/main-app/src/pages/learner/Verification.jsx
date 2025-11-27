import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Search, FileText, User, Calendar, Hash, Globe, ShieldCheck } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const Verification = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [inputValue, setInputValue] = useState(id || '');
    const [inputType, setInputType] = useState('credential_id');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            // Auto-detect type for URL parameter
            handleVerify(id, detectInputType(id));
        }
    }, [id]);

    const detectInputType = (value) => {
        if (value.length === 36 && value.includes('-')) {
            return 'credential_id';
        } else if (value.startsWith('0x') && value.length > 40) {
            return 'tx_hash';
        } else if (value.startsWith('Qm') || value.startsWith('bafy')) {
            return 'ipfs_cid';
        }
        return 'credential_id';
    };

    const handleVerify = async (value, type = inputType) => {
        if (!value) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Build payload based on selected type
            const payload = { [type]: value };

            const response = await axios.post(`${API_BASE_URL}/credentials/verify`, payload);

            if (response.data.success) {
                setResult(response.data.data);
            } else {
                setError(response.data.message || 'Verification failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'An error occurred during verification');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleVerify(inputValue);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Credential Verification
                    </h1>
                    <p className="text-lg text-gray-600">
                        Verify the authenticity of digital credentials issued on the MicroMerit platform.
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="flex flex-col gap-4">
                            {/* Input Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Type
                                </label>
                                <select
                                    value={inputType}
                                    onChange={(e) => setInputType(e.target.value)}
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out"
                                >
                                    <option value="credential_id">Credential ID</option>
                                    <option value="tx_hash">Transaction Hash</option>
                                    <option value="ipfs_cid">IPFS CID</option>
                                </select>
                            </div>

                            {/* Input Field and Button */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                                        placeholder={
                                            inputType === 'credential_id'
                                                ? 'Enter Credential ID (e.g., 550e8400-e29b-41d4-a716-446655440000)'
                                                : inputType === 'tx_hash'
                                                    ? 'Enter Transaction Hash (e.g., 0x123...)'
                                                    : 'Enter IPFS CID (e.g., Qm... or bafy...)'
                                        }
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !inputValue}
                                    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 ${loading || !inputValue ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Status Banner */}
                        <div className={`rounded-xl shadow-md overflow-hidden ${result.status === 'VALID' && result.credential?.status !== 'revoked'
                            ? 'bg-white border-t-4 border-green-500'
                            : 'bg-white border-t-4 border-red-500'
                            }`}>
                            <div className="p-6">
                                <div className="flex items-center justify-center mb-6">
                                    {result.status === 'VALID' && result.credential?.status !== 'revoked' ? (
                                        <div className="flex flex-col items-center">
                                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                                <CheckCircle className="h-10 w-10 text-green-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-green-700">Valid Credential</h2>
                                            <p className="text-green-600 mt-1">This credential has been verified on the blockchain.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                                <XCircle className="h-10 w-10 text-red-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-red-700">
                                                {result.credential?.status === 'revoked' ? 'Credential Revoked' : 'Invalid Credential'}
                                            </h2>
                                            <p className="text-red-600 mt-1">
                                                {result.credential?.status === 'revoked'
                                                    ? 'This credential has been revoked by the issuer.'
                                                    : (result.reason || 'Verification failed.')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Verification Checks */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                        <div className={`mr-3 ${result.verified_fields?.hash_match ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.verified_fields?.hash_match ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Data Integrity</span>
                                    </div>
                                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                        <div className={`mr-3 ${result.verified_fields?.blockchain_verified ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.verified_fields?.blockchain_verified ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Blockchain Record</span>
                                    </div>
                                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                        <div className={`mr-3 ${result.verified_fields?.ipfs_cid_match ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.verified_fields?.ipfs_cid_match ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">IPFS Storage</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credential Details (Only if Valid) */}
                        {result.status === 'VALID' && result.credential && (
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FileText className="mr-2 h-5 w-5 text-primary-600" />
                                        Credential Details
                                    </h3>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                        {result.credential.status}
                                    </span>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate Title</label>
                                                <p className="mt-1 text-lg font-medium text-gray-900">{result.credential.certificate_title}</p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                                    <User className="mr-1 h-3 w-3" /> Learner
                                                </label>
                                                <div className="mt-1">
                                                    <p className="text-base font-medium text-gray-900">{result.credential.learner?.name || 'N/A'}</p>
                                                    <p className="text-sm text-gray-500">{result.credential.learner_email}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                                    <ShieldCheck className="mr-1 h-3 w-3" /> Issuer
                                                </label>
                                                <div className="mt-1">
                                                    <p className="text-base font-medium text-gray-900">{result.credential.issuer?.name}</p>
                                                    <p className="text-sm text-gray-500 capitalize">{result.credential.issuer?.type?.replace('_', ' ')}</p>
                                                    {result.credential.issuer?.website_url && (
                                                        <a href={result.credential.issuer.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
                                                            {result.credential.issuer.website_url}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3" /> Issued On
                                                </label>
                                                <p className="mt-1 text-base text-gray-900">{formatDate(result.credential.issued_at)}</p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                                    <Hash className="mr-1 h-3 w-3" /> Credential ID
                                                </label>
                                                <p className="mt-1 text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                                                    {result.credential.credential_id}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                                    <Globe className="mr-1 h-3 w-3" /> Blockchain Transaction
                                                </label>
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${result.credential.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 block text-sm font-mono text-primary-600 hover:text-primary-700 hover:underline break-all"
                                                >
                                                    {result.credential.tx_hash}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                        {result.credential.pdf_url && (
                                            <a
                                                href={result.credential.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                View Certificate
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Verification;
