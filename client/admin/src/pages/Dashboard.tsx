import { useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { fetchIssuers } from '../store/issuerSlice.ts';
import { forceSync } from '../api/integrationAPI';
import { useState } from 'react';

const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { issuers, loading } = useAppSelector((state) => state.issuer);
    const [syncing, setSyncing] = useState(false);

    const handleForceSync = async () => {
        if (!confirm('This will trigger a sync for ALL learners. Continue?')) return;
        setSyncing(true);
        try {
            const res = await forceSync();
            alert(`Sync Complete: ${res.message || 'Success'}`);
        } catch (error) {
            console.error(error);
            alert('Sync failed. Check console.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        dispatch(fetchIssuers());
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
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            color: 'bg-blue-500',
            link: '/issuers',
        },
        {
            title: 'Pending Approvals',
            value: stats.pending,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            color: 'bg-yellow-500',
            link: '/issuers?status=pending',
        },
        {
            title: 'Approved Issuers',
            value: stats.approved,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            color: 'bg-green-500',
            link: '/issuers?status=approved',
        },
        {
            title: 'Blocked Issuers',
            value: stats.blocked,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                </svg>
            ),
            color: 'bg-red-500',
            link: '/issuers?blocked=true',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">Overview of issuer management and platform statistics</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, index) => (
                    <Link key={index} to={stat.link}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                                    <p className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight">
                                        {loading ? '...' : stat.value}
                                    </p>
                                </div>
                                <div className={`${stat.color} p-4 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link
                        to="/issuers?status=pending"
                        className="p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-yellow-200 bg-gradient-to-br from-yellow-50 to-white transition-all duration-300 group"
                    >
                        <div className="flex flex-col h-full bg-white bg-opacity-60 rounded-lg p-2">
                            <div className="flex items-center mb-3">
                                <div className="bg-yellow-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg
                                        className="w-6 h-6 text-yellow-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="ml-3 font-bold text-gray-900">Review Issuers</h3>
                            </div>
                            <p className="text-sm text-gray-600">Approve or reject pending issuer requests</p>
                        </div>
                    </Link>

                    <Link
                        to="/employers?status=pending"
                        className="p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-purple-200 bg-gradient-to-br from-purple-50 to-white transition-all duration-300 group"
                    >
                        <div className="flex flex-col h-full bg-white bg-opacity-60 rounded-lg p-2">
                            <div className="flex items-center mb-3">
                                <div className="bg-purple-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg
                                        className="w-6 h-6 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="ml-3 font-bold text-gray-900">Review Employers</h3>
                            </div>
                            <p className="text-sm text-gray-600">Review employer registrations</p>
                        </div>
                    </Link>

                    <Link
                        to="/issuers"
                        className="p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 bg-gradient-to-br from-blue-50 to-white transition-all duration-300 group"
                    >
                        <div className="flex flex-col h-full bg-white bg-opacity-60 rounded-lg p-2">
                            <div className="flex items-center mb-3">
                                <div className="bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="ml-3 font-bold text-gray-900">Manage Issuers</h3>
                            </div>
                            <p className="text-sm text-gray-600">View and edit all issuers</p>
                        </div>
                    </Link>

                    <Link
                        to="/employers"
                        className="p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-indigo-200 bg-gradient-to-br from-indigo-50 to-white transition-all duration-300 group"
                    >
                        <div className="flex flex-col h-full bg-white bg-opacity-60 rounded-lg p-2">
                            <div className="flex items-center mb-3">
                                <div className="bg-indigo-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg
                                        className="w-6 h-6 text-indigo-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="ml-3 font-bold text-gray-900">Manage Employers</h3>
                            </div>
                            <p className="text-sm text-gray-600">View and edit all employers</p>
                        </div>
                    </Link>

                    <div
                        onClick={handleForceSync}
                        className={`p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-teal-200 bg-gradient-to-br from-teal-50 to-white transition-all duration-300 group cursor-pointer ${syncing ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                        <div className="flex flex-col h-full bg-white bg-opacity-60 rounded-lg p-2">
                            <div className="flex items-center mb-3">
                                <div className="bg-teal-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg
                                        className={`w-6 h-6 text-teal-600 ${syncing ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </div>
                                <h3 className="ml-3 font-bold text-gray-900">{syncing ? 'Syncing...' : 'Force System Sync'}</h3>
                            </div>
                            <p className="text-sm text-gray-600">Manually trigger credential sync for all users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Issuers</h2>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : issuers.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No issuers found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {issuers.slice(0, 5).map((issuer) => (
                                    <tr key={issuer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{issuer.name}</div>
                                            <div className="text-sm text-gray-500">{issuer.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 capitalize">
                                                {issuer.type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`badge ${issuer.is_blocked
                                                    ? 'badge-blocked'
                                                    : issuer.status === 'pending'
                                                        ? 'badge-pending'
                                                        : issuer.status === 'approved'
                                                            ? 'badge-approved'
                                                            : 'badge-rejected'
                                                    }`}
                                            >
                                                {issuer.is_blocked ? 'Blocked' : issuer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(issuer.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-4 text-center">
                    <Link to="/issuers" className="text-primary-600 hover:text-primary-700 font-medium">
                        View All Issuers →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
