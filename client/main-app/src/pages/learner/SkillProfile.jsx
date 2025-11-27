import React from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    BarChart2,
    Layers,
    Briefcase,
    Code,
    Users
} from 'lucide-react';

const SkillProfile = () => {
    // Mock Data
    const categories = [
        { name: 'Technical Skills', score: 85, icon: <Code size={20} />, color: 'bg-blue-500' },
        { name: 'Soft Skills', score: 70, icon: <Users size={20} />, color: 'bg-green-500' },
        { name: 'Domain Knowledge', score: 60, icon: <Briefcase size={20} />, color: 'bg-purple-500' }
    ];

    const skills = [
        { name: 'Python', category: 'Technical', score: 90 },
        { name: 'Communication', category: 'Soft Skills', score: 85 },
        { name: 'Data Analysis', category: 'Technical', score: 75 },
        { name: 'Project Management', category: 'Domain', score: 65 },
        { name: 'SQL', category: 'Technical', score: 60 }
    ];

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
                        <div className="space-y-5">
                            {skills.map((skill) => (
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
                    </div>

                    {/* NSQF Distribution (Mocked Visual) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PieChart className="text-gray-500" /> NSQF Distribution
                        </h2>

                        <div className="flex items-center justify-center py-8">
                            {/* Simple CSS Donut Chart Representation */}
                            <div className="relative w-48 h-48 rounded-full border-[16px] border-blue-100 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[16px] border-blue-600 border-t-transparent border-l-transparent rotate-45"></div>
                                <div className="text-center">
                                    <span className="block text-3xl font-bold text-gray-900">L4</span>
                                    <span className="text-xs text-gray-500">Dominant Level</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span className="text-sm text-gray-600">Level 4 (60%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                                <span className="text-sm text-gray-600">Level 3 (40%)</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SkillProfile;
