import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, Globe, Search, Loader2, Award, Building2, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../services/publicServices';
import LoginRoleSelector from './LoginRoleSelector';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const mountedRef = useRef(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Desktop dropdowns
  const [servicesOpen, setServicesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Mobile dropdowns
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'ur', name: 'اردو' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'si', name: 'සිංහල' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' }
  ];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ---------- Google Translate: load once + init ----------
  useEffect(() => {
    // if script already present, do nothing
    if (document.querySelector('#google-translate-script')) return;

    // Define the callback BEFORE loading the script
    window.googleTranslateElementInit = function () {
      try {
        // Use InlineLayout.SIMPLE so widget renders as a select
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      } catch (e) {
        // silent failure if Translate API object not available
        // console.error('Translate init failed', e);
      }
    };

    // Inject the script
    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.body.appendChild(s);

    // No cleanup for script — we want widget to persist across SPA nav
  }, []); // run once

  // ---------- Helper: wait for the .goog-te-combo to appear ----------
  const waitForCombo = (timeout = 5000) => {
    return new Promise((resolve) => {
      const existing = document.querySelector('.goog-te-combo');
      if (existing) return resolve(existing);

      const start = Date.now();
      const id = setInterval(() => {
        const el = document.querySelector('.goog-te-combo');
        if (el) {
          clearInterval(id);
          return resolve(el);
        }
        if (Date.now() - start > timeout) {
          clearInterval(id);
          return resolve(null);
        }
      }, 300);
    });
  };

  // Robust changeLanguage that waits & retries
  const changeLanguage = async (langCode) => {
    // open the dropdown UI so the widget loads if hidden — sometimes needed
    setLangOpen(false);

    // wait for select element to exist
    const combo = await waitForCombo(7000);
    if (!combo) {
      // last attempt: the widget might be in an iframe — try to find it there
      // Note: due to cross-origin, it's often not accessible. Inform dev via console
      console.warn('goog-te-combo not found. Google Translate widget may not have rendered yet.');
      return;
    }

    try {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      console.warn('Failed to change language via goog-te-combo', e);
    }

    // some browsers require a tiny delay and a second trigger
    setTimeout(() => {
      const el = document.querySelector('.goog-te-combo');
      if (el) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 300);
  };

  // ---------- Search Debounce ----------
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await publicApi.search(searchQuery);
          if (res.data?.success && mountedRef.current) {
            setSearchResults(res.data.data);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          if (mountedRef.current) setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* <- IMPORTANT: single hidden container for Google Translate widget */}
      <div
        id="google_translate_element"
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          opacity: 0,
          pointerEvents: "none",
          height: "1px",
          width: "1px",
          overflow: "hidden",
          zIndex: -1
        }}
      ></div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* LOGO */}
          <Link to="/" className="flex flex-col flex-shrink-0">
            <span className="text-2xl font-bold text-gray-900">MicroMerit</span>
            <span className="text-xs text-blue-chill-600 hidden sm:block">Your Skills, Unified.</span>
          </Link>

          {/* SEARCH BAR (CENTER) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 relative" ref={searchRef}>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-chill-500 focus:border-blue-chill-500 sm:text-sm transition-colors"
                placeholder="Search certificates, issuers, learners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Loader2 className="h-4 w-4 text-blue-chill-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[80vh] overflow-y-auto z-50">
                {/* Credentials */}
                {searchResults.credentials?.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Credentials</h3>
                    {searchResults.credentials.map(cred => (
                      <button
                        key={cred.credential_id}
                        onClick={() => handleResultClick(`/c/${cred.credential_id}`)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-start gap-3 transition-colors"
                      >
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{cred.certificate_title}</p>
                          <p className="text-xs text-gray-500">by {cred.issuer?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Issuers */}
                {searchResults.issuers?.length > 0 && (
                  <div className="p-2 border-t border-gray-50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Issuers</h3>
                    {searchResults.issuers.map(issuer => (
                      <button
                        key={issuer.id}
                        onClick={() => handleResultClick(`/i/${issuer.id}`)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                          {issuer.logo_url ? (
                            <img src={issuer.logo_url} alt={issuer.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{issuer.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{issuer.type?.replace('_', ' ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Learners */}
                {searchResults.learners?.length > 0 && (
                  <div className="p-2 border-t border-gray-50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Learners</h3>
                    {searchResults.learners.map(learner => (
                      <button
                        key={learner.id}
                        onClick={() => handleResultClick(`/p/${learner.id}`)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                          {learner.profileUrl ? (
                            <img src={learner.profileUrl} alt={learner.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {(!searchResults.credentials?.length && !searchResults.issuers?.length && !searchResults.learners?.length) && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-chill-600">Home</Link>

            {/* Services */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-chill-600 py-2">
                Services <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 pt-2 w-56 z-50">
                  <div className="bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link to="/wallet" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">Certificate Wallet</Link>
                    <Link to="/roadmap" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">Skill Pathway</Link>
                    <Link to="/verify" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">Credential Verification</Link>
                    <Link to="/issuer/login" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">Provider Portal</Link>
                    <Link to="/roadmap" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">AI Recommendation Engine</Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/verify" className="text-sm font-medium text-gray-700 hover:text-blue-chill-600">Verify</Link>

            {/* Resources */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-chill-600 py-2">
                Resources <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {resourcesOpen && (
                <div className="absolute top-full left-0 pt-2 w-48 z-50">
                  <div className="bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link to="/docs" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">Documentation</Link>
                    <Link to="/api" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">API Reference</Link>
                    <Link to="/faqs" className="block px-4 py-2 text-sm hover:bg-blue-chill-50">FAQs</Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT SIDE (DESKTOP) */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-chill-600"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">EN</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setLangOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-chill-50"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="text-sm font-medium text-gray-700 hover:text-blue-chill-600"
              >
                Log In
              </button>
              <Link to="/signup" className="bg-blue-chill-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-chill-700 transition shadow-sm">
                Sign Up
              </Link>
              <Link to="/issuer/login" className="text-blue-chill-600 text-sm font-medium hover:bg-blue-chill-50 px-3 py-2 rounded-lg border border-blue-chill-200 transition">
                Issuer Portal
              </Link>
            </div>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-chill-500 focus:border-blue-chill-500 sm:text-sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Link to="/" className="block text-gray-700 font-medium">Home</Link>

            {/* Services */}
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="flex items-center justify-between w-full text-gray-700 font-medium"
            >
              Services <ChevronDown size={16} />
            </button>
            {mobileServicesOpen && (
              <div className="pl-4 space-y-2">
                <Link to="/wallet" className="block text-gray-600 text-sm">Certificate Wallet</Link>
                <Link to="/roadmap" className="block text-gray-600 text-sm">Skill Pathway</Link>
                <Link to="/verify" className="block text-gray-600 text-sm">Credential Verification</Link>
                <Link to="/issuer/login" className="block text-gray-600 text-sm">Provider Portal</Link>
                <Link to="/roadmap" className="block text-gray-600 text-sm">AI Engine</Link>
              </div>
            )}

            <Link to="/verify" className="block text-gray-700 font-medium">Verify Credential</Link>

            {/* Resources */}
            <button
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              className="flex items-center justify-between w-full text-gray-700 font-medium"
            >
              Resources <ChevronDown size={16} />
            </button>
            {mobileResourcesOpen && (
              <div className="pl-4 space-y-2">
                <Link to="/docs" className="block text-gray-600 text-sm">Documentation</Link>
                <Link to="/api" className="block text-gray-600 text-sm">API Reference</Link>
                <Link to="/faqs" className="block text-gray-600 text-sm">FAQs</Link>
              </div>
            )}

            <Link to="/contact" className="block text-gray-700 font-medium">Contact</Link>

            {/* MOBILE LANGUAGE */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex items-center justify-between w-full text-gray-700 py-2 font-medium"
              >
                <span className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Language</span>
                </span>
                <ChevronDown size={16} />
              </button>
              {mobileLangOpen && (
                <div className="pl-4 grid grid-cols-2 gap-2 py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); setMobileLangOpen(false); }}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-blue-chill-50 text-sm"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AUTH (mobile) */}
            <div className="pt-4 space-y-3 border-t">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Learners</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setMobileMenuOpen(false); setLoginModalOpen(true); }}
                  className="block text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Log In
                </button>
                <Link to="/signup" className="block text-center bg-blue-chill-600 text-white px-4 py-2 rounded-lg hover:bg-blue-chill-700 text-sm font-medium">Sign Up</Link>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issuers</p>
                <Link to="/issuer/login" className="block text-center border border-blue-chill-200 text-blue-chill-600 px-6 py-2 rounded-lg hover:bg-blue-chill-50 text-sm font-medium">
                  Issuer Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginRoleSelector isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
};

export default Header;
