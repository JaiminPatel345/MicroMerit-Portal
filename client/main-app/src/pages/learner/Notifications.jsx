import React from 'react';
import {
    Bell,
    CheckCircle,
    Award,
    Zap,
    Eye
} from 'lucide-react';

const Notifications = () => {
    // Mock Notifications
    const notifications = [
        {
            id: 1,
            type: 'certificate',
            title: 'New Certificate Issued',
            message: 'TechUniversity has issued your "Advanced Python" certificate.',
            time: '2 hours ago',
            read: false,
            icon: <Award className="text-blue-600" size={20} />,
            bg: 'bg-blue-50'
        },
        {
            id: 2,
            type: 'verification',
            title: 'Credential Verified',
            message: 'Your "Data Science Basics" credential was verified by an employer.',
            time: '1 day ago',
            read: true,
            icon: <Eye className="text-purple-600" size={20} />,
            bg: 'bg-purple-50'
        },
        {
            id: 3,
            type: 'roadmap',
            title: 'New Roadmap Update',
            message: 'AI has generated a new learning path based on your recent skills.',
            time: '2 days ago',
            read: true,
            icon: <Zap className="text-yellow-600" size={20} />,
            bg: 'bg-yellow-50'
        },
        {
            id: 4,
            type: 'system',
            title: 'Profile Verified',
            message: 'Your identity verification is complete. You now have the "Verified User" badge.',
            time: '3 days ago',
            read: true,
            icon: <CheckCircle className="text-green-600" size={20} />,
            bg: 'bg-green-50'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-3xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                            <Bell size={24} className="text-gray-700" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    </div>
                    <button className="text-sm text-blue-chill-600 hover:underline">
                        Mark all as read
                    </button>
                </div>

                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-xl border transition-all hover:shadow-md ${notif.read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg}`}>
                                    {notif.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold ${notif.read ? 'text-gray-900' : 'text-blue-900'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                    </div>
                                    <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-blue-800'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {notifications.length === 0 && (
                    <div className="text-center py-20">
                        <Bell className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">No new notifications</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Notifications;
