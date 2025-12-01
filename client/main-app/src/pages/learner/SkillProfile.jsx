import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    BarChart2,
    Layers,
    Briefcase,
    Code,
    Users,
    Loader2,
    CheckCircle,
    Award,
    RefreshCw,
    TrendingUp,
    AlertCircle,
    Zap,
    Target,
    Star,
    BookOpen
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

const SkillProfile = () => {
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await learnerApi.getSkillProfile();
            setProfileData(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch skill profile:', err);
            // Only set error if it's not a 404
            if (err.response && err.response.status !== 404) {
                setError('Failed to load your skill profile. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Analyzing your skills...</p>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900">No skill profile available</h3>
                        <p className="text-gray-500 mt-1 mb-4">Earn and verify credentials to visualize your proficiency.</p>
                        <button
                            onClick={fetchData}
                            className="text-purple-600 font-medium hover:underline text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const {
        current_skills,
        ready_to_apply_jobs,
        field_analysis
    } = profileData;

    // Normalize current_skills (handle legacy format)
    const normalizedSkills = (current_skills || []).map(skill => {
        let proficiency = skill.proficiency;
        // Handle string proficiency
        if (typeof proficiency === 'string') {
            const lower = proficiency.toLowerCase();
            if (lower.includes('begin')) proficiency = 30;
            else if (lower.includes('inter')) proficiency = 60;
            else if (lower.includes('advan')) proficiency = 90;
            else proficiency = 50; // Default
        }

        return {
            ...skill,
            skill: skill.skill || skill.name || 'Unknown Skill', // Handle key mismatch
            proficiency: Number(proficiency) || 0
        };
    });

    // Filter skills by category
    const softSkillKeywords = ['communication', 'leadership', 'team', 'management', 'problem solving', 'critical thinking', 'collaboration', 'adaptability', 'creativity', 'emotional intelligence', 'interpersonal'];

    const softSkills = normalizedSkills.filter(s =>
        s.category?.toLowerCase() === 'soft' ||
        softSkillKeywords.some(k => s.skill.toLowerCase().includes(k))
    );

    const technicalSkills = normalizedSkills.filter(s => !softSkills.includes(s));

    // Calculate average scores
    const calculateAverage = (skills) =>
        skills.length > 0
            ? Math.round(skills.reduce((acc, skill) => acc + skill.proficiency, 0) / skills.length)
            : 0;

    const technicalScore = calculateAverage(technicalSkills);
    const softScore = calculateAverage(softSkills);

    const categories = [
        { name: 'Technical Proficiency', score: technicalScore, icon: <Code size={20} />, color: 'bg-blue-500' },
        { name: 'Soft Skills', score: softScore, icon: <Users size={20} />, color: 'bg-purple-500' },
        { name: 'Verified Skills', score: normalizedSkills.length, icon: <CheckCircle size={20} />, color: 'bg-green-500', isCount: true }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                            <Layers size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Skill Profile</h1>
                            <p className="text-gray-500">A comprehensive view of your verified capabilities.</p>
                        </div>
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
                                <span className="text-2xl font-bold text-gray-900">
                                    {cat.score}{cat.isCount ? '' : '%'}
                                </span>
                            </div>
                            <h3 className="font-semibold text-gray-700">{cat.name}</h3>
                            {!cat.isCount && (
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className={`h-full ${cat.color}`} style={{ width: `${cat.score}%` }}></div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Field-Specific Growth (Gap Analysis) */}
                {field_analysis && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Target size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Field-Specific Growth</h2>
                                <p className="text-sm text-gray-500">Current Field: <span className="font-semibold text-blue-600">{field_analysis.current_field}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {field_analysis.achievable_roles && field_analysis.achievable_roles.map((role, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 transition-colors">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{role.role}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{role.gap_description}</p>

                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Missing Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {role.missing_skills.map((skill, sIdx) => (
                                                <span key={sIdx} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-md border border-red-100 font-medium flex items-center gap-1">
                                                    <AlertCircle size={12} /> {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                        <TrendingUp size={14} /> Est. Time: {role.estimated_time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Detailed Proficiency */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Detailed Skill List */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <BarChart2 className="text-gray-500" /> Detailed Proficiency
                            </h2>
                            {normalizedSkills && normalizedSkills.length > 0 ? (
                                <div className="space-y-5">
                                    {normalizedSkills.map((skill, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-gray-700">{skill.skill}</span>
                                                <span className="text-sm text-gray-500">{skill.proficiency}/100</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${skill.proficiency}%` }}
                                                    transition={{ duration: 0.8 }}
                                                    className={`h-full rounded-full ${skill.proficiency > 80 ? 'bg-green-500' :
                                                        skill.proficiency > 60 ? 'bg-blue-500' : 'bg-yellow-500'
                                                        }`}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Verified by: {skill.verified_by || 'MicroMerit'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No skills data available. Upload certificates to build your profile.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Jobs */}
                    <div className="space-y-8">
                        {/* Ready to Apply Jobs (Compact) */}
                        {ready_to_apply_jobs && ready_to_apply_jobs.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Briefcase className="text-blue-600" /> Job Matches
                                </h2>
                                <div className="space-y-4">
                                    {ready_to_apply_jobs.slice(0, 3).map((job, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 text-sm">{job.role}</h3>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    {job.match_percentage}%
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-xs mb-3">{job.salary_range}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(job.matching_skills || []).slice(0, 2).map((skill, sIdx) => (
                                                    <span key={sIdx} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SkillProfile;
