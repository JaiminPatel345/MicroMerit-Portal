import React, { useState, useEffect } from 'react';
import { credentialServices } from '../../services/credentialServices';
import { Award, CheckCircle, Clock, XCircle } from './icons';
import { setNotification } from '../../utils/notification';
import NSQFVerificationModal from '../../components/NSQFVerificationModal';

const Credentials = () => {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [verifyingCredential, setVerifyingCredential] = useState(null);
    const [processingVerification, setProcessingVerification] = useState(false);

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const response = await credentialServices.getIssuerCredentials();
            if (response.success) {
                setCredentials(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch credentials", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, []);

    const handleVerifyNSQF = async (status) => {
        if (!verifyingCredential) return;

        setProcessingVerification(true);
        try {
            const aiData = verifyingCredential.metadata?.ai_extracted || {};
            const nsqfAlignment = aiData.nsqf_alignment || {};

            const isApproved = status === 'approved';

            const verificationData = {
                aligned: isApproved,
                qp_code: isApproved ? nsqfAlignment.qp_code : null,
                nos_code: isApproved ? nsqfAlignment.nos_code : null,
                nsqf_level: isApproved ? nsqfAlignment.nsqf_level : null,
                confidence: nsqfAlignment.confidence,
                reasoning: isApproved ? 'Issuer approved AI mapping' : 'Issuer rejected AI mapping'
            };

            await credentialServices.verifyNSQFAlignment(verifyingCredential.credential_id, verificationData);

            setNotification(`NSQF Alignment ${status === 'approved' ? 'Verified' : 'Rejected'}`, 'success');
            setVerifyingCredential(null);
            fetchCredentials(); // Refresh list
        } catch (error) {
            console.error("Verification failed", error);
            setNotification("Failed to update verification status", "error");
        } finally {
            setProcessingVerification(false);
        }
    };

    const StatusBadge = ({ status }) => {
        let classes = "";
        let icon = null;
        if (status === 'issued' || status === 'claimed') {
            classes = "bg-green-100 text-green-800 border-green-300";
            icon = <CheckCircle className="w-3 h-3 mr-1" />;
        } else {
            classes = "bg-yellow-100 text-yellow-800 border-yellow-300";
            icon = <Clock className="w-3 h-3 mr-1" />;
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${classes}`}>
                {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6 relative">
            {/* Verification Modal */}
            <NSQFVerificationModal
                isOpen={!!verifyingCredential}
                onClose={() => setVerifyingCredential(null)}
                credentialData={verifyingCredential}
                onVerify={handleVerifyNSQF}
                isProcessing={processingVerification}
            />

            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Issued Credentials</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage and track all digital credentials issued by your organization.</p>
                </div>
                <div className="flex space-x-3">
                    <input
                        type="text"
                        placeholder="Search credentials..."
                        className="p-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 outline-none transition duration-150"
                    />
                    <button
                        onClick={fetchCredentials}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                        title="Refresh List"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credential ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NSQF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <svg className="animate-spin h-8 w-8 text-blue-chill-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            ) : credentials.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <Award className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No credentials found</p>
                                        <p className="text-sm text-gray-500">Start by issuing your first credential.</p>
                                    </td>
                                </tr>
                            ) : (
                                credentials.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                            {c.credential_id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{c.learner_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.certificate_title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(c.issued_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {c.metadata?.ai_extracted?.nsqf_alignment?.verified_by_issuer ? (
                                                c.metadata.ai_extracted.nsqf_alignment.aligned ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        Rejected
                                                    </span>
                                                )
                                            ) : c.metadata?.ai_extracted?.nsqf_alignment ? (
                                                <button
                                                    onClick={() => setVerifyingCredential(c)}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition cursor-pointer"
                                                >
                                                    Verify Now
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={c.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-chill-600 hover:text-blue-chill-900 mr-4 font-semibold"
                                            >
                                                View PDF
                                            </a>
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${c.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Verify
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Credentials;
