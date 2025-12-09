import React, { useEffect, useState } from "react";
import {
    Search,
    Hash,
    Clock,
    ChevronDown,
    Filter,
    Calendar as CalendarIcon,
    X
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Wallet = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [durationFilter, setDurationFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState([]);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);

    // Custom Date Range State
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isCustomDate, setIsCustomDate] = useState(false);

    // Sectors / Interests
    const availableInterests = [
        "IT", "Software", "Healthcare", "Management", 
        "Finance", "Design", "Construction", "Electronics", 
        "Automotive", "Retail"
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCertificates();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, statusFilter, sortBy, durationFilter, tagFilter, startDate, endDate, isCustomDate]);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            // Logic for date range
            let apiStartDate = undefined;
            let apiEndDate = undefined;
            if (isCustomDate && startDate) {
                apiStartDate = startDate.toISOString();
                if (endDate) apiEndDate = endDate.toISOString();
            }

            const res = await learnerApi.getCertificates({
                page,
                limit,
                search: searchTerm,
                status: statusFilter,
                sortBy: sortBy,
                duration: isCustomDate ? undefined : durationFilter,
                tag: tagFilter.join(','), 
                startDate: apiStartDate,
                endDate: apiEndDate
            });

            const data = res.data?.data?.data || [];
            const pagination = res.data?.data?.pagination || {};

            setCertificates(data);
            setTotalPages(pagination.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch certificates", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Wallet</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage and showcase your verified credentials and skills.
                    </p>
                </div>

                {/* Filters & Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-8">
                    {/* Top Row: Search & Primary Sorts */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-chill-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search credentials by title or issuer..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-chill-500/20 focus:border-blue-chill-500 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative min-w-[160px]">
                            <select
                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-chill-500/20 focus:border-blue-chill-500 transition-all cursor-pointer hover:bg-gray-100"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="issued">Issued</option>
                                <option value="claimed">Claimed</option>
                                <option value="revoked">Revoked</option>
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>

                         {/* Sort Filter */}
                         <div className="relative min-w-[180px]">
                            <select
                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-chill-500/20 focus:border-blue-chill-500 transition-all cursor-pointer hover:bg-gray-100"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">Newest First</option>
                                <option value="max_hr_desc">Duration: High to Low</option>
                                <option value="min_hr_asc">Duration: Low to High</option>
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Middle Row: Duration & Date */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-5">
                         <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mr-2">
                             <Clock size={18} className="text-gray-400"/> Duration:
                         </div>
                         
                         <div className="flex flex-wrap gap-2">
                            {['all', '1', '3', '6', '12'].map((dur) => (
                                <button
                                    key={dur}
                                    onClick={() => {
                                        setDurationFilter(dur);
                                        setIsCustomDate(false);
                                        setStartDate(null);
                                        setEndDate(null);
                                        setPage(1);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        !isCustomDate && durationFilter === dur 
                                        ? 'bg-blue-chill-100 text-blue-chill-700 ring-1 ring-blue-chill-200' 
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {dur === 'all' ? 'Any Time' : `Last ${dur} Mo`}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setIsCustomDate(!isCustomDate)}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    isCustomDate
                                    ? 'bg-blue-chill-100 text-blue-chill-700 ring-1 ring-blue-chill-200' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <CalendarIcon size={14}/> Custom
                            </button>
                         </div>

                        {isCustomDate && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 ml-2">
                                <div className="relative">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(dates) => {
                                            const [start, end] = dates;
                                            setStartDate(start);
                                            setEndDate(end);
                                            setPage(1);
                                        }}
                                        startDate={startDate}
                                        endDate={endDate}
                                        selectsRange
                                        maxDate={new Date()}
                                        placeholderText="Select range"
                                        className="w-[200px] pl-9 pr-3 py-1.5 rounded-lg border border-blue-chill-300 focus:outline-none focus:ring-2 focus:ring-blue-chill-500/30 text-sm"
                                    />
                                    <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-chill-500" size={14} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Interests / Tags */}
                     <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                         <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mr-2">
                             <Hash size={18} className="text-gray-400"/> Interests:
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {availableInterests.map((tag) => (
                                 <button
                                     key={tag}
                                     onClick={() => {
                                         setTagFilter(prev => 
                                             prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                         );
                                         setPage(1);
                                     }}
                                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                         tagFilter.includes(tag)
                                         ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                         : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     {tag}
                                 </button>
                             ))}
                             {tagFilter.length > 0 && (
                                <button 
                                    onClick={() => setTagFilter([])}
                                    className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    Clear All
                                </button>
                             )}
                         </div>
                     </div>
                </div>

                {/* Content List */}
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-chill-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading your Wallet...</p>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 border-dashed">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No credentials found</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                            We couldn't find any certificates matching your current filters. Try adjusting your search or filters.
                        </p>
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setDurationFilter('all');
                                setTagFilter([]);
                                setIsCustomDate(false);
                            }}
                            className="mt-6 px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {certificates.map((cert) => (
                            <CertificateCard key={cert.id} cert={cert} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-semibold text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CertificateCard = ({ cert }) => {
    // Determine status style
    const statusConfig = {
        'issued': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Verified' },
        'claimed': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Claimed' },
        'revoked': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Revoked' },
        'default': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: 'Active' }
    };
    const status = statusConfig[cert.status] || statusConfig['default'];

    return (
        <Link to={`/credential/${cert.id}`} className="block group">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                {/* Hover Indicator Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-chill-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Issuer Logo / Placeholder */}
                    <div className="shrink-0">
                        {cert.issuer?.logo_url ? (
                            <img 
                                src={cert.issuer.logo_url} 
                                alt={cert.issuer.name}
                                className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-100 p-1"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-chill-50 to-blue-chill-100 flex items-center justify-center text-blue-chill-600 font-bold text-xl border border-blue-chill-100">
                                {cert.issuer?.name?.charAt(0) || 'C'}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                         {/* Header: Title & Status */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                             <div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-chill-600 transition-colors line-clamp-1">
                                    {cert.certificate_title}
                                </h3>
                                <div className="text-sm text-gray-500 font-medium">
                                    Issued by {cert.issuer?.name}
                                </div>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
                                 {status.label}
                             </span>
                        </div>

                        {/* Badges / Metadata */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
                            {/* NSQF Level Badge */}
                            {cert.nsqf_level && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    NSQF Level {cert.nsqf_level}
                                </span>
                            )}
                            
                            {/* Sector Badge */}
                            {cert.sector && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
                                    <Hash size={12} />
                                    {cert.sector}
                                </span>
                            )}

                             {/* Duration Badge */}
                             {/* {(cert.max_hr || cert.min_hr) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                                     <Clock size={12} />
                                     {/* {cert.min_hr} Hours */}
                                {/* </span> */}
                            {/* )}  */}
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center gap-6 text-2xs text-gray-400 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon size={12} />
                                Issued: {new Date(cert.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Hash size={12} />
                                ID: {cert.credential_id || cert.id?.substring(0,8)}
                            </div>
                        </div>
                    </div>

                    {/* Action Arrow (Visible on large screens) */}
                    <div className="hidden md:flex flex-col justify-center shrink-0">
                         <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-blue-chill-50 group-hover:text-blue-chill-600 group-hover:border-blue-chill-200 transition-all">
                             <ChevronDown size={20} className="-rotate-90 ml-0.5" />
                         </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default Wallet;
