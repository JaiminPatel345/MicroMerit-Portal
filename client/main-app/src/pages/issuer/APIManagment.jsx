import React, { useState, useCallback, useEffect } from 'react';
import { Lock, Plus, Trash, Copy } from './icons';
import { issuerServices } from '../../services/issuerServices';


const APIManagement = () => {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await issuerServices.getApiKeys();
      if (response.success) {
        setKeys(
          response.data.map(k => ({
            ...k,
            key: k.api_key ? (k.api_key.substring(0, 11) + '****') : '****',
            status: k.active ? 'Active' : 'Revoked',
            lastUsed: k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never',
            fullKey: null,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load keys", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // run once on mount
  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async e => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setLoading(true);
    try {
      const result = await issuerServices.createApiKey({ name: newKeyName.trim() });
      setLoading(false);
      setNewKeyName('');

      if (result.success) {
        setRevealedKey(result.data); // show full key once
        loadKeys();
      }
    } catch (error) {
      console.error("Failed to create key", error);
      setLoading(false);
    }
  };

  const handleRevokeKey = async keyId => {
    if (
      !window.confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone.'
      )
    )
      return;

    setLoading(true);
    try {
      await issuerServices.revokeApiKey(keyId);
      await loadKeys();
    } catch (error) {
      console.error("Failed to revoke key", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = text => {
    if (!text) return;
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert('API Key copied to clipboard! Keep it safe.');
    } catch (err) {
      console.error('Could not copy text: ', err);
      alert('Failed to copy. Please manually copy the key: ' + text);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-gray-800">API Key Management</h3>

      {/* Create Key Form */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-xl font-semibold mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-chill-600" /> Create New Key
        </h4>
        <form
          onSubmit={handleCreateKey}
          className="flex flex-col sm:flex-row gap-4"
        >
          <input
            type="text"
            placeholder="Key Name (e.g., Prod Server, Test App)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            required
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-blue-chill-500 focus:border-blue-chill-500"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-chill-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-chill-700 transition duration-200 disabled:bg-gray-400"
            disabled={loading || !newKeyName.trim()}
          >
            {loading ? 'Generating...' : 'Generate Key'}
          </button>
        </form>
      </div>

      {/* Revealed Key Notice */}
      {revealedKey && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md space-y-3">
          <h5 className="text-lg font-bold text-green-800">
            🔑 New Key Generated Successfully!
          </h5>
          <p className="text-sm text-green-700 font-medium">
            <span className="font-bold">Key:</span>{' '}
            <code className="bg-gray-200 p-1 rounded text-black break-all">
              {revealedKey.api_key}
            </code>
          </p>

          <p className="text-xs text-red-600 font-semibold">
            NOTE: This is the ONLY time the full key will be shown. Copy it
            immediately and store it securely.
          </p>

          <button
            onClick={() => handleCopy(revealedKey.api_key)}
            className="flex items-center text-sm text-white bg-green-600 px-3 py-1.5 rounded hover:bg-green-700 transition"
          >
            <Copy className="w-4 h-4 mr-1" /> Copy Key
          </button>

          <button
            onClick={() => setRevealedKey(null)}
            className="ml-4 text-sm text-green-600 hover:text-green-800"
          >
            I have copied it
          </button>
        </div>
      )}

      {/* Key List */}
      <h4 className="text-xl font-semibold text-gray-800">Your API Keys</h4>

      {loading && <div className="text-blue-chill-600">Loading keys...</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key (Masked)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {keys.map(k => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {k.name}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                  <Lock className="w-4 h-4 inline-block mr-2 text-gray-400" />
                  {k.key}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${k.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {k.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {k.lastUsed}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {k.status === 'Active' && (
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                      disabled={loading}
                    >
                      <Trash className="w-4 h-4 mr-1" /> Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default APIManagement;
