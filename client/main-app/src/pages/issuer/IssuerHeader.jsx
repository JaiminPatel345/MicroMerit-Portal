import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { issuerLogout } from "../../store/authIssuerSlice";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";


// Stubbed Icons (using inline SVG for executability)
const Award = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.47 12.981A7 7 0 0 0 12 18a7 7 0 0 0-3.47-5.019" /><path d="M12 21v1" /><path d="M15.47 18.019A7 7 0 0 0 12 18a7 7 0 0 0-3.47-5.019" /></svg>;
const LayoutDashboard = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>;
const Send = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const Users = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const BarChart3 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
const Key = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2" /><path d="M14.5 7.5l-2.8 2.8" /><path d="M18.4 15.6a2 2 0 1 1-2.8-2.8l-1.4 1.4L11 9l-1 1 5.6 5.6 1.4-1.4a2 2 0 1 1 2.8 2.8z" /></svg>;
const Settings = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.44a2 2 0 0 1-1.22 1.83l-.88.44a2 2 0 0 0-1.57 2.11v1.78a2 2 0 0 0 1.57 2.11l.88.44a2 2 0 0 1 1.22 1.83v.44a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.44a2 2 0 0 1 1.22-1.83l.88-.44a2 2 0 0 0 1.57-2.11v-1.78a2 2 0 0 0-1.57-2.11l-.88-.44a2 2 0 0 1-1.22-1.83V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const HelpCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>;
const UserCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const ChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>;
// --- DEPENDENCY STUBS END ---

const navigation = [
  { name: 'Dashboard', href: '/issuer/dashboard', icon: LayoutDashboard },
  { name: 'Credentials', href: '/issuer/credentials', icon: Award },
  { name: 'New Issuance', href: '/issuer/issuance', icon: Send },
  { name: 'Recipient ', href: '/issuer/recipients', icon: Users },
  { name: 'Analytics', href: '/issuer/analytics', icon: BarChart3 },
  { name: 'API ', href: '/issuer/apis', icon: Key },
];

const secondaryNavigation = [
  { name: 'Settings ', href: '/issuer/settings', icon: Settings },
  { name: 'Support', href: '/issuer/support', icon: HelpCircle },
];

const IssuerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { pathname: currentPath } = useLocation();


  // --- MOCK AUTHENTICATION DATA ---
  const authIssuer = useSelector((state) => state.authIssuer);
  const issuer = authIssuer?.issuer;
  const dispatch = useDispatch();

  const logoutUser = () => {
    dispatch(issuerLogout());
    setProfileOpen(false);
  };

  const NavItem = ({ item }) => {
    const isActive = currentPath === item.href;

    return (
      <Link
        to={item.href}
        className={`
          flex items-center space-x-3 p-3 rounded-lg font-medium transition duration-200 
          ${isActive
            ? 'bg-blue-chill-600 text-white shadow-md'
            : 'text-blue-chill-100 hover:bg-blue-chill-700 hover:text-white'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile after navigation
        title={isCollapsed ? item.name : ''}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  // UseMemo to determine the current page title based on the mock path
  const currentPageTitle = useMemo(() => {
    const item = [...navigation, ...secondaryNavigation].find(n => n.href === currentPath);
    return item?.name || 'Portal Overview';
  }, [currentPath]);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">

      {/* Mobile Sidebar Toggle Button and Header (Fixed Top Bar) */}
      <header className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm p-3 flex justify-between items-center transition-all duration-300 ${isCollapsed ? 'lg:left-20' : 'lg:left-64'} lg:pl-4`}>

        {/* Mobile Sidebar Toggle */}
        <button
          className="p-2 text-blue-chill-700 bg-gray-100 rounded-lg lg:hidden hover:bg-gray-200 transition"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>

        {/* Current Page Title */}
        <h2 className="text-xl font-bold text-gray-800 flex-grow text-center lg:text-left lg:ml-4">{currentPageTitle}</h2>

        {/* Profile Dropdown (Right Top) */}
        <div className="relative ml-auto">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-chill-600 p-1.5 rounded-lg transition duration-150"
          >
            {issuer?.profileUrl ? (
              // Use a simple error handler for the placeholder image
              <img
                src={issuer.profileUrl}
                className="w-8 h-8 rounded-full object-cover border-2 border-blue-chill-500"
                alt="profile"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/374151/FFFFFF?text=I" }}
              />
            ) : (
              <UserCircle className="w-8 h-8 text-blue-chill-600" />
            )}
            <span className="hidden sm:inline font-semibold text-sm truncate max-w-[150px]">{issuer?.name || issuer?.email}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 origin-top-right animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 text-sm text-gray-500 truncate border-b mb-1">
                Signed in as <span className="font-medium text-gray-700 block">{issuer?.email || 'Guest'}</span>
              </div>

              <Link to={`/issuer/profile`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-chill-50">
                <Settings className="inline-block w-4 h-4 mr-2" />
                Issuer Profile
              </Link>
              <button
                onClick={logoutUser}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t mt-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>


      {/* Sidebar (Responsive) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-blue-chill-900 text-white flex flex-col p-5 
          transition-all transform duration-300 ease-in-out 
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >

        {/* Portal Branding (UPDATED) */}
        <div className={`flex items-center mb-10 pt-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <img src={logo} alt="MicroMerit Logo" className="w-10 h-10 rounded-lg flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col ml-3 overflow-hidden">
              <h1 className="text-2xl font-extrabold tracking-tight text-white leading-none truncate">
                Micro Merit
              </h1>
              <p className="text-xs text-blue-chill-300 truncate">
                Issuer Portal
              </p>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto overflow-x-hidden">
          {!isCollapsed && <div className="text-xs font-semibold uppercase text-blue-chill-300 mb-2 mt-4">Core Tools</div>}
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Secondary Navigation / Footer */}
        <nav className="flex flex-col gap-1.5 pt-6 border-t border-blue-chill-700">
          {!isCollapsed && <div className="text-xs font-semibold uppercase text-blue-chill-300 mb-2">Account</div>}
          {secondaryNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-2 rounded-lg hover:bg-blue-chill-700 text-blue-chill-200 hover:text-white transition-colors flex justify-center hidden lg:flex"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
          )}
        </button>

      </aside>

      {/* Main Content Area */}
      {/* Added padding-top for fixed header */}
      <main className={`flex-1 p-4 sm:p-8 pt-20 lg:pt-8 min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>

        {/* Backdrop for mobile (closes sidebar when clicked) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-0 mt-12 w-full">

          {/* Nested Content Container */}
          <div className=" p-6 min-h-[70vh]">
            <Outlet />
          </div>

        </div>

      </main>
    </div>
  );
};

export default IssuerLayout;