import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { learnerLogout } from '../store/authLearnerSlice';

const LearnerHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const authLearner = useSelector((state) => state.authLearner);
  const learner = authLearner?.learner;
  const dispatch = useDispatch();

  const logoutUser = () => dispatch(learnerLogout());

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
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' }
  ];

  const changeLanguage = (langCode) => {
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // Google Translate Init
  useEffect(() => {
    if (window.google?.translate) return;

    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      document.body.appendChild(div);
    }

    window.googleTranslateElementInit = function () {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );
      } catch (err) {
        console.error(err);
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

  return (
    <header className="bg-white sticky top-0 z-50 shadow">
      <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LOGO + NAV */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex flex-col">
              <span className="text-2xl font-bold">MicroMerit</span>
              <span className="text-xs text-blue-chill-600 hidden sm:block">Your Skills, Unified.</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-chill-600">Dashboard</Link>
              <Link to="/wallet" className="text-gray-700 hover:text-blue-chill-600">Wallet</Link>
            </nav>
          </div>

          {/* RIGHT SIDE (Desktop) */}
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
                  {languages.map(lang => (
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

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-chill-600"
              >
                {learner?.profileUrl ? (
                  <img src={learner.profileUrl} className="w-8 h-8 rounded-full object-cover" alt="profile" />
                ) : (
                  <UserCircle className="w-8 h-8" />
                )}
                <span>{learner?.name || learner?.email}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2">
                  <Link to={`/p/${learner?.id}`} className="block px-4 py-2 hover:bg-blue-chill-50">Profile</Link>
                  <button onClick={logoutUser} className="w-full text-left px-4 py-2 hover:bg-blue-chill-50">Logout</button>
                </div>
              )}
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

            <Link to="/dashboard" className="block text-gray-700">Dashboard</Link>
            <Link to="/wallet" className="block text-gray-700">Wallet</Link>

            {/* Mobile Language */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center justify-between w-full text-gray-700 py-2"
              >
                <span className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Language</span>
                </span>
                <ChevronDown />
              </button>

              {langOpen && (
                <div className="pl-4 grid grid-cols-2 gap-2 py-2">
                  {languages.map(lang => (
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

            {/* Profile / Logout */}
            <div className="pt-4 border-t">
              <Link to={`/p/${learner?.id}`} className="block py-2 text-gray-700">Profile</Link>
              <button onClick={logoutUser} className="w-full text-left py-2 text-gray-700 hover:bg-blue-chill-50 rounded">Logout</button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default LearnerHeader;
