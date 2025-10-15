import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../features/authSlice';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glassmorphism border-b border-white/20 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MicroMerit Portal</h1>
                <p className="text-xs text-gray-600 capitalize">{role} Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  {'avatar' in user && (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <footer className="glassmorphism border-t border-white/20 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              © 2024 MicroMerit Portal. Smart India Hackathon Project.
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <button onClick={() => toast('Privacy Policy')} className="hover:text-blue-600">
                Privacy Policy
              </button>
              <button onClick={() => toast('Terms of Service')} className="hover:text-blue-600">
                Terms
              </button>
              <button onClick={() => toast('Contact Support')} className="hover:text-blue-600">
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
