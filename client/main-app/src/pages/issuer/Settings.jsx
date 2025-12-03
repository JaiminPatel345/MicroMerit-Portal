import React, { useState } from 'react';
import { Lock, Bell, Globe, Shield, Moon, Sun, Monitor, LogOut } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('security');
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newsletter: false,
        securityAlerts: true
    });
    const [theme, setTheme] = useState('system');

    const tabs = [
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'general', label: 'General', icon: Globe },
    ];

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your account settings and preferences.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4">
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-chill-100 text-blue-chill-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                                <form className="space-y-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input type="password" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 outline-none" />
                                    </div>
                                    <div className="pt-2">
                                        <button className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700 font-medium transition">
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                                        Enable
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Security Alerts</p>
                                        <p className="text-sm text-gray-500">Get notified about suspicious activity.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.securityAlerts}
                                            onChange={() => handleNotificationChange('securityAlerts')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-chill-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-chill-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Issuance Updates</p>
                                        <p className="text-sm text-gray-500">Receive updates when credentials are issued.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailAlerts}
                                            onChange={() => handleNotificationChange('emailAlerts')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-chill-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-chill-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Marketing & Newsletter</p>
                                        <p className="text-sm text-gray-500">Receive news, updates, and promotional offers.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.newsletter}
                                            onChange={() => handleNotificationChange('newsletter')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-chill-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-chill-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                                <div className="grid grid-cols-3 gap-4 max-w-md">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 border rounded-xl flex flex-col items-center space-y-2 ${theme === 'light' ? 'border-blue-chill-600 bg-blue-chill-50 text-blue-chill-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <Sun size={24} />
                                        <span className="text-sm font-medium">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 border rounded-xl flex flex-col items-center space-y-2 ${theme === 'dark' ? 'border-blue-chill-600 bg-blue-chill-50 text-blue-chill-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <Moon size={24} />
                                        <span className="text-sm font-medium">Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 border rounded-xl flex flex-col items-center space-y-2 ${theme === 'system' ? 'border-blue-chill-600 bg-blue-chill-50 text-blue-chill-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <Monitor size={24} />
                                        <span className="text-sm font-medium">System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-red-800">Delete Account</p>
                                        <p className="text-sm text-red-600">Permanently delete your account and all data.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
