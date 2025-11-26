import React, { useState, useEffect } from 'react';
import { Send } from './icons';
import { credentialServices } from '../../services/credentialServices';


const NewIssuance = () => {
    const [issuanceType, setIssuanceType] = useState('bulk');
    const templates = [
        { id: 1, name: 'Course Completion Certificate', version: '1.2', status: 'Active' },
        { id: 2, name: 'Professional Certification', version: '3.0', status: 'Active' },
        { id: 3, name: 'Skill Badge: JavaScript', version: '1.0', status: 'Active' },
    ];


    const [formData, setFormData] = useState({
        learnerEmail: '',
        learnerPhone: '',
        credentialUid: '',
        courseName: '',
        grade: '',
        templateId: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const generateUid = async () => {
            try {
                const response = await credentialServices.generateUid();
                if (response.success) {
                    setFormData(prev => ({ ...prev, credentialUid: response.data.uid }));
                }
            } catch (error) {
                console.error("Failed to generate UID", error);
            }
        };
        if (issuanceType === 'single') {
            generateUid();
        }
    }, [issuanceType]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIssuance = async (e) => {
        e.preventDefault();
        if (issuanceType === 'bulk') {
            alert(`[Simulated] Starting ${issuanceType} issuance... Check console.`);
            console.log(`[Issuance] Starting issuance process: ${issuanceType}`);
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const payload = {
                learnerEmail: formData.learnerEmail,
                learnerPhone: formData.learnerPhone,
                credentialUid: formData.credentialUid,
                metadata: {
                    courseName: formData.courseName,
                    grade: formData.grade,
                    templateId: formData.templateId,
                    issuedAt: new Date().toISOString()
                }
            };

            const response = await credentialServices.issueCredential(payload);
            if (response.success) {
                setMessage('Credential issued successfully!');
                // Reset form or generate new UID
                const uidRes = await credentialServices.generateUid();
                setFormData({
                    learnerEmail: '',
                    learnerPhone: '',
                    credentialUid: uidRes.success ? uidRes.data.uid : '',
                    courseName: '',
                    grade: '',
                    templateId: ''
                });
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to issue credential.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-2xl font-semibold text-gray-800 text-center">Start Credential Issuance</h3>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIssuanceType('bulk')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'bulk' ? 'bg-blue-chill-600 text-white border-blue-chill-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Bulk Issuance (CSV/API)</button>
                <button onClick={() => setIssuanceType('single')} className={`px-6 py-3 font-semibold rounded-lg transition duration-200 border-2 ${issuanceType === 'single' ? 'bg-blue-chill-600 text-white border-blue-chill-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Single Issuance (Form)</button>
            </div>


            <form onSubmit={handleIssuance} className="p-8 border rounded-xl shadow-lg bg-gray-50 space-y-6">
                <div className="space-y-2">
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700">Select Template</label>
                    <select id="template" name="templateId" value={formData.templateId} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-chill-500 focus:border-blue-chill-500">
                        <option value="">-- Choose a Credential Template --</option>
                        {templates.filter(t => t?.status === 'Active').map(t => (
                            <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                        ))}
                    </select>
                </div>


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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {message && (
                            <div className={`col-span-2 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                            <input type="email" name="learnerEmail" value={formData.learnerEmail} onChange={handleChange} required className="w-full p-3 border rounded-lg" placeholder="john.doe@email.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Recipient Phone (Optional)</label>
                            <input type="tel" name="learnerPhone" value={formData.learnerPhone} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="+91..." />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Credential ID / Hash</label>
                            <input type="text" name="credentialUid" value={formData.credentialUid} readOnly className="w-full p-3 border rounded-lg bg-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Course Name</label>
                            <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} required className="w-full p-3 border rounded-lg" placeholder="e.g. React Mastery" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Grade/Score</label>
                            <input type="text" name="grade" value={formData.grade} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g. A+" />
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