import React, { useState, useEffect, useRef } from 'react';
import { XCircle, Trash, CheckCircle, Edit2 } from '../pages/issuer/icons';
import { NSQF_LEVELS, JOB_ROLES, SKILLS_LIST } from '../utils/nsqfData';

const NSQFVerificationModal = ({ isOpen, onClose, credentialData, onVerify, isProcessing, title = "Verify NSQF Alignment" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCustomRole, setIsCustomRole] = useState(false);

    const [editedData, setEditedData] = useState({
        job_role: '',
        qp_code: '',
        nsqf_level: '',
        reasoning: '',
        skills: [],
        confidence: 0
    });

    const [skillInput, setSkillInput] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const skillInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && credentialData) {
            const aiData = credentialData.metadata?.ai_extracted || credentialData.ai_extracted || {};
            const nsqfAlignment = aiData.nsqf_alignment || {};

            const initialJobRole = nsqfAlignment.job_role || '';
            const isKnownRole = JOB_ROLES.some(r => r.role === initialJobRole);

            setEditedData({
                job_role: initialJobRole,
                qp_code: nsqfAlignment.qp_code || '',
                nsqf_level: nsqfAlignment.nsqf_level || '',
                reasoning: nsqfAlignment.reasoning || '',
                skills: aiData.skills ? [...aiData.skills] : [],
                confidence: nsqfAlignment.confidence || 0
            });

            setIsCustomRole(!isKnownRole && initialJobRole !== '');
            setIsEditing(false); // Reset to read-only on open
        }
    }, [isOpen, credentialData]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (skillInputRef.current && !skillInputRef.current.contains(event.target)) {
                setShowSkillSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen || !credentialData) return null;

    const handleJobRoleChange = (e) => {
        const value = e.target.value;
        if (value === "Other") {
            setIsCustomRole(true);
            setEditedData({ ...editedData, job_role: '', qp_code: '' });
        } else {
            const selectedRole = JOB_ROLES.find(role => role.role === value);
            if (selectedRole) {
                setIsCustomRole(false);
                setEditedData({
                    ...editedData,
                    job_role: selectedRole.role,
                    qp_code: selectedRole.qp_code
                });
            }
        }
    };

    const handleCustomRoleInput = (e) => {
        setEditedData({ ...editedData, job_role: e.target.value, qp_code: '' });
    };

    const handleSkillAdd = (skillName) => {
        if (skillName && !editedData.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
            setEditedData({
                ...editedData,
                skills: [...editedData.skills, { name: skillName, confidence: 1.0 }]
            });
        }
        setSkillInput('');
        setShowSkillSuggestions(false);
    };

    const handleSkillRemove = (index) => {
        const newSkills = [...editedData.skills];
        newSkills.splice(index, 1);
        setEditedData({ ...editedData, skills: newSkills });
    };

    const handleVerify = (status) => {
        onVerify(status, editedData);
    };

    const filteredSkills = SKILLS_LIST.filter(skill =>
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !editedData.skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Column */}
                        <div className="space-y-8">
                            {/* Certificate Details */}
                            <div>
                                <h4 className="text-gray-700 font-bold border-b-2 border-gray-100 pb-2 mb-4">Certificate Details</h4>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-3">
                                    <div>
                                        <span className="text-gray-500 text-sm font-medium">Title: </span>
                                        <span className="text-gray-900 font-medium ml-1">{credentialData.certificate_title}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-sm font-medium">Recipient: </span>
                                        <span className="text-gray-900 ml-1">{credentialData.learner_email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2 mb-4">
                                    <h4 className="text-gray-700 font-bold">AI Extracted Skills</h4>
                                    {isEditing && <span className="text-xs text-blue-600 font-medium animate-pulse">Editing Mode</span>}
                                </div>

                                <div className="space-y-3">
                                    {isEditing && (
                                        <div className="relative" ref={skillInputRef}>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add a skill..."
                                                    className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    value={skillInput}
                                                    onChange={(e) => {
                                                        setSkillInput(e.target.value);
                                                        setShowSkillSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSkillSuggestions(true)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSkillAdd(skillInput)}
                                                />
                                                <button
                                                    onClick={() => handleSkillAdd(skillInput)}
                                                    disabled={!skillInput.trim()}
                                                    className="px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {showSkillSuggestions && skillInput && filteredSkills.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredSkills.map(skill => (
                                                        <div
                                                            key={skill}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                                                            onClick={() => handleSkillAdd(skill)}
                                                        >
                                                            {skill}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {editedData.skills.length > 0 ? (
                                            editedData.skills.map((skill, idx) => (
                                                <span key={idx} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isEditing ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-blue-50 text-blue-600'}`}>
                                                    {skill.name}
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => handleSkillRemove(idx)}
                                                            className="ml-2 text-blue-400 hover:text-red-500 focus:outline-none"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No skills found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: NSQF Alignment */}
                        <div>
                            <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2 mb-4">
                                <h4 className="text-gray-700 font-bold">Proposed NSQF Alignment</h4>
                                {isEditing && <span className="text-xs text-blue-600 font-medium animate-pulse">Editing Mode</span>}
                            </div>

                            <div className={`rounded-xl p-6 transition-all ${isEditing ? 'bg-white border-2 border-blue-100 shadow-sm' : 'bg-teal-50/50 border border-teal-100'}`}>
                                <div className="space-y-5">
                                    {/* Header: Job Role & Level */}
                                    <div>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-grow space-y-1">
                                                <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider">Job Role / QP</label>
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <select
                                                            value={isCustomRole ? "Other" : editedData.job_role}
                                                            onChange={handleJobRoleChange}
                                                            className="w-full p-2 border border-teal-200 rounded-md text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white font-medium text-gray-900"
                                                        >
                                                            <option value="">Select Job Role...</option>
                                                            {JOB_ROLES.map(role => (
                                                                <option key={role.role} value={role.role}>{role.role}</option>
                                                            ))}
                                                            <option value="Other">Other (Custom)</option>
                                                        </select>
                                                        {isCustomRole && (
                                                            <input
                                                                type="text"
                                                                value={editedData.job_role}
                                                                onChange={handleCustomRoleInput}
                                                                placeholder="Enter custom job role"
                                                                className="w-full p-2 border border-teal-200 rounded-md text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900 leading-tight">
                                                            {editedData.job_role || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium mt-1">
                                                            QP Code: {editedData.qp_code || 'N/A'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Level Badge / Input */}
                                            <div className="flex-shrink-0 min-w-[100px]">
                                                <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider mb-1 text-right">Level</label>
                                                {isEditing ? (
                                                    <select
                                                        value={editedData.nsqf_level}
                                                        onChange={(e) => setEditedData({ ...editedData, nsqf_level: e.target.value })}
                                                        className="w-full p-2 border border-teal-200 rounded-md text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white font-medium text-center"
                                                    >
                                                        <option value="">Select</option>
                                                        {NSQF_LEVELS.map(level => (
                                                            <option key={level} value={level}>Level {level}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-teal-100 text-teal-800 text-sm font-bold border border-teal-200 shadow-sm">
                                                            Level {editedData.nsqf_level || '?'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className={`h-px w-full ${isEditing ? 'bg-gray-200' : 'bg-teal-200/50'}`}></div>

                                    {/* Reasoning Section */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider">AI Reasoning</label>

                                        {isEditing ? (
                                            <textarea
                                                value={editedData.reasoning}
                                                onChange={(e) => setEditedData({ ...editedData, reasoning: e.target.value })}
                                                rows={3}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                                placeholder="Enter reasoning..."
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 italic leading-relaxed">
                                                "{editedData.reasoning || 'No reasoning provided.'}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Confidence Bar */}
                                    <div className="flex items-center space-x-3 pt-2">
                                        <div className="h-2 flex-grow bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${(editedData.confidence || 0) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                                            {Math.round((editedData.confidence || 0) * 100)}% Match
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-gray-50 flex justify-end items-center gap-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => handleVerify('rejected')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reject Mapping
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Details
                            </button>
                            <button
                                onClick={() => handleVerify('approved')}
                                disabled={isProcessing || !editedData.job_role || !editedData.nsqf_level}
                                className="px-6 py-2 bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700 transition-colors shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Approve & Verify'
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel Edit
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={isProcessing || !editedData.job_role || !editedData.nsqf_level}
                                className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors shadow-md text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Done Editing
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NSQFVerificationModal;
