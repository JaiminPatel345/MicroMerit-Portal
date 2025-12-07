import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe, UserCircle, Bell, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { learnerLogout } from '../../store/authLearnerSlice';

const LearnerHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const authLearner = useSelector((state) => state.authLearner);
  const learner = authLearner?.learner;
  const dispatch = useDispatch();

  const logoutUser = () => {
    navigate('/login');
    setTimeout(() => {
      dispatch(learnerLogout());
    }, 50);
  };

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

  // Google Translate Init
  useEffect(() => {
    // 1. Create the target div FIRST to ensure it exists for the widget
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.position = 'absolute';
      div.style.top = '0';
      div.style.left = '0';
      div.style.opacity = '0';
      div.style.pointerEvents = 'none';
      div.style.zIndex = '-1';
      document.body.appendChild(div);
    }

    // 2. Define the init function
    const initGoogleTranslate = () => {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: languages.map(l => l.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch (e) {
          console.error("Google Translate Init Error:", e);
        }
      }
    };

    // 3. Load script or trigger init
    if (window.google && window.google.translate) {
      initGoogleTranslate();
    } else {
      window.googleTranslateElementInit = initGoogleTranslate;

      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Cookie Helper
  const setCookie = (name, value, days) => {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  const changeLanguage = (langCode) => {
    setLangOpen(false);
    setCookie('googtrans', `/auto/${langCode}`, 1);
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path ? 'text-blue-chill-600 font-medium' : 'text-gray-700 hover:text-blue-chill-600';

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
              <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
              <Link to="/wallet" className={isActive('/wallet')}>Wallet</Link>
              <Link to="/roadmap" className={isActive('/roadmap')}>Roadmap</Link>
              <Link to="/skills" className={isActive('/skills')}>Skill Profile</Link>
            </nav>
          </div>

          {/* RIGHT SIDE (Desktop) */}
          <div className="hidden lg:flex items-center space-x-4">

            {/* Notifications */}
            <Link to="/notifications" className="text-gray-500 hover:text-blue-chill-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
            </Link>

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
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto z-50">
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
                <span className="max-w-[100px] truncate">{learner?.name || learner?.email?.split('@')[0]}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{learner?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{learner?.email}</p>
                  </div>
                  <Link to={`/p/${learner?.id}`} className="block px-4 py-2 hover:bg-blue-chill-50 text-sm">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 hover:bg-blue-chill-50 text-sm">Settings</Link>
                  <button onClick={logoutUser} className="w-full text-left px-4 py-2 hover:bg-blue-chill-50 text-sm text-red-600">Logout</button>
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

            <Link to="/dashboard" className="block text-gray-700 py-2">Dashboard</Link>
            <Link to="/wallet" className="block text-gray-700 py-2">Wallet</Link>
            <Link to="/roadmap" className="block text-gray-700 py-2">Roadmap</Link>
            <Link to="/skills" className="block text-gray-700 py-2">Skill Profile</Link>
            <Link to="/notifications" className="block text-gray-700 py-2">Notifications</Link>

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
              <Link to="/settings" className="block py-2 text-gray-700">Settings</Link>
              <button onClick={logoutUser} className="w-full text-left py-2 text-red-600 hover:bg-blue-chill-50 rounded">Logout</button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default LearnerHeader;
