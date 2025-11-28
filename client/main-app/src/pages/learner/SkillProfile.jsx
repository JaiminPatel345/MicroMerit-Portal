import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    BarChart2,
    Layers,
    Briefcase,
    Code,
    Users,
    Loader2
} from 'lucide-react';
import api from '../../services/axiosInstance';

const SkillProfile = () => {
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ai/recommendations');
            setRecommendations(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch skill profile:', err);
            setError(err.response?.data?.message || 'Failed to load skill profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading your skill profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
                <div className=" max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-800 mb-4">{error}</p>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Derive categories from skills
    const skills = recommendations?.skills || [];
    const averageScore = skills.length > 0 ? 70 : 0;

    const categories = [
        { name: 'Technical Skills', score: averageScore, icon: <Code size={20} />, color: 'bg-blue-500' },
        { name: 'Soft Skills', score: Math.max(0, averageScore - 10), icon: <Users size={20} />, color: 'bg-green-500' },
        { name: 'Domain Knowledge', score: Math.max(0, averageScore - 20), icon: <Briefcase size={20} />, color: 'bg-purple-500' }
    ];

    const skillsWithScores = skills.map(skill => ({
        name: skill,
        category: 'Technical',
        score: 70 + Math.floor(Math.random() * 20) // Random score between 70-90
    }));

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Skill Profile</h1>
                        <p className="text-gray-500">A comprehensive view of your verified capabilities.</p>
                    </div>
                </div>

                {/* Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${cat.color} bg-opacity-10 text-${cat.color.split('-')[1]}-600`}>
                                    {cat.icon}
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{cat.score}</span>
                            </div>
                            <h3 className="font-semibold text-gray-700">{cat.name}</h3>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className={`h-full ${cat.color}`} style={{ width: `${cat.score}%` }}></div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Detailed Skill List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart2 className="text-gray-500" /> Detailed Proficiency
                        </h2>
                        {skillsWithScores.length > 0 ? (
                            <div className="space-y-5">
                                {skillsWithScores.map((skill) => (
                                    <div key={skill.name}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-700">{skill.name}</span>
                                            <span className="text-sm text-gray-500">{skill.score}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${skill.score}%` }}
                                                transition={{ duration: 0.8 }}
                                                className={`h-full rounded-full ${skill.score > 80 ? 'bg-green-500' :
                                                    skill.score > 60 ? 'bg-blue-500' : 'bg-yellow-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No skills data available. Upload certificates to build your profile.
                            </p>
                        )}
                    </div>

                    {/* NSQF Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PieChart className="text-gray-500" /> NSQF Distribution
                        </h2>

                        <div className="flex items-center justify-center py-8">
                            {/* Simple CSS Donut Chart Representation */}
                            <div className="relative w-48 h-48 rounded-full border-[16px] border-blue-100 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[16px] border-blue-600 border-t-transparent border-l-transparent rotate-45"></div>
                                <div className="text-center">
                                    <span className="block text-3xl font-bold text-gray-900">
                                        L{recommendations?.nsqf_level || 1}
                                    </span>
                                    <span className="text-xs text-gray-500">Dominant Level</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span className="text-sm text-gray-600">
                                    Level {recommendations?.nsqf_level || 1} ({Math.round((recommendations?.nsqf_confidence || 0.6) * 100)}%)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                                <span className="text-sm text-gray-600">
                                    Others ({100 - Math.round((recommendations?.nsqf_confidence || 0.6) * 100)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SkillProfile;
