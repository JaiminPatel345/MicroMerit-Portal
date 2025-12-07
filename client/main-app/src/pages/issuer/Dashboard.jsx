



import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { Award, Users, Settings, CheckCircle, Clock, XCircle, Key } from './icons'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { issuerServices } from '../../services/issuerServices';
import { credentialServices } from '../../services/credentialServices';
import { issuerLoginSuccess } from '../../store/authIssuerSlice';

const IssuerDashboard = () => {
  const authIssuer = useSelector(state => state.authIssuer);
  const issuer = authIssuer?.issuer || { name: "Issuer", status: "pending" };
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [recentCredentials, setRecentCredentials] = useState([]);
  const [stats, setStats] = useState({ issued: 0, recipients: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Profile
        const profileRes = await issuerServices.getProfile();
        if (profileRes.success) {
          dispatch(issuerLoginSuccess({
            ...authIssuer,
            issuer: profileRes.data
          }));
        }

        // Fetch Recent Credentials
        const credRes = await credentialServices.getIssuerCredentials({ limit: 5 });
        if (credRes.success) {
          setRecentCredentials(credRes.data);
        }

        // Fetch Stats
        const statsRes = await issuerServices.getDashboardStats();
        if (statsRes.success) {
          const statsData = statsRes.data;
          // Handle both old and new structure for backward compatibility/robustness
          const totalIssued = statsData.summary?.totalIssued ?? statsData.credentialsIssued ?? 0;
          const activeRecipients = statsData.summary?.activeRecipients ?? statsData.activeRecipients ?? 0;

          setStats({
            issued: totalIssued,
            recipients: activeRecipients
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  const statusText = issuer.status.charAt(0).toUpperCase() + issuer.status.slice(1);
  const StatusBadge = () => {
    let classes = "";
    let icon = null;
    if (issuer.status === 'approved') {
      classes = "bg-green-100 text-green-800 border-green-300";
      icon = <CheckCircle className="w-4 h-4 mr-1.5" />;
    } else if (issuer.status === 'pending') {
      classes = "bg-yellow-100 text-yellow-800 border-yellow-300";
      icon = <Clock className="w-4 h-4 mr-1.5" />;
    } else {
      classes = "bg-red-100 text-red-800 border-red-300";
      icon = <XCircle className="w-4 h-4 mr-1.5" />;
    }


    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${classes}`}>
        {icon} {statusText}
      </span>
    );
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-4 bg-blue-chill-50 rounded-lg border border-blue-chill-100">
        <h3 className="text-2xl font-semibold text-gray-800">Welcome back, {issuer.name}!</h3>
        <StatusBadge />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Credentials Issued" value={stats.issued.toLocaleString()} icon={Award} colorClass="text-blue-chill-900 bg-blue-chill-100" />
        <Card title="Active Recipients" value={stats.recipients.toLocaleString()} icon={Users} colorClass="text-purple-800 bg-purple-100" />
      </div>


      <div className="pt-4 border-t">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/issuer/issuance')}
            className="flex flex-col items-center justify-center p-6 bg-blue-chill-600 text-white rounded-xl shadow-lg hover:bg-blue-chill-700 transition duration-200"
          >
            <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" /><path d="M22 2 15 22 11 13 2 9 22 2" /></svg>
            <span className="font-bold">Start New Issuance</span>
          </button>
          <button
            onClick={() => navigate('/issuer/credentials')}
            className="flex flex-col items-center justify-center p-6 bg-gray-100 text-blue-chill-800 rounded-xl shadow-md hover:bg-gray-200 transition duration-200"
          >
            <Award className="w-8 h-8 mb-2" />
            <span className="font-bold">View Credentials</span>
          </button>
          <button
            onClick={() => navigate('/issuer/apis')}
            className="flex flex-col items-center justify-center p-6 bg-gray-100 text-blue-chill-800 rounded-xl shadow-md hover:bg-gray-200 transition duration-200"
          >
            <Key className="w-8 h-8 mb-2" />
            <span className="font-bold">View API Keys</span>
          </button>
        </div>
      </div>

      {/* Recent Credentials Section */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Recent Issuances</h3>
          <button onClick={() => navigate('/issuer/credentials')} className="text-blue-chill-600 hover:text-blue-chill-800 font-medium text-sm">View All</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCredentials.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No recent credentials found.</td>
                  </tr>
                ) : (
                  recentCredentials.map((c) => (
                    <tr key={c.id}
                      onClick={() => navigate(`/c/${c.credential_id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.learner_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.certificate_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.issued_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'issued' || c.status === 'claimed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default IssuerDashboard;