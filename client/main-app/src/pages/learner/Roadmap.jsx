import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Map,
    Target,
    TrendingUp,
    Zap,
    BookOpen,
    CheckCircle,
    ArrowRight,
    Info,
    Loader2
} from 'lucide-react';
import api from '../../services/axiosInstance';

const Roadmap = () => {
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ai/recommendations');
            setRecommendations(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
            setError(err.response?.data?.message || 'Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-chill-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading your personalized roadmap...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-800 mb-4">{error}</p>
                        <button
                            onClick={fetchRecommendations}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentSkills = recommendations?.skills?.map(skill => ({
        name: skill,
        level: 70, // Default level, can be enhanced later
        nsqf: `L${recommendations.nsqf_level}`
    })) || [];

    const nextSteps = recommendations?.recommended_next_skills?.slice(0, 4) || [];
    const roleSuggestions = recommendations?.role_suggestions || [];
    const learningPath = recommendations?.learning_path || [];

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-10">

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-chill-100 text-blue-chill-700 rounded-xl">
                        <Map size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AI Skill Roadmap</h1>
                        <p className="text-gray-500">Your personalized path to career growth, powered by AI.</p>
                    </div>
                </div>

                {/* Current Standing */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Target className="text-blue-600" /> Current Proficiency
                        </h2>
                        {currentSkills.length > 0 ? (
                            <div className="space-y-6">
                                {currentSkills.map((skill) => (
                                    <div key={skill.name}>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-gray-700">{skill.name}</span>
                                            <span className="text-sm text-gray-500">{skill.nsqf} • {skill.level}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${skill.level}%` }}
                                                transition={{ duration: 1 }}
                                                className="h-full bg-blue-chill-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No skills detected yet. Upload certificates to build your profile.
                            </p>
                        )}

                        {recommendations?.confidence > 0 && (
                            <div className="mt-8 p-4 bg-blue-50 rounded-lg flex gap-3 items-start">
                                <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-blue-800">
                                    AI Confidence: <strong>{Math.round(recommendations.confidence * 100)}%</strong> based on your verified certificates.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-green-600" /> Career Trajectory
                        </h2>
                        {roleSuggestions.length > 0 ? (
                            <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                                {roleSuggestions.slice(0, 3).map((role, idx) => (
                                    <div key={idx} className={`relative ${idx > 0 ? 'opacity-50' : ''}`}>
                                        <div className={`absolute -left-[21px] top-1 h-4 w-4 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-300'
                                            } border-2 border-white shadow-sm`}></div>
                                        <h3 className="font-semibold text-gray-900">{role.role}</h3>
                                        <p className="text-xs text-gray-500">
                                            {idx === 0 ? 'Recommended' : `${role.percent_complete}% Match`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Upload certificates to see career suggestions</p>
                        )}
                    </div>
                </div>

                {/* AI Recommendations */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Recommended Next Steps
                    </h2>

                    {nextSteps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {nextSteps.map((rec, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <BookOpen size={100} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                                                Skill
                                            </span>
                                            <span className="text-green-400 text-sm font-bold">
                                                {rec.market_demand_percent}% Demand
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2">{rec.skill}</h3>
                                        <p className="text-gray-300 text-sm mb-6">{rec.description}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xs text-gray-400">Career: {rec.career_outcome}</span>
                                            <button className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                                                Start Learning <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-600 mb-4">
                                No recommendations available yet. Upload your certificates to get personalized skill recommendations!
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Roadmap;
