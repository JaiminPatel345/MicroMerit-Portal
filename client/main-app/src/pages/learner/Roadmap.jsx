import React from 'react';
import { motion } from 'framer-motion';
import {
    Map,
    Target,
    TrendingUp,
    Zap,
    BookOpen,
    CheckCircle,
    ArrowRight,
    Info
} from 'lucide-react';

const Roadmap = () => {
    // Mock Data
    const currentSkills = [
        { name: 'Python', level: 75, nsqf: 'L4' },
        { name: 'Data Analysis', level: 60, nsqf: 'L4' },
        { name: 'SQL', level: 40, nsqf: 'L3' }
    ];

    const recommendations = [
        {
            id: 1,
            title: 'Advanced Data Structures',
            type: 'Skill',
            reason: 'High demand in your sector (IT/Software). Completing this increases employability by 25%.',
            match: 95,
            difficulty: 'Hard'
        },
        {
            id: 2,
            title: 'Cloud Computing Basics',
            type: 'Micro-Credential',
            reason: 'Complementary skill to your Python expertise.',
            match: 88,
            difficulty: 'Medium'
        }
    ];

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

                        <div className="mt-8 p-4 bg-blue-50 rounded-lg flex gap-3 items-start">
                            <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-blue-800">
                                You are performing <strong>15% better</strong> than the national average for NSQF Level 4 candidates in your sector.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-green-600" /> Career Trajectory
                        </h2>
                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                                <h3 className="font-semibold text-gray-900">Junior Developer</h3>
                                <p className="text-xs text-gray-500">Current Role</p>
                            </div>
                            <div className="relative opacity-50">
                                <div className="absolute -left-[21px] top-1 h-4 w-4 rounded-full bg-gray-300 border-2 border-white"></div>
                                <h3 className="font-semibold text-gray-900">Software Engineer</h3>
                                <p className="text-xs text-gray-500">Target (1-2 years)</p>
                            </div>
                            <div className="relative opacity-30">
                                <div className="absolute -left-[21px] top-1 h-4 w-4 rounded-full bg-gray-300 border-2 border-white"></div>
                                <h3 className="font-semibold text-gray-900">Senior Engineer</h3>
                                <p className="text-xs text-gray-500">Long term</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Recommended Next Steps
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recommendations.map((rec) => (
                            <motion.div
                                key={rec.id}
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <BookOpen size={100} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                                            {rec.type}
                                        </span>
                                        <span className="text-green-400 text-sm font-bold">{rec.match}% Match</span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{rec.title}</h3>
                                    <p className="text-gray-300 text-sm mb-6">{rec.reason}</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs text-gray-400">Difficulty: {rec.difficulty}</span>
                                        <button className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                                            Start Learning <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Roadmap;
