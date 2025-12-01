import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Award,
    CheckCircle,
    TrendingUp,
    User,
    ArrowRight,
    Shield,
    Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { learnerApi } from '../../services/authServices';

const Dashboard = () => {
    const learner = useSelector(state => state.authLearner.learner);
    const [stats, setStats] = useState({
        totalCredentials: 0,
        nsqfAlignedCount: 0,
        totalSkillsVerified: 0,
        topSkill: 'None'
    });
    const [recentCertificates, setRecentCertificates] = useState([]);
    const [topSkills, setTopSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dashboardRes = await learnerApi.getDashboard();
                const data = dashboardRes.data?.data || {};

                setRecentCertificates(data.recentCredentials || []);
                setTopSkills(data.topSkills || []);
                setStats({
                    totalCredentials: data.totalCredentials || 0,
                    nsqfAlignedCount: data.nsqfAlignedCount || 0,
                    totalSkillsVerified: data.totalSkillsVerified || 0,
                    topSkill: data.topSkills?.[0]?.skill || 'None'
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-chill-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {learner?.name || 'Learner'}! 👋
                        </h1>
                        <p className="text-gray-500 mt-1">Here's what's happening with your credentials today.</p>
                    </div>

                    {learner?.status === 'active' && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <div className="bg-green-100 p-1.5 rounded-full">
                                <Shield size={18} className="text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Verified User</span>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Award className="text-blue-600" size={24} />}
                        label="Verified Credentials"
                        value={stats.totalCredentials}
                        color="bg-blue-50"
                    />
                    <StatCard
                        icon={<Shield className="text-purple-600" size={24} />}
                        label="NSQF Aligned"
                        value={stats.nsqfAlignedCount}
                        subtext="Certificates"
                        color="bg-purple-50"
                    />
                    <StatCard
                        icon={<Zap className="text-orange-600" size={24} />}
                        label="Skills Verified"
                        value={stats.totalSkillsVerified}
                        color="bg-orange-50"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-green-600" size={24} />}
                        label="Top Skill"
                        value={stats.topSkill}
                        subtext="Most Verified"
                        color="bg-green-50"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Certificates */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Latest Certificates</h2>
                            <Link to="/wallet" className="text-blue-chill-600 font-medium hover:underline flex items-center gap-1">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentCertificates.length > 0 ? (
                                recentCertificates.map((cert) => (
                                    <motion.div
                                        key={cert.id}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-blue-chill-50 rounded-lg flex items-center justify-center text-blue-chill-600 font-bold text-xl">
                                                {cert.certificate_title?.[0] || 'C'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{cert.certificate_title}</h3>
                                                <p className="text-sm text-gray-500">Issued by {cert.issuer?.name || 'Unknown Issuer'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                                Verified
                                            </span>
                                            <Link
                                                to={`/credential/${cert.id}`}
                                                className="p-2 text-gray-400 hover:text-blue-chill-600 transition-colors"
                                            >
                                                <ArrowRight size={20} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                                    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <Award className="text-gray-400" size={24} />
                                    </div>
                                    <h3 className="text-gray-900 font-medium">No certificates yet</h3>
                                    <p className="text-gray-500 text-sm mt-1">Your earned credentials will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Skills */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Top Skills</h2>
                                <p className="text-sm text-gray-500 mt-1">Skills verified by your credentials</p>
                            </div>
                            <Link to="/wallet" className="text-blue-chill-600 font-medium hover:underline text-sm flex items-center gap-1">
                                View Details <ArrowRight size={16} />
                            </Link>
                        </div>

                        {topSkills.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {topSkills.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-chill-200 hover:bg-blue-chill-50/30 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-blue-chill-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-200">
                                                <Zap size={20} fill="currentColor" className="text-blue-chill-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-chill-700 transition-colors">
                                                    {item.skill}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-chill-500 rounded-full"
                                                            style={{ width: `${Math.min((item.count / 5) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {item.count} {item.count === 1 ? 'Credential' : 'Credentials'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <div className="p-1.5 rounded-full bg-white text-blue-chill-600 shadow-sm">
                                                <CheckCircle size={16} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <Zap className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                <h3 className="text-gray-900 font-medium">No skills analyzed yet</h3>
                                <p className="text-gray-500 text-sm mt-1 px-4">
                                    Earn credentials to see your top skills visualized here.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            {subtext && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {subtext}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
    </div>
);

export default Dashboard;
