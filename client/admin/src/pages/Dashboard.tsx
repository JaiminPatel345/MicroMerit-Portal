import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { fetchIssuers } from '../store/issuerSlice.ts';
import { fetchSyncStatus } from '../store/externalSyncSlice.ts';

const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { issuers, loading } = useAppSelector((state) => state.issuer);
    const { viewMode } = useAppSelector((state) => state.externalSync);

    useEffect(() => {
        dispatch(fetchIssuers());
        dispatch(fetchSyncStatus());
    }, [dispatch]);

    const stats = {
        total: issuers.length,
        pending: issuers.filter((i) => i.status === 'pending').length,
        approved: issuers.filter((i) => i.status === 'approved' && !i.is_blocked).length,
        rejected: issuers.filter((i) => i.status === 'rejected').length,
        blocked: issuers.filter((i) => i.is_blocked).length,
    };

    const statCards = [
        {
            title: 'Total Issuers',
            value: stats.total,
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            color: 'from-blue-500 to-blue-600',
            link: '/issuers',
        },
        {
            title: 'Pending Approvals',
            value: stats.pending,
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'from-yellow-500 to-orange-500',
            link: '/issuers?status=pending',
        },
        {
            title: 'Approved Issuers',
            value: stats.approved,
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'from-green-500 to-emerald-600',
            link: '/issuers?status=approved',
        },
        {
            title: 'Blocked Issuers',
            value: stats.blocked,
            icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
            color: 'from-red-500 to-rose-600',
            link: '/issuers?blocked=true',
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
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">Mode:</span>
                    <span className={`px-2 py-1 rounded-md font-medium ${viewMode === 'connector' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                        {viewMode === 'connector' ? 'Connectors' : 'Platform'}
                    </span>
                </div>
            </div>



            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link key={index} to={stat.link}>
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
                    </Link>
                ))}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Connectors</span>
                    </Link>
                </div>
            </div>

            {/* Recent Issuers Table */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Issuers</h2>
                    <Link to="/issuers" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View all →
                    </Link>
                </div>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : issuers.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No issuers found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issuer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {issuers.slice(0, 5).map((issuer) => (
                                    <tr key={issuer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                                                    {issuer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{issuer.name}</p>
                                                    <p className="text-xs text-gray-500">{issuer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded capitalize">
                                                {issuer.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${issuer.is_blocked
                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                    : issuer.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        : issuer.status === 'approved'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                {issuer.is_blocked ? 'Blocked' : issuer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(issuer.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div> */}
        </div>
    );
};

export default Dashboard;
