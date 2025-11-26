import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Send } from './icons';
import { credentialServices } from '../../services/credentialServices';


const NewIssuance = () => {
    const { issuer } = useSelector((state) => state.authIssuer);
    const [issuanceType, setIssuanceType] = useState('bulk');
    const [successData, setSuccessData] = useState(null);

    // Templates kept for UI consistency if needed later, but not used in current backend schema
    const templates = [
        { id: 1, name: 'Course Completion Certificate', version: '1.2', status: 'Active' },
        { id: 2, name: 'Professional Certification', version: '3.0', status: 'Active' },
        { id: 3, name: 'Skill Badge: JavaScript', version: '1.0', status: 'Active' },
    ];


    const [formData, setFormData] = useState({
        learnerEmail: '',
        courseName: '',
        file: null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        if (e.target.name === 'file') {
            setFormData({ ...formData, file: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleIssuance = async (e) => {
        e.preventDefault();
        if (issuanceType === 'bulk') {
            alert(`[Simulated] Starting ${issuanceType} issuance... Check console.`);
            console.log(`[Issuance] Starting issuance process: ${issuanceType}`);
            return;
        }

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
            // issuer_id is handled by backend auth
            payload.append('certificate_title', formData.courseName);
            payload.append('issued_at', new Date().toISOString());
            payload.append('original_pdf', formData.file);

            const response = await credentialServices.issueCredential(payload);
            if (response.success) {
                setSuccessData(response.data);
                setMessage('Credential issued successfully!');
                setFormData({
                    learnerEmail: '',
                    courseName: '',
                    file: null
                });
                // Reset file input manually
                const fileInput = document.getElementById('certificate-file');
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            console.error("Issuance error:", error);
            setMessage(error.response?.data?.message || 'Failed to issue credential.');
        } finally {
            setLoading(false);
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

    if (successData) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 p-8 border rounded-xl shadow-lg bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
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
        <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-2xl font-semibold text-gray-800 text-center">Start Credential Issuance</h3>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIssuanceType('bulk')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'bulk' ? 'bg-blue-chill-600 text-white border-blue-chill-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Bulk Issuance (CSV/API)</button>
                <button onClick={() => setIssuanceType('single')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'single' ? 'bg-blue-chill-600 text-white border-blue-chill-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Single Issuance (Form)</button>
            </div>


            <form onSubmit={handleIssuance} className="p-8 border rounded-xl shadow-lg bg-gray-50 space-y-6">

                {issuanceType === 'bulk' ? (
                    <div className="space-y-2">
                        <label htmlFor="upload" className="block text-sm font-medium text-gray-700">Recipient Data File (CSV)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-20" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" /><path d="M18 10h4l2 3h4M10 24h28M10 32h28" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" /></svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-chill-600 hover:text-blue-chill-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-chill-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">CSV up to 10MB</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                            <input type="email" name="learnerEmail" value={formData.learnerEmail} onChange={handleChange} required className="w-full p-3 border rounded-lg" placeholder="john.doe@email.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Certificate Title / Course Name</label>
                            <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} required className="w-full p-3 border rounded-lg" placeholder="e.g. React Mastery" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Certificate File (PDF/Image)</label>
                            <input
                                type="file"
                                id="certificate-file"
                                name="file"
                                onChange={handleChange}
                                required
                                accept=".pdf,image/*"
                                className="w-full p-3 border rounded-lg bg-white"
                            />
                        </div>
                    </div>
                )}


                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400">
                    {loading ? 'Issuing...' : <><svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" /></svg> Issue Credentials</>}
                </button>
            </form>
        </div>
    );
};
export default NewIssuance;