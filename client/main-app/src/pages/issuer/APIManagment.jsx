import React, { useState, useCallback } from 'react';
import { Lock, Plus, Trash, Copy } from './icons';

export const mockIssuerData = {
keys: [
{ id: 'key_abc123', name: 'Production API Key', created: '2024-01-15', lastUsed: '2025-11-19', status: 'Active', key: 'sk-prod-********' },
{ id: 'key_def456', name: 'Testing Sandbox Key', created: '2024-05-01', lastUsed: '2025-09-10', status: 'Active', key: 'sk-test-********' },
{ id: 'key_ghi789', name: 'Old Key (Revoked)', created: '2023-12-01', lastUsed: '2024-03-20', status: 'Revoked', key: 'sk-old-********' },
]
};


export const mockAPI = {
getProfile: async (issuerId) => { await new Promise(r => setTimeout(r, 300)); return null; },
updateProfile: async (updates) => { await new Promise(r => setTimeout(r, 500)); return { success: true, newProfile: { ...updates } }; },
listKeys: async () => { await new Promise(r => setTimeout(r, 400)); return mockIssuerData.keys; },
createKey: async (keyName) => { await new Promise(r => setTimeout(r, 800)); const newId = `key_${Math.random().toString(36).substring(2,8)}`; const fullKey = `sk-new-${Math.random().toString(36).substring(2,20)}`; const newKey = { id: newId, name: keyName, created: new Date().toISOString().substring(0,10), lastUsed: 'Never', status: 'Active', key: fullKey }; mockIssuerData.keys.unshift(newKey); return { success: true, key: newKey }; },
revokeKey: async (keyId) => { await new Promise(r => setTimeout(r, 300)); const idx = mockIssuerData.keys.findIndex(k => k.id === keyId); if (idx !== -1) mockIssuerData.keys[idx].status = 'Revoked'; return { success: true }; }
};


const APIManagement = () => {
  const [keys, setKeys] = useState(
    mockIssuerData.keys.map(k => ({ ...k, fullKey: null }))
  );
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const fetchedKeys = await mockAPI.listKeys();
    setKeys(
      fetchedKeys.map(k => ({
        ...k,
        key: k.key.substring(0, 11) + '****',
        fullKey: null,
      }))
    );
    setLoading(false);
  }, []);

  // run once on mount
  React.useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async e => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setLoading(true);
    const result = await mockAPI.createKey(newKeyName.trim());
    setLoading(false);
    setNewKeyName('');

    if (result.success) {
      setRevealedKey(result.key); // show full key once
      loadKeys();
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
    await mockAPI.revokeKey(keyId);
    await loadKeys();
    setLoading(false);
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
              {revealedKey.key}
            </code>
          </p>

          <p className="text-xs text-red-600 font-semibold">
            NOTE: This is the ONLY time the full key will be shown. Copy it
            immediately and store it securely.
          </p>

          <button
            onClick={() => handleCopy(revealedKey.key)}
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
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      k.status === 'Active'
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
