import React from 'react';
import Card from '../../components/Card';
import { Users, LayoutDashboard, CheckCircle, BarChart3 } from './icons';


const IssuerAnalytics = () => (
    <div className="space-y-8">
        <h3 className="text-2xl font-semibold text-gray-800">Credential Performance Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-chill-50 rounded-xl border border-blue-chill-200 h-80 flex items-center justify-center">
                <p className="text-gray-600 font-semibold">Credential Issuance Trend (Mock Chart)</p>
            </div>
            <div className="p-6 bg-blue-chill-50 rounded-xl border border-blue-chill-200 h-80 flex items-center justify-center">
                <p className="text-gray-600 font-semibold">Top 5 Credential Templates (Mock Chart)</p>
            </div>
        </div>
        <div className="p-6 border-t pt-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">Engagement Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card title="Shared to LinkedIn" value="1,200" icon={Users} colorClass="bg-white text-blue-chill-800 border" />
                <Card title="Viewed by Employers" value="4,500" icon={LayoutDashboard} colorClass="bg-white text-blue-chill-800 border" />
                <Card title="Verification Rate" value="98.5%" icon={CheckCircle} colorClass="bg-white text-green-800 border" />
                <Card title="Top Recipient Country" value="India" icon={BarChart3} colorClass="bg-white text-purple-800 border" />
            </div>
        </div>
    </div>
);
export default IssuerAnalytics;