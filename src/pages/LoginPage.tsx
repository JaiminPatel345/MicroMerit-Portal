import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Briefcase, Shield, Award, TrendingUp, Users } from 'lucide-react';
import { useAppDispatch } from '../hooks/redux';
import { login } from '../features/authSlice';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState<'learner' | 'issuer' | 'employer' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const roles = [
    {
      type: 'learner' as const,
      icon: GraduationCap,
      title: 'Learner',
      description: 'Access your credentials and skill recommendations',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      type: 'issuer' as const,
      icon: Building2,
      title: 'Issuer',
      description: 'Issue and manage micro-credentials',
      gradient: 'from-purple-600 to-fuchsia-500',
    },
    {
      type: 'employer' as const,
      icon: Briefcase,
      title: 'Employer',
      description: 'Verify credentials and discover talent',
      gradient: 'from-slate-700 to-gray-900',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      await dispatch(login({ email, password, role: selectedRole })).unwrap();
      toast.success(`Welcome! Logged in as ${selectedRole}`);
      
      // Navigate based on role
      if (selectedRole === 'learner') navigate('/learner/dashboard');
      else if (selectedRole === 'issuer') navigate('/issuer/dashboard');
      else navigate('/employer/dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Professional Background - White with subtle patterns */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl"
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl font-extrabold mb-3 gradient-text"
            >
              MicroMerit Portal
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-gray-600 mb-6"
            >
              National Micro-Credential Platform
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-6 px-6 py-3 bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Blockchain Secured</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">NSQF Aligned</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-gray-700">4+ Users</span>
              </div>
            </motion.div>
          </div>

          {!selectedRole ? (
            <>
              {/* Role Selection Cards - Much Larger */}
              <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-6xl mx-auto">
                {roles.map((role, index) => {
                  const Icon = role.icon;
                  return (
                    <motion.div
                      key={role.type}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ y: -8 }}
                      onClick={() => setSelectedRole(role.type)}
                      className="cursor-pointer"
                    >
                      <div className="bg-white rounded-2xl p-10 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 h-full">
                        <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                          <Icon className="w-12 h-12 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {role.title}
                        </h3>
                        
                        <p className="text-gray-600 text-base leading-relaxed mb-6">
                          {role.description}
                        </p>

                        <div className="flex items-center text-blue-600 font-semibold text-sm">
                          Get Started <TrendingUp className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* DigiLocker Integration Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-4 mb-10"
              >
                <button
                  onClick={() => toast.success('DigiLocker OAuth integration - Redirecting to authorization endpoint', { duration: 3000 })}
                  className="flex items-center justify-center gap-3 px-10 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 font-semibold text-base rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRolQFcVODXkRnYE8QVlGactD2W8HSUlgKKIg&s"
                    alt="DigiLocker"
                    className="h-8 w-auto"
                  />
                  <span className="text-slate-800">Login with DigiLocker</span>
                </button>

                <p className="text-xs text-gray-500 text-center max-w-md">
                  Secure OAuth 2.0 authentication via DigiLocker API
                </p>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-4 gap-4 max-w-3xl mx-auto"
              >
                {[
                  { icon: '🔐', text: 'Blockchain Secured' },
                  { icon: '✅', text: 'NSQF Verified' },
                  { icon: '🏆', text: 'Industry Recognized' },
                  {
                    text: 'DigiLocker Ready',
                    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRolQFcVODXkRnYE8QVlGactD2W8HSUlgKKIg&s',
                  },
                ].map((badge, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 text-center border border-slate-200 shadow-sm">
                    {badge.image ? (
                      <div className="flex items-center justify-center h-8 mb-1">
                        <img src={badge.image} alt={badge.text} className="h-6 object-contain" />
                      </div>
                    ) : (
                      <div className="text-2xl mb-1">{badge.icon}</div>
                    )}
                    <p className="text-xs font-medium text-slate-700">{badge.text}</p>
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border border-slate-200">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold mb-6 hover:gap-3 transition-all"
                >
                  ← Back to role selection
                </button>

                <div className="text-center mb-6">
                  <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-3 shadow-lg">
                    {selectedRole === 'learner' && <GraduationCap className="w-10 h-10 text-white" />}
                    {selectedRole === 'issuer' && <Building2 className="w-10 h-10 text-white" />}
                    {selectedRole === 'employer' && <Briefcase className="w-10 h-10 text-white" />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal
                  </h2>
                  <p className="text-gray-600 text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div className="text-center pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => toast.success('Sign up functionality coming soon!')}
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
