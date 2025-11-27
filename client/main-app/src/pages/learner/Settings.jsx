import React, { useState } from 'react';
import {
    User,
    Lock,
    Mail,
    Smartphone,
    Globe,
    Eye,
    Moon,
    Save
} from 'lucide-react';
import { useSelector } from 'react-redux';

const Settings = () => {
    const learner = useSelector(state => state.authLearner.learner);
    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar */}
                    <div className="w-full md:w-64 space-y-2">
                        <TabButton
                            active={activeTab === 'account'}
                            onClick={() => setActiveTab('account')}
                            icon={<User size={18} />}
                            label="Account"
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                            icon={<Lock size={18} />}
                            label="Security"
                        />
                        <TabButton
                            active={activeTab === 'preferences'}
                            onClick={() => setActiveTab('preferences')}
                            icon={<Globe size={18} />}
                            label="Preferences"
                        />
                        <TabButton
                            active={activeTab === 'accessibility'}
                            onClick={() => setActiveTab('accessibility')}
                            icon={<Eye size={18} />}
                            label="Accessibility"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>

                                <div className="grid gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={learner?.name}
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    defaultValue={learner?.email}
                                                    disabled
                                                    className="w-full pl-10 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                                                />
                                            </div>
                                            <button className="px-4 py-2 text-sm text-blue-chill-600 font-medium hover:bg-blue-50 rounded-lg">
                                                Manage
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="tel"
                                                    defaultValue={learner?.phone || ''}
                                                    placeholder="Add phone number"
                                                    className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg"
                                                />
                                            </div>
                                            <button className="px-4 py-2 text-sm text-blue-chill-600 font-medium hover:bg-blue-50 rounded-lg">
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button className="flex items-center gap-2 bg-blue-chill-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-chill-700 transition-colors">
                                        <Save size={18} /> Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-200 rounded-lg" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button className="bg-blue-chill-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-chill-700">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Preferences</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-lg">
                                        <option>English (US)</option>
                                        <option>Hindi</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-lg">
                                        <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                                        <option>(GMT+00:00) UTC</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'accessibility' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Accessibility</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Moon size={20} className="text-gray-600" />
                                            <div>
                                                <h3 className="font-medium text-gray-900">Dark Mode</h3>
                                                <p className="text-sm text-gray-500">Easier on the eyes in low light</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-chill-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Eye size={20} className="text-gray-600" />
                                            <div>
                                                <h3 className="font-medium text-gray-900">High Contrast</h3>
                                                <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-chill-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-chill-50 text-blue-chill-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default Settings;
