
import { formatDate } from '../utils/dateUtils';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import {
    fetchEmployers,
    setFilters,
    setSelectedEmployer,
} from '../store/employerSlice.ts';
import type { EmployerStatus, EmployerProfile } from '../api/employerAPI.ts';
import EmployerDetailsModal from '../components/EmployerDetailsModal.tsx';

const Employers = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { employers, loading, error, pagination } = useAppSelector((state) => state.employer);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    // Removed unused state for approve/reject

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EmployerStatus | ''>('');

    useEffect(() => {
        const status = searchParams.get('status') as EmployerStatus | null;
        const page = Number(searchParams.get('page')) || 1;

        if (status) setStatusFilter(status);

        const newFilters: any = {};
        if (status) newFilters.status = status;
        if (searchTerm) newFilters.search = searchTerm;

        dispatch(setFilters(newFilters));
        dispatch(fetchEmployers({ filters: newFilters, page }));
    }, [searchParams, dispatch, searchTerm]); // Search term dependency needed to re-fetch on search

    const handleFilterChange = () => {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        // Don't modify page on filter change, maybe reset to 1
        setSearchParams(params);
    };

    // Debounce search ideally, but for now simple
    const handleSearch = (e: any) => {
        setSearchTerm(e.target.value);
    }

    // Removed handleApprove/handleReject

    const handleViewDetails = (employer: EmployerProfile) => {
        // dispatch(setSelectedEmployer(employer)); // If setSelectedEmployer is needed for details modal
        // assuming setSelectedEmployer is used by details modal? 
        // Logic shows details modal calls specific API or uses selected? 
        // Based on original code: dispatch(setSelectedEmployer(employer)); setShowDetailsModal(true);
        // I should keep it.
         dispatch(setSelectedEmployer(employer));
         setShowDetailsModal(true);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employer Management</h1>
                    <p className="mt-2 text-gray-600 text-lg">Manage and review employer registrations</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Search</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by name, email..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as EmployerStatus | '')}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button onClick={handleFilterChange} className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Employers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading && employers.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : employers.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No employers found</h3>
                        <p className="text-gray-500">Try adjusting your filters to see more results</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Registered
                                    </th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-64">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {employers.map((employer) => (
                                    <tr key={employer.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm">
                                                    {employer.company_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-5">
                                                    <div className="text-sm font-bold text-gray-900">{employer.company_name}</div>
                                                    {employer.company_website && <a href={employer.company_website} target="_blank" className="text-xs text-gray-500 hover:text-primary-600 hover:underline mt-1 block">{employer.company_website}</a>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{employer.email}</span>
                                                <span className="text-xs text-gray-500 mt-1">{employer.phone || 'No phone'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${employer.status === 'pending'
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    : employer.status === 'approved'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                            >
                                                {employer.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-500">
                                            {formatDate(employer.created_at)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => handleViewDetails(employer)}
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set('page', (pagination.page - 1).toString());
                                setSearchParams(params);
                            }}
                            disabled={pagination.page === 1}
                            className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-gray-600 text-sm font-medium">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set('page', (pagination.page + 1).toString());
                                setSearchParams(params);
                            }}
                            disabled={pagination.page === pagination.pages}
                            className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <EmployerDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
        </div>
    );
};

export default Employers;
