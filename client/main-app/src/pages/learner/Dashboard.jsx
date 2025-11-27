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
import { learnerApi } from '../../services/authServices';

const Dashboard = () => {
    const learner = useSelector(state => state.authLearner.learner);
    const [stats, setStats] = useState({
        totalCredentials: 0,
        profileCompletion: 85, // Mocked for now
        nsqfLevel: 4, // Mocked
        trustScore: 92 // Mocked
    });
    const [recentCertificates, setRecentCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dashboardRes = await learnerApi.getDashboard();
                const data = dashboardRes.data?.data || {};

                setRecentCertificates(data.recentCredentials || []);
                setStats({
                    totalCredentials: data.totalCredentials || 0,
                    profileCompletion: data.profileCompletion || 0,
                    nsqfLevel: data.nsqfLevel || 'N/A',
                    trustScore: data.trustScore || 0
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

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <div className="bg-green-100 p-1.5 rounded-full">
                            <Shield size={18} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Verified User</span>
                    </div>
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
                        icon={<TrendingUp className="text-purple-600" size={24} />}
                        label="NSQF Level"
                        value={`Level ${stats.nsqfLevel}`}
                        subtext="Advanced Proficiency"
                        color="bg-purple-50"
                    />
                    <StatCard
                        icon={<User className="text-orange-600" size={24} />}
                        label="Profile Completion"
                        value={`${stats.profileCompletion}%`}
                        color="bg-orange-50"
                    />
                    <StatCard
                        icon={<Zap className="text-yellow-600" size={24} />}
                        label="Trust Score"
                        value={stats.trustScore}
                        subtext="Excellent"
                        color="bg-yellow-50"
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

                    {/* AI Recommended Skills */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">AI Recommendations</h2>
                            <Link to="/roadmap" className="text-blue-chill-600 font-medium hover:underline text-sm">
                                View Roadmap
                            </Link>
                        </div>

                        <div className="bg-gradient-to-br from-blue-chill-900 to-blue-chill-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap size={100} />
                            </div>

                            <h3 className="font-semibold text-lg mb-1">Next Best Step</h3>
                            <p className="text-blue-100 text-sm mb-6">Based on your recent Python certification</p>

                            <div className="space-y-4 relative z-10">
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium bg-blue-500/30 px-2 py-1 rounded text-blue-100">
                                            Recommended
                                        </span>
                                        <span className="text-xs text-blue-200">High Demand</span>
                                    </div>
                                    <h4 className="font-bold text-lg">Data Structures & Algorithms</h4>
                                    <p className="text-xs text-blue-100 mt-1">Boost your employability by 40%</p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <h4 className="font-bold text-sm">Advanced React Patterns</h4>
                                    <p className="text-xs text-blue-100 mt-1">Complement your frontend skills</p>
                                </div>
                            </div>

                            <button className="w-full mt-6 bg-white text-blue-chill-800 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
                                Explore Learning Paths
                            </button>
                        </div>
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
