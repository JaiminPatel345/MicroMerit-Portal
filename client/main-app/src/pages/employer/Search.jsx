import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        const fetchInitialCandidates = async () => {
            setLoading(true);
            try {
                const res = await employerApi.searchCandidates({});
                setResults(res.data.data || []);
            } catch (err) {
                console.error("Initial fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialCandidates();
    }, []);

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

    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [comparing, setComparing] = useState(false);

    const toggleCandidateSelection = (id) => {

        if (selectedCandidates.includes(id)) {
            setSelectedCandidates(selectedCandidates.filter(cId => cId !== id));
        } else {
            if (selectedCandidates.length >= 3) {
                alert("You can compare up to 3 candidates at a time.");
                return;
            }
            setSelectedCandidates([...selectedCandidates, id]);
        }
    };

    const handleCompare = async () => {
        setComparing(true);
        try {
            const res = await employerApi.compareCandidates({
                candidate_ids: selectedCandidates,
                context: {
                    skills: filters.skills ? filters.skills.split(',').map(s => s.trim()) : [],
                    sector: filters.sector
                }
            });
            setComparisonData(res.data.data);
            setShowComparison(true);
        } catch (err) {
            console.error("Comparison failed", err);
            alert("Failed to load comparison data.");
        } finally {
            setComparing(false);
        }
    };

    const handleCloseComparison = () => {
        setShowComparison(false);
        setSelectedCandidates([]); // Clear selection after closing
    };

    const downloadCSV = () => {
        if (comparisonData.length === 0) return;
        
        const headers = ["Feature", ...comparisonData.map(c => c.name)];
        const rows = [
            ["NSQF Level", ...comparisonData.map(c => c.nsqf_level)],
            ["Skills Count", ...comparisonData.map(c => c.skills_count)],
            ["Fit Score", ...comparisonData.map(c => c.fit_score + "%")],
            // Removed Issuer Trust Score
            ["Top Skills", ...comparisonData.map(c => c.top_skills.join(", "))]
        ];

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "candidate_comparison.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24">
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
                                <div
                                    key={profile.id}
                                    className={`relative bg-white border hover:border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer ${selectedCandidates.includes(profile.id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-transparent'}`}
                                    onClick={() => toggleCandidateSelection(profile.id)}
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCandidates.includes(profile.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-blue-300'}`}>
                                            {selectedCandidates.includes(profile.id) && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                    </div>

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
                                        <Link
                                            to={`/p/${profile.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-2 transition-colors z-20"
                                        >
                                            View Profile <Briefcase size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        </Link>
                                    </div>
                                </div>
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

            {/* Comparison Floating Bar */}
            {selectedCandidates.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-4 px-6 z-40 animate-slide-up">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedCandidates.length}
                            </span>
                            <span className="text-gray-900 font-medium">Candidates Selected</span>
                            <button 
                                onClick={() => setSelectedCandidates([])}
                                className="text-sm text-gray-500 hover:text-red-500 ml-2"
                            >
                                Clear Selection
                            </button>
                        </div>
                        <button
                            onClick={handleCompare}
                            disabled={selectedCandidates.length < 2}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${selectedCandidates.length >= 2 
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {comparing ? 'Comparing...' : 'Compare Candidates'}
                        </button>
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparison && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Candidate Comparison</h3>
                                <p className="text-gray-500 text-sm mt-1">Comparing metrics for {comparisonData.length} candidates</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={downloadCSV}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download CSV
                                </button>
                                <button 
                                    onClick={handleCloseComparison}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-auto p-6">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-4 bg-gray-50 border-b-2 border-slate-100 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/4">Feature</th>
                                        {comparisonData.map(c => (
                                            <th key={c.id} className="p-4 border-b-2 border-slate-100 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={c.avatar || `https://ui-avatars.com/api/?name=${c.name}&background=eff6ff&color=2563eb`}
                                                        className="w-10 h-10 rounded-full"
                                                        alt={c.name}
                                                    />
                                                    <div>
                                                        <div className="font-bold text-gray-900">{c.name}</div>
                                                        <Link to={`/p/${c.id}`} className="text-xs text-blue-500 hover:underline">View Profile</Link>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="hover:bg-gray-50/30">
                                        <td className="p-4 border-b border-gray-100 font-medium text-gray-700">NSQF Level</td>
                                        {comparisonData.map(c => (
                                            <td key={c.id} className="p-4 border-b border-gray-100 text-gray-600 font-medium">
                                                Level {c.nsqf_level}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-gray-50/30">
                                        <td className="p-4 border-b border-gray-100 font-medium text-gray-700">Skills Verified</td>
                                        {comparisonData.map(c => (
                                            <td key={c.id} className="p-4 border-b border-gray-100 text-gray-600">
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    {c.skills_count} Skills
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-gray-50/30">
                                        <td className="p-4 border-b border-gray-100 font-medium text-gray-700">Fit Score</td>
                                        {comparisonData.map(c => (
                                            <td key={c.id} className="p-4 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${c.fit_score}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-green-700">{c.fit_score}%</span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-gray-50/30">
                                        <td className="p-4 border-b border-gray-100 font-medium text-gray-700 align-top">Top Skills</td>
                                        {comparisonData.map(c => (
                                            <td key={c.id} className="p-4 border-b border-gray-100">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.top_skills.map(skill => (
                                                        <span key={skill} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs capitalize">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default EmployerSearch;
