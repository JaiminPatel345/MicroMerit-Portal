import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';


const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop dropdowns
  const [servicesOpen, setServicesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    if (window.google?.translate) return;

    if (!document.getElementById('google_translate_element')) {
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      document.body.appendChild(translateDiv);
    }

    window.googleTranslateElementInit = function () {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      } catch (error) {
        console.error(error);
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const logoutUser = (e) => {
    dispatch(learnerLogout())
  }

  const changeLanguage = (langCode) => {
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-bold">MicroMerit</span>
            <span className="text-xs text-blue-chill-600 hidden sm:block">Your Skills, Unified.</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-chill-600">Home</Link>

            {/* Services */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className="flex items-center text-gray-700 hover:text-blue-chill-600 py-2"
              >
                Services <ChevronDown className="ml-1 w-4 h-4" />
              </button>

              {servicesOpen && (
                <div
                  className="absolute top-full left-0 pt-2 w-56 z-50"
                >
                  <div className="bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link to="/wallet" className="block px-4 py-2 hover:bg-blue-chill-50">Certificate Wallet</Link>
                    <Link to="/roadmap" className="block px-4 py-2 hover:bg-blue-chill-50">Skill Pathway</Link>
                    <Link to="/verify" className="block px-4 py-2 hover:bg-blue-chill-50">Credential Verification</Link>
                    <Link to="/issuer/login" className="block px-4 py-2 hover:bg-blue-chill-50">Provider Portal</Link>
                    <Link to="/roadmap" className="block px-4 py-2 hover:bg-blue-chill-50">AI Recommendation Engine</Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/verify" className="text-gray-700 hover:text-blue-chill-600">Verify Credential</Link>



            {/* Resources */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button
                className="flex items-center text-gray-700 hover:text-blue-chill-600 py-2"
              >
                Resources <ChevronDown className="ml-1 w-4 h-4" />
              </button>

              {resourcesOpen && (
                <div
                  className="absolute top-full left-0 pt-2 w-48 z-50"
                >
                  <div className="bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link to="/docs" className="block px-4 py-2 hover:bg-blue-chill-50">Documentation</Link>
                    <Link to="/api" className="block px-4 py-2 hover:bg-blue-chill-50">API Reference</Link>
                    <Link to="/case-studies" className="block px-4 py-2 hover:bg-blue-chill-50">Case Studies</Link>
                    <Link to="/faqs" className="block px-4 py-2 hover:bg-blue-chill-50">FAQs</Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/contact" className="text-gray-700 hover:text-blue-chill-600">Contact</Link>
          </nav>

          {/* RIGHT SIDE (DESKTOP) */}
          <div className="hidden lg:flex items-center space-x-4">

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-chill-600"
              >
                <Globe className="w-4 h-4" />
                <span>US</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-chill-50"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>


            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-700 hover:text-blue-chill-600 font-medium">Log In</Link>
              <Link to="/signup" className="bg-blue-chill-600 text-white px-5 py-2 rounded-lg hover:bg-blue-chill-700 transition shadow-md">
                Sign Up
              </Link>
              <Link to="/issuer/login" className="text-blue-chill-600 font-medium hover:bg-blue-chill-50 px-4 py-2 rounded-lg border border-blue-chill-200 transition">
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

            <Link to="/" className="block text-gray-700">Home</Link>

            {/* Services */}
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="flex items-center justify-between w-full text-gray-700"
            >
              Services <ChevronDown />
            </button>

            {mobileServicesOpen && (
              <div className="pl-4 space-y-2">
                <Link to="/wallet" className="block text-gray-600">Certificate Wallet</Link>
                <Link to="/roadmap" className="block text-gray-600">Skill Pathway</Link>
                <Link to="/verify" className="block text-gray-600">Credential Verification</Link>
                <Link to="/issuer/login" className="block text-gray-600">Provider Portal</Link>
                <Link to="/roadmap" className="block text-gray-600">AI Engine</Link>
              </div>
            )}

            <Link to="/verify" className="block text-gray-700">Verify Credential</Link>



            {/* Resources */}
            <button
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              className="flex items-center justify-between w-full text-gray-700"
            >
              Resources <ChevronDown />
            </button>

            {mobileResourcesOpen && (
              <div className="pl-4 space-y-2">
                <Link to="/docs" className="block text-gray-600">Documentation</Link>
                <Link to="/api" className="block text-gray-600">API Reference</Link>
                <Link to="/case-studies" className="block text-gray-600">Case Studies</Link>
                <Link to="/faqs" className="block text-gray-600">FAQs</Link>
              </div>
            )}

            <Link to="/contact" className="block text-gray-700">Contact</Link>

            {/* MOBILE LANGUAGE (NEW) */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex items-center justify-between w-full text-gray-700 py-2"
              >
                <span className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Language</span>
                </span>
                <ChevronDown />
              </button>

              {mobileLangOpen && (
                <div className="pl-4 grid grid-cols-2 gap-2 py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-blue-chill-50"
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
                <Link to="/login" className="block text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Log In</Link>
                <Link to="/signup" className="block text-center bg-blue-chill-600 text-white px-4 py-2 rounded-lg hover:bg-blue-chill-700">Sign Up</Link>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issuers</p>
                <Link to="/issuer/login" className="block text-center border border-blue-chill-200 text-blue-chill-600 px-6 py-2 rounded-lg hover:bg-blue-chill-50">
                  Issuer Portal
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
