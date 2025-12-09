import React, { useEffect, useState } from 'react';
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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Custom Date Range State
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isCustomDate, setIsCustomDate] = useState(false);
    
    const [limit] = useState(10);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const res = await learnerApi.getCertificates({
                page,
                limit,
                search: searchTerm,
                status: statusFilter,
                duration: durationFilter,
                tag: tagFilter
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

    useEffect(() => {
        const timer = setTimeout(() => {
            // Logic to determine parameters
            let apiStartDate = undefined;
            let apiEndDate = undefined;
            
            if (isCustomDate && startDate) {
                apiStartDate = startDate.toISOString();
                if (endDate) apiEndDate = endDate.toISOString();
            } else if (!isCustomDate && durationFilter && durationFilter !== 'all') {
                // If using preset duration, let backend handle it? Or we can calculate it here?
                // The backend currently handles 'duration' param nicely.
                // But if we want consistent API, we can just pass 'duration' param as before if not custom.
                // Or better: Let's stick to 'duration' param for presets to keep backend logic simple,
                // and use startDate/endDate for custom.
            }

            setLoading(true);
            learnerApi.getCertificates({
                page,
                limit,
                search: searchTerm,
                status: statusFilter,
                duration: isCustomDate ? undefined : durationFilter,
                page,
                limit,
                search: searchTerm,
                limit,
                search: searchTerm,
                status: statusFilter,
                sortBy: sortBy,
                duration: isCustomDate ? undefined : durationFilter,
                tag: tagFilter.join(','), // Send comma-separated string
                startDate: apiStartDate,
                endDate: apiEndDate
            }).then(res => {
                 const data = res.data?.data?.data || [];
                const pagination = res.data?.data?.pagination || {};
                setCertificates(data);
                setTotalPages(pagination.totalPages || 1);
            }).catch(err => {
                console.error("Failed to fetch", err);
            }).finally(() => setLoading(false));

        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, statusFilter, sortBy, durationFilter, tagFilter, startDate, endDate, isCustomDate]);

    // Popular tags for filtering
    const filterTags = [
        "IT", "Software", "ITI", "Non-tech", 
        "Fashion Design", "Mason", "Healthcare", "Finance",
        "Management", "Design"
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                    <p className="text-gray-500 mt-1">Manage your verified credentials and achievements.</p>
                </div>

                {/* Search and Filter Bar */}
                {/* Filters Container */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by title or issuer..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-chill-500 focus:border-blue-chill-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Dropdowns Group */}
                        <div className="flex flex-wrap gap-3">
                            {/* Status and Sort Filter */}
                            <div className="relative min-w-[180px]">
                                <select
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-chill-500 text-sm font-medium transition-colors"
                                    value={sortBy ? `${sortBy}` : statusFilter || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'max_hr_desc' || val === 'min_hr_asc') {
                                            setSortBy(val);
                                            setStatusFilter('');
                                        } else {
                                            setStatusFilter(val);
                                            setSortBy('');
                                        }
                                        setPage(1);
                                    }}
                                >
                                    <option value="">All Status (Newest)</option>
                                    <optgroup label="Filter by Status">
                                        <option value="issued">Issued</option>
                                        <option value="claimed">Claimed</option>
                                        <option value="revoked">Revoked</option>
                                    </optgroup>
                                    <optgroup label="Sort by Duration">
                                        <option value="max_hr_desc">Duration: High to Low</option>
                                        <option value="min_hr_asc">Duration: Low to High</option>
                                    </optgroup>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                            {/* Duration / Date Filter */}
                            <div className="relative min-w-[160px]">
                                <select
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-chill-500 text-sm font-medium transition-colors"
                                    value={isCustomDate ? 'custom' : durationFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'custom') {
                                            setIsCustomDate(true);
                                        } else {
                                            setIsCustomDate(false);
                                            setDurationFilter(val);
                                            setStartDate(null);
                                            setEndDate(null);
                                        }
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">All Time</option>
                                    <option value="1">Last 1 Month</option>
                                    <option value="2">Last 2 Months</option>
                                    <option value="3">Last 3 Months</option>
                                    <option value="6">Last 6 Months</option>
                                    <option value="12">Last 1 Year</option>
                                    <option value="custom">Custom Range...</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <CalendarIcon size={16} />
                                </div>
                            </div>
                            
                            {/* Custom Date Picker Popup/Inline */}
                            {isCustomDate && (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
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
                                            maxDate={new Date()} // Restrict to today or past
                                            placeholderText="Select date range"
                                            className="w-[220px] pl-10 pr-4 py-2.5 rounded-lg border border-blue-chill-300 focus:outline-none focus:ring-2 focus:ring-blue-chill-500 text-sm bg-white shadow-sm"
                                        />
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-chill-500" size={16} />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsCustomDate(false);
                                            setDurationFilter('');
                                            setStartDate(null);
                                            setEndDate(null);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Clear custom date"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 my-4"></div>

                    {/* Tag Filters */}
                     <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center text-xs font-medium text-gray-500 mr-2">
                            <Filter size={14} className="mr-1" />
                            Filter by Topic:
                        </div>
                        {filterTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setTagFilter(prev => {
                                        if (prev.includes(tag)) {
                                            return prev.filter(t => t !== tag);
                                        } else {
                                            return [...prev, tag];
                                        }
                                    });
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ease-in-out shadow-sm
                                    ${tagFilter.includes(tag) 
                                        ? 'bg-blue-chill-100 text-blue-chill-700 border-blue-chill-200 ring-2 ring-blue-chill-500 ring-offset-1' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-chill-200 hover:text-blue-chill-600 hover:shadow-md'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {tagFilter.length > 0 && (
                            <button
                                onClick={() => {
                                    setTagFilter([]);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:underline ml-2 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-chill-600 mx-auto mb-4"></div>
                        Loading certificates...
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900">No certificates found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl divide-y divide-gray-300 overflow-hidden">
                        {certificates.map((cert) => (
                            <CertificateRow key={cert.id} cert={cert} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm text-blue-chill-600 hover:bg-blue-chill-50 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:text-gray-400"
                        >
                            &lt; Previous
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm text-blue-chill-600 hover:bg-blue-chill-50 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:text-gray-400"
                        >
                            Next &gt;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CertificateRow = ({ cert }) => {
    // Generate a random color for the language/skill dot
    const dotColor = ['#f1e05a', '#3178c6', '#e34c26', '#563d7c'][Math.floor(Math.random() * 4)];

    // Try to get description from metadata, or fallback
    const description = cert.metadata?.description ||
        `Issued by ${cert.issuer?.name || 'Unknown Issuer'}. This credential verifies the completion of the course and mastery of the subject matter.`;

    return (
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Link to={`/credential/${cert.id}`} className="text-lg font-bold text-blue-chill-600 hover:underline truncate">
                        {cert.certificate_title}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cert.status === 'revoked'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                        {cert.status || 'Verified'}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }}></span>
                        <span>{cert.issuer?.type || 'Certificate'}</span>
                    </div>

                    <div className="flex items-center gap-1" title="Credential ID">
                        <Hash size={14} />
                        <span className="font-mono">{cert.credential_id || cert.id.substring(0, 8)}</span>
                    </div>

                    <div className="flex items-center gap-1" title="Issued Date">
                        <Clock size={14} />
                        <span>{new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Link
                    to={`/credential/${cert.id}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default Wallet;
