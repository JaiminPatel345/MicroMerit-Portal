import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { logout, getProfile } from '../store/authSlice.ts';

const Layout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (!user) {
            dispatch(getProfile());
        }
    }, [isAuthenticated, user, dispatch, navigate]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Navigation */}
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">MicroMerit Portal</h1>
                                <p className="text-xs text-gray-500">Admin Dashboard</p>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-secondary text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
