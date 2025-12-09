import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map,
    Target,
    TrendingUp,
    Zap,
    ArrowRight,
    Briefcase,
    GitBranch,
    CheckCircle,
    Loader2,
    Flag,
    Milestone,
    Star,
    ChevronDown,
    Award,
    Clock,
    RefreshCw
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

const Roadmap = () => {
    const [loading, setLoading] = useState(true);
    const [roadmapData, setRoadmapData] = useState(null);
    const [error, setError] = useState(null);
    const [expandedGoal, setExpandedGoal] = useState(null);

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const fetchRoadmap = async () => {
        try {
            setLoading(true);
            const response = await learnerApi.getRoadmap();
            setRoadmapData(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch roadmap:', err);
            // Only set error if it's not a 404 (which means no data)
            if (err.response && err.response.status !== 404) {
                setError('Failed to load your personalized roadmap. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-chill-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600 font-medium">Charting your course...</p>
                </div>
            </div>
        );
    }

    if (error || !roadmapData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900">No roadmap available</h3>
                        <p className="text-gray-500 mt-1 mb-4">Earn your first credential to unlock your career path.</p>
                        <button
                            onClick={fetchRoadmap}
                            className="text-blue-chill-600 font-medium hover:underline text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { current_status, future_plans, conditional_paths, job_opportunities, stackable_pathways } = roadmapData;

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header & Current Status Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-gray-200 border border-gray-100"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-chill-50 text-blue-chill-600 rounded-lg">
                                <Target size={24} />
                            </div>
                            <span className="font-bold tracking-wide uppercase text-sm text-blue-chill-600">Current Standing</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            You are currently positioned as <br />
                            <span className="text-blue-chill-600">an Emerging Professional</span>
                        </h1>
                        <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                            {current_status}
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column: Timeline (Future Plans) */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-chill-100 text-blue-chill-700 rounded-lg">
                                <Milestone size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">The Journey Ahead</h2>
                        </div>

                        <div className="relative pl-4 ml-4 border-l-2 border-blue-chill-100 space-y-8 py-2">
                            {future_plans && future_plans.map((plan, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="relative pl-8"
                                >
                                    {/* Timeline Node */}
                                    <div
                                        className={`absolute -left-[25px] top-0 h-6 w-6 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-colors ${expandedGoal === idx ? 'bg-blue-chill-600 scale-110' : 'bg-blue-chill-200'
                                            }`}
                                    >
                                        {expandedGoal === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>

                                    {/* Content Card */}
                                    <div
                                        className={`bg-white rounded-xl p-5 shadow-sm border transition-all cursor-pointer group ${expandedGoal === idx ? 'border-blue-chill-500 shadow-md ring-1 ring-blue-chill-100' : 'border-gray-100 hover:border-blue-chill-200'
                                            }`}
                                        onClick={() => setExpandedGoal(expandedGoal === idx ? null : idx)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-bold text-lg transition-colors ${expandedGoal === idx ? 'text-blue-chill-700' : 'text-gray-900'}`}>
                                                    {plan.goal}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
                                                    <Clock size={12} />
                                                    <span className="uppercase tracking-wide">{plan.timeline}</span>
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedGoal === idx ? 180 : 0 }}
                                                className="text-gray-400 group-hover:text-blue-chill-500"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedGoal === idx && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="text-gray-600 mt-4 pt-4 border-t border-gray-100 leading-relaxed mb-4">
                                                        {plan.description}
                                                    </p>

                                                    {/* Skills to Acquire Section */}
                                                    {plan.skills_to_acquire && (
                                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                                <Zap size={14} className="text-yellow-500" /> Skills to Master
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {['basic', 'intermediate', 'advanced'].map((level) => (
                                                                    plan.skills_to_acquire[level] && plan.skills_to_acquire[level].length > 0 && (
                                                                        <div key={level}>
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{level}</p>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {plan.skills_to_acquire[level].map((skill, sIdx) => (
                                                                                    <span key={sIdx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-700">
                                                                                        {skill}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Conditional Paths */}
                    <div className="space-y-8">
                        {conditional_paths && conditional_paths.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                                        <GitBranch size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Strategic Pivots</h2>
                                </div>
                                <div className="space-y-4">
                                    {conditional_paths.map((path, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.02 }}
                                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-1.5 transition-all"></div>
                                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                {path.path_name}
                                                <Zap size={14} className="text-purple-500 fill-purple-500" />
                                            </h3>
                                            <div className="text-sm text-gray-600 mb-3 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                                <span className="font-semibold text-purple-700">If:</span> {path.condition}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <ArrowRight size={14} className="text-gray-400" />
                                                <span>{path.outcome}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stackable Pathways (New Section) */}
                {stackable_pathways && stackable_pathways.length > 0 && (
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Stackable Pathways</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stackable_pathways.map((path, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -4 }}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp size={100} />
                                    </div>

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 mb-1">{path.pathway_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock size={14} />
                                                <span>{path.estimated_duration}</span>
                                            </div>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                            {path.progress_percentage}% Complete
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-4 text-sm relative z-10">{path.description}</p>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 relative z-10">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${path.progress_percentage}%` }}
                                        ></div>
                                    </div>

                                    {/* Skills Breakdown */}
                                    {path.required_skills && (
                                        <div className="space-y-2 relative z-10">
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Required Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {path.required_skills.map((skill, sIdx) => (
                                                    <div 
                                                        key={sIdx} 
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                                                            skill.status === 'completed' 
                                                            ? 'bg-green-50 border-green-100 text-green-700' 
                                                            : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                    >
                                                        {skill.status === 'completed' && <CheckCircle size={10} />}
                                                        {skill.skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100 relative z-10 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Next Step:</span>
                                        <span className="text-sm font-bold text-indigo-600">{path.next_credential}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Future Opportunities (Full Width Bottom) */}
                {job_opportunities && job_opportunities.length > 0 && (
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                                <Briefcase size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Future Opportunities</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {job_opportunities.map((job, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group transition-all flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-chill-50 transition-colors">
                                            <Briefcase size={20} className="text-gray-400 group-hover:text-blue-chill-600" />
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${job.match_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {job.match_percentage}% Match
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-chill-600 transition-colors">{job.role}</h4>
                                    <p className="text-sm text-gray-500 font-medium mb-4">{job.salary_range}</p>

                                    {job.missing_skills && job.missing_skills.length > 0 && (
                                        <div className="mb-6 flex-grow">
                                            <p className="text-xs text-gray-400 mb-2 font-medium">Skills to Acquire:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(job.missing_skills || []).slice(0, 4).map((skill, sIdx) => (
                                                    <span key={sIdx} className="text-[10px] uppercase tracking-wider font-semibold bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {(job.missing_skills || []).length > 4 && (
                                                    <span className="text-[10px] text-gray-400 px-1 py-1">+{job.missing_skills.length - 4}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roadmap;
