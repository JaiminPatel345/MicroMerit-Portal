import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Building2, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

const LoginRoleSelector = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSelect = (role) => {
        onClose();
        if (role === 'learner') {
            navigate('/login');
        } else if (role === 'employer') {
            navigate('/employer/login');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to MicroMerit</h2>
                    <p className="text-gray-500 mt-1">Please select your login type to continue</p>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 grid md:grid-cols-2 gap-6">

                    {/* Learner Option */}
                    <button
                        onClick={() => handleSelect('learner')}
                        className="group relative flex flex-col items-center text-center p-6 rounded-xl border-2 border-transparent hover:border-blue-chill-100 bg-gray-50 hover:bg-blue-chill-50/50 transition-all duration-300"
                    >
                        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-chill-100 rounded-full flex items-center justify-center text-blue-chill-600">
                                <User size={32} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">I'm a Learner</h3>
                        <p className="text-sm text-gray-500 mb-6 px-4">
                            Access your digital wallet, view credentials, and build your skill profile.
                        </p>
                        <div className="mt-auto px-6 py-2 bg-white text-blue-chill-600 text-sm font-semibold rounded-lg border border-blue-chill-200 group-hover:bg-blue-chill-600 group-hover:text-white group-hover:border-transparent transition-all flex items-center gap-2">
                            Learner Login <ArrowRight size={16} />
                        </div>
                    </button>

                    {/* Employer Option */}
                    <button
                        onClick={() => handleSelect('employer')}
                        className="group relative flex flex-col items-center text-center p-6 rounded-xl border-2 border-transparent hover:border-purple-100 bg-gray-50 hover:bg-purple-50/50 transition-all duration-300"
                    >
                        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                <Building2 size={32} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">I'm an Employer</h3>
                        <p className="text-sm text-gray-500 mb-6 px-4">
                            Verify credentials, search for talent, and manage your company profile.
                        </p>
                        <div className="mt-auto px-6 py-2 bg-white text-purple-600 text-sm font-semibold rounded-lg border border-purple-200 group-hover:bg-purple-600 group-hover:text-white group-hover:border-transparent transition-all flex items-center gap-2">
                            Employer Login <ArrowRight size={16} />
                        </div>
                    </button>

                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        Are you an Issuer? <button onClick={() => { onClose(); navigate('/issuer/login'); }} className="text-blue-chill-600 font-medium hover:underline">Login here</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginRoleSelector;
