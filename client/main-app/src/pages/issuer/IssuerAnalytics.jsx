import React, { useEffect, useState } from 'react';
import { Users, FileCheck, CheckCircle, TrendingUp, Loader2, Calendar, Award } from 'lucide-react';
import { issuerServices } from '../../services/issuerServices';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#0F766E', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1'];

const MetricCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const IssuerAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await issuerServices.getDashboardStats();
            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;
    if (error) return <div className="p-6 bg-red-50 text-red-700 rounded-xl">{error}</div>;

    const summary = stats?.summary || {};
    const trends = stats?.trends || [];
    const topCerts = stats?.topCertificates || [];
    const statusDist = stats?.statusDistribution || [];
    const verificationTrends = stats?.verificationTrends || [];
    const learnerGrowth = stats?.learnerGrowth || [];

    return (
        <div className="space-y-8 pb-10 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
                    <p className="text-gray-500 mt-1">Track your credential performance and recipient engagement.</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Last 6 Months</span>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Credentials Issued" value={summary.totalIssued || 0} icon={Award} color="bg-teal-500 text-teal-600" />
                <MetricCard title="Active Recipients" value={summary.activeRecipients || 0} icon={Users} color="bg-blue-500 text-blue-600" />
                <MetricCard title="Total Verifications" value={summary.totalVerifications || 0} icon={FileCheck} color="bg-purple-500 text-purple-600" />
                <MetricCard title="Growth Trends" value={(trends.length > 1 ? '+' : '') + (trends.length > 0 ? trends[trends.length - 1].count : 0)} icon={TrendingUp} color="bg-green-500 text-green-600" />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Issuance Trends */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800">Issuance Trends</h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTrends" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#0F766E" strokeWidth={3} fillOpacity={1} fill="url(#colorTrends)" name="Issued" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">Credential Status</h3>
                    <div className="h-80 flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDist}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Credentials */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">Top Performing Credentials</h3>
                    <div className="h-72">
                        {topCerts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topCerts} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#4B5563', fontSize: 11 }} interval={0} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={24} name="Issued" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No credential data available</div>
                        )}
                    </div>
                </div>

                {/* Learner Growth (replaces top certs for better balance, or maybe top certs is better?)
                    User asked to remove engagement and add analytics. Learner growth is analytics. 
                    Let's use Learner Growth here instead of top certs if it has valid data, or keep Top Certs.
                    The previous design had Top Certs. I'll stick to Top Certs as it's often more populated.
                    Actually, let's show Learner Growth as an Area Chart to contrast.
                */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">Learner Growth</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={learnerGrowth}>
                                <defs>
                                    <linearGradient id="colorLearner" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorLearner)" name="New Learners" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssuerAnalytics;