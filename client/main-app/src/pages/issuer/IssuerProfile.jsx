import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle, Lock } from './icons';
import { useSelector, useDispatch } from 'react-redux';


const IssuerProfile = () => {
    const issuer = useSelector(state => state.authIssuer.issuer);
    const [formData, setFormData] = useState({
        name: issuer.name,
        email: issuer.email,
        website: issuer.website,
        address: issuer.address,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const dispatch = useDispatch();

    const statusMap = {
        approved: { icon: CheckCircle, color: 'text-green-600', text: 'Approved (Full access)' },
        pending: { icon: Clock, color: 'text-yellow-600', text: 'Pending (Awaiting admin review)' },
        rejected: { icon: XCircle, color: 'text-red-600', text: 'Rejected (Contact support)' },
        blocked: { icon: Lock, color: 'text-red-600', text: 'Blocked (Access restricted)' },
    };
    const currentStatus = statusMap[issuer.status] || statusMap['pending'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const result = await mockAPI.updateProfile(formData);
            if (result.success) {
                dispatch({ type: 'issuer/updateProfile', payload: result.newProfile });
                setMessage('Profile updated successfully!');
            }
        } catch (error) {
            setMessage('Failed to update profile. Try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }

        setTimeout(() => setMessage(''), 3000); // Clear message
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <h3 className="text-2xl font-semibold text-gray-800">Account and Branding Settings</h3>
            
            {/* Issuer Status */}
            <div className={`p-4 rounded-lg border-l-4 ${currentStatus.color.replace('text', 'border')} ${currentStatus.color.replace('600', '50').replace('text', 'bg')} flex items-center space-x-3`}>
                <currentStatus.icon className={`w-6 h-6 ${currentStatus.color}`} />
                <div>
                    <p className="font-semibold text-gray-800">Issuer Status: {currentStatus.text}</p>
                    <p className="text-sm text-gray-600">You must be 'Approved' to issue credentials.</p>
                </div>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleUpdate} className="space-y-6 p-6 border rounded-xl shadow-sm">
                <h4 className="text-xl font-semibold text-gray-800 border-b pb-2">Organization Details</h4>
                
                {/* Message */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-3 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Official Email (Read-only)</label>
                    <input type="email" value={formData.email} disabled className="mt-1 w-full p-3 border border-gray-200 bg-gray-100 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Website URL</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="mt-1 w-full p-3 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="mt-1 w-full p-3 border rounded-lg"></textarea>
                </div>
                
                <button 
                    type="submit" 
                    className="w-full bg-blue-chill-600 text-white p-3 rounded-lg font-bold shadow-md hover:bg-blue-chill-700 transition duration-200 disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};


export default IssuerProfile;