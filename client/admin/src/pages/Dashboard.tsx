import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

interface PlatformStats {
    totalIssuers: number;
    totalEmployers: number;
    totalLearners: number;
    totalCredentials: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/admin/analytics')
            .then((res) => {
                const overview = res.data?.data?.overview;
                setStats({
                    totalIssuers: overview?.totalIssuers ?? 0,
                    totalEmployers: overview?.totalEmployers ?? 0,
                    totalLearners: overview?.totalLearners ?? 0,
                    totalCredentials: overview?.totalCredentials ?? 0,
                });
            })
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    const statCards = [
        {
            title: 'Total Issuers',
            value: stats?.totalIssuers ?? 0,
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
            color: 'from-blue-500 to-blue-600',
            link: '/issuers',
        },
        {
            title: 'Total Employers',
            value: stats?.totalEmployers ?? 0,
            icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            color: 'from-purple-500 to-purple-600',
            link: '/employers',
        },
        {
            title: 'Total Learners',
            value: stats?.totalLearners ?? 0,
            icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
            color: 'from-green-500 to-emerald-600',
            link: null,
        },
        {
            title: 'Total Credentials',
            value: stats?.totalCredentials ?? 0,
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            color: 'from-orange-500 to-amber-500',
            link: '/credentials',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-gray-500">Overview of platform management</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const card = (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">
                                        {loading ? '...' : stat.value}
                                    </p>
                                </div>
                                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    );

                    return stat.link ? (
                        <Link key={index} to={stat.link}>{card}</Link>
                    ) : (
                        <div key={index}>{card}</div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/issuers?status=pending" className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50 transition-all group">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Review Issuers</span>
                    </Link>
                    <Link to="/employers?status=pending" className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Review Employers</span>
                    </Link>
                    <Link to="/credentials" className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all group">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">View Credentials</span>
                    </Link>
                    <Link to="/issuers" className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Issuers</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
