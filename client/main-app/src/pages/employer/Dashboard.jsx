import React, { useEffect, useState } from 'react';
import { employerApi } from '../../services/authServices';
import {
    Users,
    FileCheck,
    Search,
    TrendingUp,
    Clock,
    CheckCircle,
    MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const EmployerDashboard = () => {
    const [stats, setStats] = useState({ totalVerifications: 0, verificationsToday: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await employerApi.getDashboardStats();
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
                    <p className="text-gray-500">Welcome back, manage your verifications and searches.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/employer/verify" className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 transition-colors flex items-center gap-2 font-medium">
                        <FileCheck size={18} /> Verify Credential
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Verifications"
                    value={loading ? "..." : stats.totalVerifications}
                    icon={CheckCircle}
                    color="bg-blue-chill-500"
                    subtext="Lifetime verifications"
                />
                <StatCard
                    title="Verified Today"
                    value={loading ? "..." : stats.verificationsToday}
                    icon={Clock}
                    color="bg-green-500"
                    subtext="Activity in last 24h"
                />
                {/* Placeholders for future stats */}
                <StatCard
                    title="Candidate Searches"
                    value="-"
                    icon={Search}
                    color="bg-purple-500"
                    subtext="Coming Soon"
                />
                <StatCard
                    title="Shortlisted"
                    value="-"
                    icon={Users}
                    color="bg-orange-500"
                    subtext="Coming Soon"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link to="/employer/verify" className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <FileCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Verify a Credential</h4>
                                    <p className="text-sm text-gray-500">Check authenticity of a certificate instantly</p>
                                </div>
                            </div>
                        </Link>
                        <Link to="/employer/search" className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                    <Search size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Search Candidates</h4>
                                    <p className="text-sm text-gray-500">Find talent based on skills and NSQF levels</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <MessageCircle size={20} /> AI Assistant Available
                    </h3>
                    <p className="text-purple-100 text-sm mb-6">
                        When viewing a learner's profile, use our AI chatbot to instantly query their credentials, skills, and qualifications. Ask natural language questions and get AI-powered insights!
                    </p>
                    <Link to="/employer/search" className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium inline-block">
                        Find Candidates
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
