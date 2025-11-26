



import React, { useEffect } from 'react';
import Card from '../../components/Card';
import { Award, Users, Settings, CheckCircle, Clock, XCircle } from './icons'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { issuerServices } from '../../services/issuerServices';
import { issuerLoginSuccess } from '../../store/authIssuerSlice';

const IssuerDashboard = () => {
  const authIssuer = useSelector(state => state.authIssuer);
  const issuer = authIssuer?.issuer || { name: "Issuer", status: "pending" };
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await issuerServices.getProfile();
        if (response.success) {
          // Update redux store with latest profile data
          dispatch(issuerLoginSuccess({
            ...authIssuer,
            issuer: response.data
          }));
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
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
        <Card title="Credentials Issued (YTD)" value="12,450" icon={Award} colorClass="text-blue-chill-900 bg-blue-chill-100" />
        <Card title="Active Recipients" value="9,870" icon={Users} colorClass="text-purple-800 bg-purple-100" />
        <Card title="Templates Active" value="14" icon={Settings} colorClass="text-orange-800 bg-orange-100" />
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
            onClick={() => navigate('/issuer/templates')}
            className="flex flex-col items-center justify-center p-6 bg-gray-100 text-blue-chill-800 rounded-xl shadow-md hover:bg-gray-200 transition duration-200"
          >
            <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="6" /></svg>
            <span className="font-bold">Manage Templates</span>
          </button>
          <button
            onClick={() => navigate('/issuer/apis')}
            className="flex flex-col items-center justify-center p-6 bg-gray-100 text-blue-chill-800 rounded-xl shadow-md hover:bg-gray-200 transition duration-200"
          >
            <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 2l-2 2" /></svg>
            <span className="font-bold">View API Keys</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default IssuerDashboard;