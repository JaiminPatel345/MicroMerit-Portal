import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [translateReady, setTranslateReady] = useState(false);

  // Desktop dropdowns
  const [servicesOpen, setServicesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Mobile dropdowns FIX
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: 'US' },
    { code: 'hi', name: 'हिन्दी', flag: 'IN' },
    { code: 'mr', name: 'मराठी', flag: 'IN' },
    { code: 'ta', name: 'தமிழ்', flag: 'IN' },
    { code: 'te', name: 'తెలుగు', flag: 'IN' },
    { code: 'bn', name: 'বাংলা', flag: 'IN' },
    { code: 'gu', name: 'ગુજરાતી', flag: 'IN' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: 'IN' },
    { code: 'ml', name: 'മലയാളം', flag: 'IN' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: 'IN' },
    { code: 'ur', name: 'اردو', flag: 'PK' },
    { code: 'ne', name: 'नेपाली', flag: 'NP' },
    { code: 'si', name: 'සිංහල', flag: 'LK' },
    { code: 'fr', name: 'French', flag: 'FR' },
    { code: 'de', name: 'German', flag: 'DE' },
    { code: 'es', name: 'Spanish', flag: 'ES' },
    { code: 'ar', name: 'Arabic', flag: 'SA' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: 'CN' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: 'TW' },
    { code: 'ja', name: 'Japanese', flag: 'JP' },
    { code: 'ko', name: 'Korean', flag: 'KR' },
    { code: 'ru', name: 'Russian', flag: 'RU' }
  ];

  // Initialize Google Translate
  useEffect(() => {
    // Check if already loaded
    if (window.google?.translate) {
      setTranslateReady(true);
      return;
    }

    // Add the translate element container
    if (!document.getElementById('google_translate_element')) {
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      document.body.appendChild(translateDiv);
    }

    // Define the initialization function
    window.googleTranslateElementInit = function() {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,mr,ta,te,bn,gu,kn,ml,pa,ur,ne,si,fr,de,es,ar,zh-CN,zh-TW,ja,ko,ru',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );
        setTranslateReady(true);
      } catch (error) {
        console.error('Google Translate initialization error:', error);
      }
    };

    // Add the script if not already present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => console.error('Failed to load Google Translate script');
      document.head.appendChild(script);
    }

    // Cleanup
    return () => {
      // Don't remove script on unmount to avoid reloading
    };
  }, []);

  const changeLanguage = (langCode) => {
    if (!translateReady) {
      alert('Translation is loading. Please wait a moment and try again.');
      return;
    }

    // Method 1: Try to find and use the select element
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Method 2: Try to click the language in the widget
    const widget = document.getElementById('google_translate_element');
    if (widget) {
      const select = widget.querySelector('select');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }

    // Method 3: Set cookie directly (fallback)
    const setGoogleTranslateCookie = (lang) => {
      document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      window.location.reload();
    };

    setGoogleTranslateCookie(langCode);
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        visibility: 'hidden'
      }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex flex-col">
              <span className="text-2xl font-bold">MicroMerit</span>
              <span className="text-xs text-blue-chill-600 hidden sm:block">Your Skills, Unified.</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-chill-600 transition">Home</Link>

            <div className="relative">
              <button
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                className="flex items-center text-gray-700 hover:text-blue-chill-600 transition"
              >
                Services <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {servicesOpen && (
                <div
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2"
                >
                  <Link to="/wallet" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Certificate Wallet</Link>
                  <Link to="/pathway" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Skill Pathway</Link>
                  <Link to="/verification" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Credential Verification</Link>
                  <Link to="/provider" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Provider Portal</Link>
                  <Link to="/ai-engine" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">AI Recommendation Engine</Link>
                </div>
              )}
            </div>

            <Link to="/about" className="text-gray-700 hover:text-blue-chill-600 transition">About Us</Link>

            <div className="relative">
              <button
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
                className="flex items-center text-gray-700 hover:text-blue-chill-600 transition"
              >
                Resources <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {resourcesOpen && (
                <div
                  onMouseEnter={() => setResourcesOpen(true)}
                  onMouseLeave={() => setResourcesOpen(false)}
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2"
                >
                  <Link to="/docs" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Documentation</Link>
                  <Link to="/api" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">API Reference</Link>
                  <Link to="/case-studies" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">Case Studies</Link>
                  <Link to="/faqs" className="block px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700">FAQs</Link>
                </div>
              )}
            </div>

            <Link to="/contact" className="text-gray-700 hover:text-blue-chill-600 transition">Contact</Link>
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-chill-600 transition"
              >
                <Globe className="w-4 h-4" />
                <span>US</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLangOpen(false);
                        changeLanguage(lang.code);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-chill-50 hover:text-blue-chill-700"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/login" className="text-blue-chill-600 font-medium hover:text-blue-chill-700">Login</Link>
              <div className="h-6 w-px bg-gray-400 "></div>
            <Link to="/issuer/signup" className="bg-blue-chill-600 text-white px-6 py-2 rounded-lg hover:bg-blue-chill-700">Start Now As Issuer</Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">

            <Link to="/" className="block text-gray-700 hover:text-blue-chill-600">Home</Link>

            {/* MOBILE SERVICES DROPDOWN FIX */}
            <div>
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="flex items-center justify-between w-full text-gray-700 hover:text-blue-chill-600"
              >
                Services <ChevronDown className="w-4 h-4" />
              </button>

              {mobileServicesOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  <Link to="/wallet" className="block text-gray-600 hover:text-blue-chill-600">Certificate Wallet</Link>
                  <Link to="/pathway" className="block text-gray-600 hover:text-blue-chill-600">Skill Pathway</Link>
                  <Link to="/verification" className="block text-gray-600 hover:text-blue-chill-600">Credential Verification</Link>
                  <Link to="/provider" className="block text-gray-600 hover:text-blue-chill-600">Provider Portal</Link>
                  <Link to="/ai-engine" className="block text-gray-600 hover:text-blue-chill-600">AI Recommendation Engine</Link>
                </div>
              )}
            </div>

            <Link to="/about" className="block text-gray-700 hover:text-blue-chill-600">About Us</Link>

            {/* MOBILE RESOURCES DROPDOWN FIX */}
            <div>
              <button
                onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                className="flex items-center justify-between w-full text-gray-700 hover:text-blue-chill-600"
              >
                Resources <ChevronDown className="w-4 h-4" />
              </button>

              {mobileResourcesOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  <Link to="/docs" className="block text-gray-600 hover:text-blue-chill-600">Documentation</Link>
                  <Link to="/api" className="block text-gray-600 hover:text-blue-chill-600">API Reference</Link>
                  <Link to="/case-studies" className="block text-gray-600 hover:text-blue-chill-600">Case Studies</Link>
                  <Link to="/faqs" className="block text-gray-600 hover:text-blue-chill-600">FAQs</Link>
                </div>
              )}
            </div>

            <Link to="/contact" className="block text-gray-700 hover:text-blue-chill-600">Contact</Link>

            <div className="pt-4 space-y-2">
              <Link to="/login" className="block w-full text-center text-blue-chill-600 border border-blue-chill-600 px-6 py-2 rounded-lg hover:bg-blue-chill-50">
                Login
              </Link>
              <Link to="/issuer/signup" className="block w-full text-center bg-blue-chill-600 text-white px-6 py-2 rounded-lg hover:bg-blue-chill-700">
                Start Now As Issuer
              </Link>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Header;