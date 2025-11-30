import React from 'react';
import { XCircle } from '../pages/issuer/icons';

const NSQFVerificationModal = ({ isOpen, onClose, credentialData, onVerify, isProcessing, title = "Verify NSQF Alignment" }) => {
    if (!isOpen || !credentialData) return null;

    const aiData = credentialData.metadata?.ai_extracted || credentialData.ai_extracted || {};
    const nsqfAlignment = aiData.nsqf_alignment;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Certificate Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-700 border-b pb-2">Certificate Details</h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                                <p><span className="font-medium text-gray-600">Title:</span> {credentialData.certificate_title}</p>
                                <p><span className="font-medium text-gray-600">Recipient:</span> {credentialData.learner_email}</p>
                                {credentialData.issued_at && (
                                    <p><span className="font-medium text-gray-600">Issued:</span> {new Date(credentialData.issued_at).toLocaleDateString()}</p>
                                )}
                            </div>

                            <h4 className="font-semibold text-gray-700 border-b pb-2 pt-2">AI Extracted Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {aiData.skills?.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                                        {skill.name}
                                    </span>
                                )) || <p className="text-sm text-gray-500 italic">No skills extracted</p>}
                            </div>
                        </div>

                        {/* Right: NSQF Alignment */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-700 border-b pb-2">Proposed NSQF Alignment</h4>

                            {nsqfAlignment ? (
                                <div className="bg-blue-chill-50 p-5 rounded-lg border border-blue-chill-100 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-blue-chill-600 font-bold uppercase tracking-wide">Job Role / QP</p>
                                            <p className="text-lg font-bold text-gray-900">{nsqfAlignment.job_role || 'N/A'}</p>
                                            <p className="text-sm text-gray-600 font-mono">{nsqfAlignment.qp_code}</p>
                                        </div>
                                        <div className="bg-white px-3 py-1 rounded-full border border-blue-chill-200 shadow-sm">
                                            <span className="text-xs font-bold text-blue-chill-700">Level {nsqfAlignment.nsqf_level}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-blue-chill-200/50">
                                        <p className="text-xs text-blue-chill-600 font-bold uppercase tracking-wide mb-1">AI Reasoning</p>
                                        <p className="text-sm text-gray-700 italic">"{nsqfAlignment.reasoning}"</p>
                                    </div>

                                    <div className="flex items-center space-x-2 mt-2">
                                        <div className="h-1.5 flex-grow bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${(nsqfAlignment.confidence || 0) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">
                                            {Math.round((nsqfAlignment.confidence || 0) * 100)}% Match
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                                    <p className="text-gray-500">No NSQF alignment found for this certificate.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={() => onVerify('rejected')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                    >
                        Reject Mapping
                    </button>
                    <button
                        onClick={() => onVerify('approved')}
                        disabled={isProcessing || !nsqfAlignment}
                        className="px-4 py-2 bg-blue-chill-600 text-white font-bold rounded-lg hover:bg-blue-chill-700 transition shadow-md flex items-center"
                    >
                        {isProcessing ? 'Processing...' : 'Approve & Verify'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NSQFVerificationModal;
