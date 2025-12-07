// client/src/App.jsx
import { useState } from 'react';
import axios from 'axios';

function App() {
  const [form, setForm] = useState({
    learner_email: '',
    certificate_title: '',
    issued_at: '',
    ai_extracted_data: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Please upload a PDF certificate.');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('learner_email', form.learner_email);
      data.append('certificate_title', form.certificate_title);
      if (form.issued_at) data.append('issued_at', form.issued_at);
      if (form.ai_extracted_data) data.append('ai_extracted_data', form.ai_extracted_data);

      const res = await axios.post('http://localhost:4000/api/issue', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(res.data);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 600, width: '100%', background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Issue Certificate</h1>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Demo issuer page for MicroMerit – fill details and upload a PDF to issue a credential.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Learner Email *
            <input
              type="email"
              name="learner_email"
              value={form.learner_email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Certificate Title *
            <input
              type="text"
              name="certificate_title"
              value={form.certificate_title}
              onChange={handleChange}
              required
              placeholder="e.g. Advanced Python"
              style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Issued At (optional)
            <input
              type="date"
              name="issued_at"
              value={form.issued_at}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            AI Extracted Data (optional, JSON string)
            <textarea
              name="ai_extracted_data"
              value={form.ai_extracted_data}
              onChange={handleChange}
              rows={3}
              placeholder='{"skills":["Python","REST APIs"]}'
              style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Certificate PDF *
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
              style={{ marginTop: 4, marginBottom: 16 }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: loading ? '#9ca3af' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {loading ? 'Issuing…' : 'Issue Credential'}
          </button>
        </form>

        {error && (
          <p style={{ marginTop: 16, color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 12, background: '#ecfdf5', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Result</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            {result?.data?.pdf_url && (
              <a href={result.data.pdf_url} target="_blank" rel="noreferrer">
                View PDF on IPFS
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
