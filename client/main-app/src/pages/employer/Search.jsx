import React, { useState } from 'react';
import { employerApi } from '../../services/authServices';
import { Search, Loader, Filter, MapPin, Briefcase, Award, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmployerSearch = () => {
    const [filters, setFilters] = useState({
        keyword: '',
        nsqf_level: '',
        skills: '',
        sector: '',
        job_role: '',
        issuer: ''
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            const res = await employerApi.searchCandidates(cleanFilters);
            setResults(res.data.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            keyword: '',
            nsqf_level: '',
            skills: '',
            sector: '',
            job_role: '',
            issuer: ''
        });
        setSearched(false);
        setResults([]);
    };

    const activeFiltersCount = Object.entries(filters).filter(([k, v]) => k !== 'keyword' && v !== '').length;

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Search Section */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20 pt-16 px-6 lg:px-10 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-chill-200 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-chill-200 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-6xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Discover Certified <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-chill-200 to-blue-chill-400">Excellence</span>
                    </h1>
                    <p className="text-blue-100/80 mb-10 text-lg max-w-2xl mx-auto font-light">
                        Connect with verified talent. Filter by skills, sector, or specific credentials to find the perfect match for your team.
                    </p>

                    <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/20">
                        <form onSubmit={handleSearch} className="relative">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                                        placeholder="Search by skill, job role, or issuer..."
                                        value={filters.keyword}
                                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className={`px-5 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 border whitespace-nowrap ${showAdvanced || activeFiltersCount > 0
                                            ? 'bg-blue-50 border-blue-100 text-blue-700'
                                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <Filter size={18} />
                                        <span className="hidden sm:inline">Filters</span>
                                        {activeFiltersCount > 0 && (
                                            <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center min-w-[120px]"
                                    >
                                        {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Advanced Filters Panel */}
                    <div className={`mt-4 max-w-3xl mx-auto transition-all duration-300 ease-in-out origin-top ${showAdvanced ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none h-0'}`}>
                        <div className="bg-white rounded-2xl shadow-xl p-6 text-left border border-gray-100 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Filter size={16} className="text-blue-600" /> Advanced Options
                                </h3>
                                <button type="button" onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">
                                    Reset Filters
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skills</label>
                                    <input
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 outline-none transition-all"
                                        placeholder="e.g. Java, Python"
                                        value={filters.skills}
                                        onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Role</label>
                                    <input
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 outline-none transition-all"
                                        placeholder="e.g. Developer"
                                        value={filters.job_role}
                                        onChange={(e) => setFilters({ ...filters, job_role: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sector</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 outline-none transition-all"
                                        value={filters.sector}
                                        onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                                    >
                                        <option value="">Any Sector</option>
                                        {[
                                            "Aerospace & Aviation", "Agriculture", "Apparel", "Automotive", "Beauty & Wellness", "BFSI", 
                                            "Capital Goods & Manufacturing", "Chemicals & Petrochemicals", "Construction", 
                                            "Education, Training & Research", "Electronics & HW", "Environmental Science", 
                                            "Food Industry/Food Processing", "Gem & Jewellery", "Glass & Ceramics", "Handicrafts & Carpets", 
                                            "Healthcare", "Home Management and Caregiving", "Hydrocarbon", "Infrastructure", "Instrumentation", 
                                            "Iron & Steel", "IT-ITeS", "Leather", "Life Sciences", "Media & Entertainment", "Mining", 
                                            "Office Administration & Facility Management", "Paints & Coatings", "Paper & Paper Products", 
                                            "Persons with Disability", "Plumbing", "Power", "Private Security", "Retail", "Rubber Industry", 
                                            "Sports, Physical Education, Fitness & Leisure", "Telecom", "Textile & Handloom", 
                                            "Tourism & Hospitality", "Transportation, Logistics & Warehousing", 
                                            "Water Supply, Sewerage, Waste Management & Remediation activities", "Wood & Carpentry"
                                        ].map(sec => (
                                            <option key={sec} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NSQF Level</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 outline-none transition-all"
                                        value={filters.nsqf_level}
                                        onChange={(e) => setFilters({ ...filters, nsqf_level: e.target.value })}
                                    >
                                        <option value="">Any Level</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                                            <option key={lvl} value={lvl}>Level {lvl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2 lg:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issuer Name</label>
                                    <input
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 outline-none transition-all"
                                        placeholder="Search for candidates certified by specific organizations..."
                                        value={filters.issuer}
                                        onChange={(e) => setFilters({ ...filters, issuer: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    Close Panel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { handleSearch(); setShowAdvanced(false); }}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-gray-200"
                                >
                                    Apply Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {searched ? 'Search Results' : 'Recommended Candidates'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {searched
                                ? `Found ${results.length} talent matches based on your criteria.`
                                : 'Top emerging talent ready for opportunities.'}
                        </p>
                    </div>

                    {searched && activeFiltersCount > 0 && (
                        <div className="hidden md:flex gap-2 flex-wrap justify-end max-w-md">
                            {Object.entries(filters).map(([k, v]) => {
                                if (!v || k === 'keyword') return null;
                                return (
                                    <button
                                        key={k}
                                        onClick={() => { setFilters({ ...filters, [k]: '' }); handleSearch(); }}
                                        className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-1.5 group"
                                    >
                                        <span className="capitalize">{k.replace('_', ' ')}</span>: <span className="text-gray-900 group-hover:text-red-600 font-semibold">{v}</span>
                                        <X size={12} />
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {searched && results.length === 0 && !loading ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                        <div className="pb-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No candidates found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2">
                                We couldn't find any talent matching your current filters. Try relaxing your search criteria.
                            </p>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                                    <div className="flex gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="h-20 bg-gray-100 rounded-xl mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                                </div>
                            ))
                            : results.map((profile) => (
                                <Link
                                    key={profile.id}
                                    to={`/p/${profile.id}`}
                                    className="bg-white border border-transparent hover:border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={profile.profileUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=eff6ff&color=2563eb`}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                                    alt={profile.name}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" title="Available"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                                    {profile.name}
                                                </h3>
                                                <p className="text-gray-500 text-xs flex items-center gap-1 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                                                    <MapPin size={10} /> {profile.location || 'India'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {profile.matched_credential ? (
                                        <div className="bg-blue-50/50 p-4 rounded-xl mb-6 border border-blue-50/50 group-hover:border-blue-100/50 transition-colors">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                                                    <Award size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-0.5">Verified Skill</p>
                                                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{profile.matched_credential.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Issued by {profile.matched_credential.issuer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1"></div>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {/* Placeholder Skills Tags */}
                                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-2 transition-colors">
                                            View Profile <Briefcase size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        </span>
                                    </div>
                                </Link>
                            ))}

                        {/* Empty State placeholder for initial load */}
                        {!searched && results.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-40">
                                <Search size={48} className="mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-900">Start your search</p>
                                <p className="text-sm">Enter keywords or use filters to find candidates.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployerSearch;
