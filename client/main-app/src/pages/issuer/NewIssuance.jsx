import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Send, Trash, Plus, CheckCircle, XCircle } from './icons';
import { credentialServices } from '../../services/credentialServices';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { setNotification } from '../../utils/notification';
import NSQFVerificationModal from '../../components/NSQFVerificationModal';

const NewIssuance = () => {
    const { issuer } = useSelector((state) => state.authIssuer);
    const [issuanceType, setIssuanceType] = useState('single'); // Default to single
    const [successData, setSuccessData] = useState(null);

    // Single Issuance State
    const [formData, setFormData] = useState({
        learnerEmail: '',
        courseName: '',
        file: null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Bulk Issuance State
    const [bulkEntries, setBulkEntries] = useState([]);
    const [processing, setProcessing] = useState(false);

    // Global Title State
    const [globalTitle, setGlobalTitle] = useState('');

    const applyGlobalTitle = () => {
        if (!globalTitle.trim()) return;
        setBulkEntries(bulkEntries.map(entry => ({
            ...entry,
            courseName: globalTitle
        })));
        setNotification("Applied title to all entries", "success");
    };

    // Edit/Verify Modal State
    const [editingEntry, setEditingEntry] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Analysis Modal State
    const [analyzingData, setAnalyzingData] = useState(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [isIssuingAfterAnalysis, setIsIssuingAfterAnalysis] = useState(false);

    const handleClearAll = () => {
        setShowClearConfirm(true);
    };

    const confirmClearAll = () => {
        setBulkEntries([]);
        setShowClearConfirm(false);
        setNotification("All entries cleared", "success");
    };

    // Cleanup preview URL when modal closes or entry changes
    useEffect(() => {
        if (editingEntry && editingEntry.fileBlob) {
            const url = URL.createObjectURL(editingEntry.fileBlob);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [editingEntry?.fileBlob]); // Only update if the file itself changes

    const handleChange = (e) => {
        if (e.target.name === 'file') {
            setFormData({ ...formData, file: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSingleIssuance = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setMessage('Please upload a certificate file (PDF/Image).');
            return;
        }

        if (!issuer || !issuer.id) {
            setMessage('Issuer information not found. Please log in again.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const payload = new FormData();
            payload.append('learner_email', formData.learnerEmail);
            payload.append('certificate_title', formData.courseName);
            payload.append('original_pdf', formData.file);

            // Step 1: Analyze Credential
            const analysisResponse = await credentialServices.analyzeCredential(payload);

            if (analysisResponse.success) {
                // Prepare data for modal
                const analysisData = {
                    ...analysisResponse.data,
                    learner_email: formData.learnerEmail,
                    certificate_title: formData.courseName,
                    // Mock metadata structure for the modal
                    metadata: {
                        ai_extracted: analysisResponse.data
                    }
                };

                setAnalyzingData(analysisData);
                setShowAnalysisModal(true);
            }
        } catch (error) {
            console.error("Analysis error:", error);
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to analyze credential.');
        } finally {
            setLoading(false);
        }
    };

    const confirmIssuance = async (status) => {
        if (!analyzingData) return;

        setIsIssuingAfterAnalysis(true);

        try {
            const payload = new FormData();
            payload.append('learner_email', formData.learnerEmail);
            payload.append('certificate_title', formData.courseName);
            payload.append('issued_at', new Date().toISOString());
            payload.append('original_pdf', formData.file);

            // Add AI data and verification status
            // We need to pass this as JSON string because we are using FormData
            // But wait, the backend expects specific fields in the body if not FormData?
            // Actually, for file upload we MUST use FormData.
            // Let's check how to pass complex objects in FormData or if we need to adjust backend.
            // The backend controller uses `req.body` which is populated by multer for text fields.
            // We can pass JSON strings for complex objects.

            // However, the service expects `ai_extracted_data` object.
            // We need to modify the controller to parse these fields if they are sent as strings.
            // OR we can just rely on the fact that we have the data here.

            // Wait, I didn't update the controller to parse JSON strings from FormData!
            // I should probably do that. But for now let's try sending as is.
            // Actually, multer populates req.body with text fields.

            // Let's update the controller to parse these fields.
            // But I can't update the controller right now inside this tool call.
            // I will assume I will update the controller next.

            // For now, let's construct the payload.

            const aiData = analyzingData.metadata.ai_extracted;
            const verificationStatus = {
                aligned: status === 'approved',
                qp_code: aiData.nsqf_alignment?.qp_code,
                nos_code: aiData.nsqf_alignment?.nos_code,
                nsqf_level: aiData.nsqf_alignment?.nsqf_level,
                confidence: aiData.nsqf_alignment?.confidence,
                reasoning: status === 'approved' ? 'Issuer approved AI mapping' : 'Issuer rejected AI mapping'
            };

            // We'll send these as JSON strings and update controller to parse them
            payload.append('ai_extracted_data', JSON.stringify(aiData));
            payload.append('verification_status', JSON.stringify(verificationStatus));

            const response = await credentialServices.issueCredential(payload);
            if (response.success) {
                setSuccessData(response.data);
                setMessage('Credential issued successfully!');
                setFormData({
                    learnerEmail: '',
                    courseName: '',
                    file: null
                });
                const fileInput = document.getElementById('certificate-file');
                if (fileInput) fileInput.value = '';
                setShowAnalysisModal(false);
                setAnalyzingData(null);
            }
        } catch (error) {
            console.error("Issuance error:", error);
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to issue credential.');
            setNotification("Failed to issue credential", "error");
        } finally {
            setIsIssuingAfterAnalysis(false);
        }
    };

    // Bulk Upload Handlers
    const handleBulkFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessing(true);
        const entries = [];

        try {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        results.data.forEach((row, index) => {
                            entries.push({
                                id: Date.now() + index,
                                learnerEmail: row.email || row.learnerEmail || '',
                                courseName: globalTitle || row.title || row.courseName || '',
                                file: null,
                                status: 'pending'
                            });
                        });
                        setBulkEntries(entries);
                        setProcessing(false);
                    },
                    error: (error) => {
                        console.error("CSV Error:", error);
                        setNotification("Failed to parse CSV", "error");
                        setProcessing(false);
                    }
                });
            } else if (file.name.endsWith('.zip')) {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);

                let index = 0;
                contents.forEach((relativePath, zipEntry) => {
                    if (!zipEntry.dir && (relativePath.endsWith('.pdf') || relativePath.match(/\.(jpg|jpeg|png)$/i))) {
                        const filename = relativePath.split('/').pop();
                        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

                        entries.push({
                            id: Date.now() + index++,
                            learnerEmail: '',
                            courseName: globalTitle || nameWithoutExt.replace(/_/g, ' '),
                            file: zipEntry,
                            fileName: filename,
                            status: 'pending'
                        });
                    }
                });

                for (let entry of entries) {
                    const blob = await entry.file.async('blob');
                    entry.fileBlob = new File([blob], entry.fileName, { type: 'application/pdf' });
                }

                setBulkEntries(entries);
                setProcessing(false);
            } else {
                setNotification("Unsupported file type. Please upload .csv or .zip", "error");
                setProcessing(false);
            }
        } catch (error) {
            console.error("Bulk processing error:", error);
            setNotification("Failed to process file", "error");
            setProcessing(false);
        }
    };

    const handleEntryChange = (id, field, value) => {
        setBulkEntries(bulkEntries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
        // Also update the editing entry if it's the one being modified
        if (editingEntry && editingEntry.id === id) {
            setEditingEntry({ ...editingEntry, [field]: value });
        }
    };

    const handleEntryFileChange = (id, file) => {
        setBulkEntries(bulkEntries.map(entry =>
            entry.id === id ? { ...entry, fileBlob: file } : entry
        ));
        if (editingEntry && editingEntry.id === id) {
            setEditingEntry({ ...editingEntry, fileBlob: file });
        }
    };

    const removeEntry = (id) => {
        setBulkEntries(bulkEntries.filter(entry => entry.id !== id));
        if (editingEntry && editingEntry.id === id) {
            setEditingEntry(null);
        }
    };

    const issueEntry = async (id) => {
        // Use the entry from the list (which should be up to date)
        const entry = bulkEntries.find(e => e.id === id);
        if (!entry) return;

        if (!entry.learnerEmail || !entry.courseName || !entry.fileBlob) {
            setNotification("Please fill all fields for this entry", "error");
            return;
        }

        // Set status to issuing
        setBulkEntries(bulkEntries.map(e => e.id === id ? { ...e, status: 'issuing' } : e));
        if (editingEntry && editingEntry.id === id) {
            setEditingEntry({ ...editingEntry, status: 'issuing' });
        }

        try {
            const payload = new FormData();
            payload.append('learner_email', entry.learnerEmail);
            payload.append('certificate_title', entry.courseName);
            payload.append('issued_at', new Date().toISOString());
            payload.append('original_pdf', entry.fileBlob);

            const response = await credentialServices.issueCredential(payload);
            if (response.success) {
                setNotification(`Credential issued to ${entry.learnerEmail}`, "success");
                // Remove from list
                removeEntry(id);
                // Close modal if open
                if (editingEntry && editingEntry.id === id) {
                    setEditingEntry(null);
                }
            }
        } catch (error) {
            console.error("Issuance error:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            setNotification(`Failed to issue to ${entry.learnerEmail}: ${errorMessage}`, "error");
            // Reset status
            setBulkEntries(bulkEntries.map(e => e.id === id ? { ...e, status: 'error' } : e));
            if (editingEntry && editingEntry.id === id) {
                setEditingEntry({ ...editingEntry, status: 'error' });
            }
        }
    };

    const downloadJSON = () => {
        if (!successData) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(successData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `credential-${successData.credential_id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const resetForm = () => {
        setSuccessData(null);
        setMessage('');
    };

    // Component to render small thumbnail
    const FileThumbnail = ({ file, onClick }) => {
        const [thumbUrl, setThumbUrl] = useState(null);

        useEffect(() => {
            if (file) {
                const url = URL.createObjectURL(file);
                setThumbUrl(url);
                return () => URL.revokeObjectURL(url);
            }
        }, [file]);

        if (!file) return <div className="w-32 h-40 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No File</div>;

        // Robust check for image type
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(file.name);

        return (
            <div
                className="w-32 h-40 bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition relative group"
                onClick={onClick}
                title={`Click to verify ${file.name}`}
            >
                {isImage ? (
                    <img src={thumbUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" /><path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                        </div>
                        <div className="text-center w-full">
                            <p className="text-xs font-medium text-gray-700 truncate w-full" title={file.name}>{file.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">PDF Document</p>
                        </div>
                        <div className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to View
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (successData) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 p-8 border rounded-xl shadow-lg bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Credential Issued Successfully!</h3>
                    <p className="text-gray-600">The credential has been secured on the blockchain and IPFS.</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Credential ID:</span>
                        <span className="col-span-2 font-mono text-gray-800 break-all">{successData.credential_id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Learner Email:</span>
                        <span className="col-span-2 text-gray-800">{successData.learner_email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Certificate Title:</span>
                        <span className="col-span-2 text-gray-800">{successData.certificate_title}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">IPFS CID:</span>
                        <span className="col-span-2 font-mono text-blue-600 break-all">{successData.ipfs_cid}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Transaction Hash:</span>
                        <span className="col-span-2 font-mono text-purple-600 break-all">{successData.tx_hash}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href={successData.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View on IPFS
                    </a>
                    <button
                        onClick={downloadJSON}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Download JSON
                    </button>
                    <button
                        onClick={resetForm}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Issue Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 relative">
            {/* Analysis & Verification Modal */}
            <NSQFVerificationModal
                isOpen={showAnalysisModal}
                onClose={() => {
                    setShowAnalysisModal(false);
                    setAnalyzingData(null);
                }}
                credentialData={analyzingData}
                onVerify={confirmIssuance}
                isProcessing={isIssuingAfterAnalysis}
                title="Verify Credential Before Issuance"
            />

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 border border-gray-200">
                        <div className="flex items-center space-x-3 text-red-600">
                            <div className="bg-red-100 p-2 rounded-full">
                                <Trash className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Clear All Entries?</h3>
                        </div>
                        <p className="text-gray-600">
                            Are you sure you want to remove all <strong>{bulkEntries.length}</strong> pending entries? This action cannot be undone.
                        </p>
                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={confirmClearAll}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-sm"
                            >
                                Yes, Clear All
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Verify & Issue Modal */}
            {editingEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden border border-gray-200">

                        {/* Left Side: Preview (Expanded) */}
                        <div className="w-2/3 md:w-3/4 bg-gray-100 border-r border-gray-200 flex flex-col h-full">
                            <div className="p-3 border-b bg-white flex justify-between items-center flex-shrink-0">
                                <h3 className="font-semibold text-gray-700">Document Preview</h3>
                                <span className="text-xs text-gray-500">{editingEntry.fileName}</span>
                            </div>
                            <div className="flex-grow relative bg-gray-200 overflow-hidden h-full">
                                {previewUrl ? (
                                    editingEntry.fileBlob?.type.startsWith('image/') ? (
                                        <img src={previewUrl} alt="Full Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
                                    )
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Preview Available</div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Form & Actions (Narrower) */}
                        <div className="w-1/3 md:w-1/4 bg-white flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Verify & Issue</h3>
                                <button onClick={() => setEditingEntry(null)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Recipient Email</label>
                                        <input
                                            type="email"
                                            value={editingEntry.learnerEmail}
                                            onChange={(e) => handleEntryChange(editingEntry.id, 'learnerEmail', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition"
                                            placeholder="learner@example.com"
                                        />
                                        <p className="text-xs text-gray-500">Verify email matches the document.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Certificate Title</label>
                                        <input
                                            type="text"
                                            value={editingEntry.courseName}
                                            onChange={(e) => handleEntryChange(editingEntry.id, 'courseName', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition"
                                            placeholder="e.g. React Mastery"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Verification Checklist</h4>
                                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                        <li>Confirm recipient name matches email.</li>
                                        <li>Verify course title and date.</li>
                                        <li>Ensure document is legible.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50 space-y-3 mt-auto">
                                <button
                                    onClick={() => issueEntry(editingEntry.id)}
                                    disabled={editingEntry.status === 'issuing'}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition flex justify-center items-center disabled:bg-gray-400"
                                >
                                    {editingEntry.status === 'issuing' ? 'Issuing...' : 'Verify & Issue Now'}
                                </button>
                                <button
                                    onClick={() => setEditingEntry(null)}
                                    className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                                >
                                    Save & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Start Credential Issuance</h3>
                <p className="text-gray-500">Issue secure, blockchain-verified credentials to your learners.</p>
            </div>

            <div className="flex justify-center space-x-4">
                <button onClick={() => setIssuanceType('single')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'single' ? 'bg-blue-chill-600 text-white border-blue-chill-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Single Issuance</button>
                <button onClick={() => setIssuanceType('bulk')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'bulk' ? 'bg-blue-chill-600 text-white border-blue-chill-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Bulk Issuance</button>
            </div>


            {issuanceType === 'single' ? (
                <form onSubmit={handleSingleIssuance} className="p-8 border rounded-xl shadow-lg bg-white space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 gap-6">
                        {message && (
                            <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Recipient Email</label>
                            <input type="email" name="learnerEmail" value={formData.learnerEmail} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition" placeholder="john.doe@email.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Certificate Title / Course Name</label>
                            <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 transition" placeholder="e.g. React Mastery" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Certificate File (PDF/Image)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition cursor-pointer relative">
                                <input
                                    type="file"
                                    id="certificate-file"
                                    name="file"
                                    onChange={handleChange}
                                    required
                                    accept=".pdf,image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-20" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" />
                                        <path d="M18 10h4l2 3h4M10 24h28M10 32h28" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <span className="relative rounded-md font-medium text-blue-chill-600 hover:text-blue-chill-500">
                                            Upload a file
                                        </span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                    {formData.file && <p className="text-sm font-semibold text-blue-chill-600 mt-2">Selected: {formData.file.name}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-chill-600 text-white p-3 rounded-lg font-bold shadow-lg hover:bg-blue-chill-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Issuing Credential...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" /> Issue Credential
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Upload Area */}
                    {bulkEntries.length === 0 && (
                        <div className="p-8 border rounded-xl shadow-lg bg-white text-center">
                            <div className="space-y-4">
                                <div className="mx-auto h-16 w-16 bg-blue-chill-50 rounded-full flex items-center justify-center">
                                    <svg className="h-8 w-8 text-blue-chill-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900">Upload Bulk Data</h4>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Upload a <strong>.zip</strong> file containing certificates (PDFs) or a <strong>.csv</strong> file with recipient details.
                                </p>

                                <div className="flex justify-center pt-4">
                                    <label className="relative cursor-pointer bg-blue-chill-600 hover:bg-blue-chill-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200">
                                        <span>Select File</span>
                                        <input type="file" className="sr-only" accept=".csv,.zip" onChange={handleBulkFileUpload} disabled={processing} />
                                    </label>
                                </div>
                                {processing && <p className="text-sm text-blue-chill-600 animate-pulse">Processing file...</p>}
                            </div>
                        </div>
                    )}

                    {/* Entries List */}
                    {bulkEntries.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Pending Issuances ({bulkEntries.length})</h4>
                                    <p className="text-xs text-gray-500">Review and issue credentials individually.</p>
                                </div>

                                <div className="flex items-center space-x-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Default Certificate Title"
                                        value={globalTitle}
                                        onChange={(e) => setGlobalTitle(e.target.value)}
                                        className="p-2 border rounded text-sm flex-grow md:w-64"
                                    />
                                    <button
                                        onClick={applyGlobalTitle}
                                        className="px-3 py-2 bg-blue-chill-100 text-blue-chill-700 rounded text-sm font-medium hover:bg-blue-chill-200 transition whitespace-nowrap"
                                    >
                                        Apply to All
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="ml-2 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition whitespace-nowrap shadow-sm"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {bulkEntries.map((entry) => (
                                    <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row gap-4 items-start">

                                        {/* Thumbnail Preview */}
                                        <div className="flex-shrink-0 pt-1">
                                            <FileThumbnail file={entry.fileBlob} onClick={() => setEditingEntry(entry)} />
                                        </div>

                                        <div className="flex-grow w-full space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Learner Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="learner@example.com"
                                                        value={entry.learnerEmail}
                                                        onChange={(e) => handleEntryChange(entry.id, 'learnerEmail', e.target.value)}
                                                        className="p-2 border border-gray-300 rounded text-sm w-full focus:ring-1 focus:ring-blue-chill-500 focus:border-blue-chill-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Certificate Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Certificate Title"
                                                        value={entry.courseName}
                                                        onChange={(e) => handleEntryChange(entry.id, 'courseName', e.target.value)}
                                                        className="p-2 border border-gray-300 rounded text-sm w-full focus:ring-1 focus:ring-blue-chill-500 focus:border-blue-chill-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                {entry.fileBlob ? (
                                                    <button onClick={() => setEditingEntry(entry)} className="text-green-600 flex items-center truncate max-w-xs font-medium bg-green-50 px-2 py-0.5 rounded hover:bg-green-100 transition">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {entry.fileBlob.name}
                                                    </button>
                                                ) : (
                                                    <label className="cursor-pointer text-blue-chill-600 hover:underline flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Upload PDF
                                                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleEntryFileChange(entry.id, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 w-full md:w-auto justify-end mt-1 md:mt-6">
                                            <button
                                                onClick={() => setEditingEntry(entry)}
                                                className="px-4 py-2 bg-blue-chill-50 text-blue-chill-700 rounded-lg font-medium text-sm hover:bg-blue-chill-100 transition whitespace-nowrap"
                                            >
                                                Verify & Issue
                                            </button>
                                            <button
                                                onClick={() => removeEntry(entry.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition bg-gray-50 rounded-lg hover:bg-red-50"
                                                title="Remove"
                                            >
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default NewIssuance;