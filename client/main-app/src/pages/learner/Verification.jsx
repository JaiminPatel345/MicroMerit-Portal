import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    CheckCircle,
    XCircle,
    Search,
    FileText,
    User,
    Calendar,
    Hash,
    Globe,
    ShieldCheck,
    Loader2,
    ArrowRight,
    Copy,
    Check,
    Camera
} from 'lucide-react';
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
        <button
            onClick={handleCopy}
            className="ml-2 inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Copy to clipboard"
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
};

const Verification = () => {
    const { id } = useParams();
    const [inputValue, setInputValue] = useState(id || '');
    const [inputType, setInputType] = useState('credential_id');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    const handleCameraCapture = async (file) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Use public endpoint
            const res = await axios.post(`${API_BASE_URL}/credentials/extract-id`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success && res.data.data.found && res.data.data.credential_id) {
                const id = res.data.data.credential_id;
                setInputValue(id);
                setInputType('credential_id'); 
                
                if (res.data.data.status === 'needs_review') {
                        setError(`ID found with confidence ${res.data.data.confidence}%. Please verify: ${id}`);
                } else {
                    handleVerify(id, 'credential_id');
                }
            } else {
                setError(res.data.data?.message || 'No Credential ID found in image. Please manually enter.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to extract ID from image');
            setLoading(false);
        }
    };

    // Initial load handler
    useEffect(() => {
        if (id) {
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
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        Verify a Credential
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500">
                        Instantly verify the authenticity of certificates issued on the MicroMerit blockchain network.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                {/* Search Box Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Type Selector */}
                                <div className="md:col-span-1">
                                    <label htmlFor="verify-type" className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Method
                                    </label>
                                    <select
                                        id="verify-type"
                                        value={inputType}
                                        onChange={(e) => setInputType(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 py-3 px-4 text-gray-900 focus:border-blue-chill-500 focus:ring-blue-chill-500 sm:text-sm"
                                    >
                                        <option value="credential_id">Credential ID</option>
                                        <option value="tx_hash">Transaction Hash</option>
                                        <option value="ipfs_cid">IPFS CID</option>
                                    </select>
                                </div>

                                {/* Input Field */}
                                <div className="md:col-span-3">
                                    <label htmlFor="verify-input" className="block text-sm font-medium text-gray-700 mb-2">
                                        Credential Identifier
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            type="text"
                                            id="verify-input"
                                            className="block w-full rounded-lg border-gray-300 pl-10 py-3 focus:border-blue-chill-500 focus:ring-blue-chill-500 sm:text-sm"
                                            placeholder={
                                                inputType === 'credential_id'
                                                    ? 'e.g. 550e8400-e29b-41d4-a716-446655440000'
                                                    : inputType === 'tx_hash'
                                                        ? 'e.g. 0x123abc...'
                                                        : 'e.g. QmHash...'
                                            }
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !inputValue}
                                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200
                                    ${loading || !inputValue
                                        ? 'bg-blue-chill-400 cursor-not-allowed'
                                        : 'bg-blue-chill-600 hover:bg-blue-chill-700 hover:shadow-md'
                                    }`}
                            >
                                {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                {loading ? 'Verifying on Blockchain...' : 'Verify Authenticity'}
                            </button>
                        </form>

                        <div className="mt-8 relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-gray-500">Or verify using file</span>
                            </div>
                        </div>

                        <div className="mt-6">
                             <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-chill-400 transition-colors">
                                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                    {/* Upload Option */}
                                    <div className="flex-1 text-center border-r md:border-r-gray-200 md:pr-6 w-full">
                                        {loading && !result ? (
                                            <div className="py-2 flex flex-col items-center justify-center">
                                                 <Loader2 className="h-8 w-8 text-blue-chill-600 animate-spin mb-1" />
                                                 <p className="text-xs text-gray-500">Scanning...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                                <label htmlFor="file-upload" className="block relative cursor-pointer group">
                                                    <span className="font-medium text-blue-chill-600 group-hover:text-blue-chill-700">Upload Document</span>
                                                    <input 
                                                        id="file-upload" 
                                                        name="file-upload" 
                                                        type="file" 
                                                        accept=".pdf,.png,.jpg,.jpeg" 
                                                        className="sr-only"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setLoading(true);
                                                                setError(null);
                                                                setResult(null);
                                                                try {
                                                                    const formData = new FormData();
                                                                    formData.append('file', file);
                                                                    const res = await axios.post(`${API_BASE_URL}/credentials/extract-id`, formData, {
                                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                                    });
                                                                    
                                                                    if (res.data.success && res.data.data.found && res.data.data.credential_id) {
                                                                        const id = res.data.data.credential_id;
                                                                        setInputValue(id);
                                                                        setInputType('credential_id'); 
                                                                        if (res.data.data.status === 'needs_review') {
                                                                             setError(`ID found with confidence ${res.data.data.confidence}%. Please verify: ${id}`);
                                                                        } else {
                                                                            handleVerify(id, 'credential_id');
                                                                        }
                                                                    } else {
                                                                        setError(res.data.data?.message || 'No Credential ID found in document. Please manually enter.');
                                                                        setLoading(false);
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    setError(err.response?.data?.message || 'Failed to extract ID from document');
                                                                    setLoading(false);
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
                        </div>
                    </div>

                    {/* Loading State Overlay */}
                    {loading && !result && (
                        <div className="bg-gray-50 px-6 py-12 border-t border-gray-100 flex flex-col items-center justify-center text-center animate-fade-in">
                            <Loader2 className="h-10 w-10 text-blue-chill-600 animate-spin mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Verifying Credential</h3>
                            <p className="text-gray-500 mt-1 max-w-sm">
                                We are querying the blockchain and verifying data integrity. This may take a moment.
                            </p>
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4 animate-fade-in">
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-medium text-red-800">Verification Failed</h3>
                            <p className="mt-1 text-red-700">{error}</p>
                            <p className="mt-2 text-sm text-red-600">
                                Please check the identifier and try again. If the issue persists, contact the issuer.
                            </p>
                        </div>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <div className="mt-8 space-y-6 animate-fade-in">

                        {/* Status Card */}
                        <div className={`rounded-xl shadow-lg border overflow-hidden ${result.status === 'VALID' && result.credential?.status !== 'revoked'
                            ? 'bg-white border-green-200'
                            : 'bg-white border-red-200'
                            }`}>
                            <div className={`${result.status === 'VALID' && result.credential?.status !== 'revoked'
                                ? 'bg-green-50/50'
                                : 'bg-red-50/50'
                                } p-8 text-center border-b ${result.status === 'VALID' && result.credential?.status !== 'revoked'
                                    ? 'border-green-100'
                                    : 'border-red-100'
                                }`}>
                                {result.status === 'VALID' && result.credential?.status !== 'revoked' ? (
                                    <>
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Valid Credential</h2>
                                        <p className="text-gray-500 mt-2">
                                            Verified on <span className="font-medium text-gray-900">Sepolia Network</span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                            <XCircle className="h-8 w-8 text-red-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {result.credential?.status === 'revoked' ? 'Credential Revoked' : 'Invalid Credential'}
                                        </h2>
                                        <p className="text-red-500 mt-2">
                                            {result.reason || 'Authentication checks failed.'}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Verification Steps Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                <div className="p-4 flex items-center justify-center gap-3">
                                    {result.verified_fields?.hash_match
                                        ? <CheckCircle className="text-green-500 h-5 w-5" />
                                        : <XCircle className="text-red-500 h-5 w-5" />}
                                    <span className="font-medium text-gray-700">Data Integrity</span>
                                </div>
                                <div className="p-4 flex items-center justify-center gap-3">
                                    {result.verified_fields?.blockchain_verified
                                        ? <CheckCircle className="text-green-500 h-5 w-5" />
                                        : <XCircle className="text-red-500 h-5 w-5" />}
                                    <span className="font-medium text-gray-700">Blockchain Record</span>
                                </div>
                                <div className="p-4 flex items-center justify-center gap-3">
                                    {result.verified_fields?.ipfs_cid_match
                                        ? <CheckCircle className="text-green-500 h-5 w-5" />
                                        : <XCircle className="text-red-500 h-5 w-5" />}
                                    <span className="font-medium text-gray-700">IPFS Storage</span>
                                </div>
                            </div>
                        </div>


                        {/* Credential Details (Matched with Issuer Success UI) */}
                        {result.status === 'VALID' && result.credential && (
                            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 text-sm shadow-md animate-fade-in relative">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Credential Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <span className="font-semibold text-gray-600">Credential ID:</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className="font-mono text-gray-800 break-all bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            {result.credential.credential_id}
                                        </span>
                                        <CopyButton text={result.credential.credential_id} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <span className="font-semibold text-gray-600">Certificate Title:</span>
                                    <span className="col-span-2 text-gray-800 font-medium">{result.credential.certificate_title}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <span className="font-semibold text-gray-600">Issued To:</span>
                                    <div className="col-span-2 text-gray-800">
                                        <div className="font-medium">{result.credential.learner?.name || 'Authorized Learner'}</div>
                                        <div className="text-gray-500 text-xs">{result.credential.learner_email}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <span className="font-semibold text-gray-600">Issued By:</span>
                                    <div className="col-span-2 text-gray-800">
                                        <div className="font-medium">{result.credential.issuer?.name}</div>
                                        {result.credential.issuer?.website_url && (
                                            <a
                                                href={result.credential.issuer.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                {result.credential.issuer.website_url}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <span className="font-semibold text-gray-600">Issued On:</span>
                                    <span className="col-span-2 text-gray-800">{formatDate(result.credential.issued_at)}</span>
                                </div>

                                {result.credential.ipfs_cid && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <span className="font-semibold text-gray-600">IPFS CID:</span>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="font-mono text-gray-800 break-all bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                {result.credential.ipfs_cid}
                                            </span>
                                            <CopyButton text={result.credential.ipfs_cid} />
                                        </div>
                                    </div>
                                )}

                                {result.credential.data_hash && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <span className="font-semibold text-gray-600">Data Hash:</span>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="font-mono text-gray-800 break-all bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                {result.credential.data_hash}
                                            </span>
                                            <CopyButton text={result.credential.data_hash} />
                                        </div>
                                    </div>
                                )}

                                {result.credential.tx_hash ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <span className="font-semibold text-gray-600">Transaction Hash:</span>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="font-mono text-purple-600 break-all text-xs sm:text-sm">
                                                {result.credential.tx_hash}
                                            </span>
                                            <CopyButton text={result.credential.tx_hash} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <span className="font-semibold text-gray-600">Transaction Hash:</span>
                                        <span className="col-span-2 text-gray-500 italic">Pending confirmation</span>
                                    </div>
                                )}

                                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-100 mt-4">
                                    {result.credential.tx_hash && (
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${result.credential.tx_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm"
                                        >
                                            <Globe className="mr-2 h-4 w-4" />
                                            View on Blockchain
                                        </a>
                                    )}
                                    {result.credential.pdf_url && (
                                        <a
                                            href={result.credential.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Original Certificate
                                        </a>
                                    )}
                                    <Link
                                        to={`/c/${result.credential.credential_id}`}
                                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                                    >
                                        View Credential Details
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            {showCamera && (
                <CameraCapture 
                    onCapture={handleCameraCapture} 
                    onClose={() => setShowCamera(false)} 
                />
            )}
        </div>
    );
};

export default Verification;
