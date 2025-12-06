import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Search, Building2, LogOut } from 'lucide-react';

const EmployerHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/employer/login');
    };

    const NavItem = ({ to, icon: Icon, label }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                    ? 'bg-blue-chill-50 text-blue-chill-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
            }
        >
            <Icon size={18} />
            {label}
        </NavLink>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
                            <div className="w-8 h-8 bg-blue-chill-600 rounded-lg flex items-center justify-center text-white">
                                <Building2 size={20} />
                            </div>
                            <span>Employer<span className="text-blue-chill-600">Portal</span></span>
                        </div>

                        {/* Navigation */}
                        <nav className="flex items-center gap-1">
                            <NavItem to="/employer/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/employer/verify" icon={FileCheck} label="Verification" />
                            <NavItem to="/employer/search" icon={Search} label="Find Talent" />
                            <NavItem to="/employer/profile" icon={Building2} label="Profile" />
                        </nav>

                        {/* Profile/Logout */}
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-px bg-gray-200"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors"
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default EmployerHeader;
