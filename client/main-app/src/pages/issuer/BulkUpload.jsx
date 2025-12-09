import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { setNotification } from '../../utils/notification';
import axios from 'axios';

// Icons
const UploadCloud = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>;
const FileArchive = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V9l-5-5H6a2 2 0 0 0-2 2v2" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><circle cx="10" cy="20" r="2" /><path d="M10 7V4" /><path d="M10 12v-1" /><path d="M10 16v-1" /></svg>;
const CheckCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const AlertCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

const BulkUpload = () => {
  const { accessToken: token } = useSelector((state) => state.authIssuer);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setBatchStatus(null);
      setBatchId(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Backend routes are mounted at root, e.g. /issuer/bulk-upload, NOT /api/issuer/...
      // Remove /api suffix if present in env var to ensure correct path
      let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      if (baseUrl.endsWith('/api')) {
          baseUrl = baseUrl.replace(/\/api$/, '');
      }

      const response = await axios.post(`${baseUrl}/issuer/bulk-upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setNotification('Upload started successfully', 'success');
        setBatchId(response.data.data.id);
        setPolling(true);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setNotification(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (polling && batchId) {
      interval = setInterval(async () => {
        try {
          let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          if (baseUrl.endsWith('/api')) {
              baseUrl = baseUrl.replace(/\/api$/, '');
          }

          const response = await axios.get(`${baseUrl}/issuer/bulk-upload/${batchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.data.success) {
            const status = response.data.data;
            setBatchStatus(status);
            
            if (status.status === 'completed' || status.status === 'failed') {
              setPolling(false);
              setNotification(`Batch processing ${status.status}`, status.status === 'completed' ? 'success' : 'error');
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling, batchId, token]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Bulk Certificate Upload</h2>
        <p className="text-gray-500">Upload ZIP files containing certificates (JSON/PDF) for automated verification and issuance.</p>
      </div>

      {!batchStatus || batchStatus.status === 'processing' ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : "Drag & Drop your ZIP file here"}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "or click to browse"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!file || uploading || polling}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
            >
              {uploading || polling ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{uploading ? 'Uploading...' : 'Processing Batch...'}</span>
                </>
              ) : (
                <span>Upload & Process</span>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {batchStatus && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                <FileArchive className="w-5 h-5 text-gray-500" />
                <span>Batch Results</span>
             </h3>
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                batchStatus.status === 'completed' ? 'bg-green-100 text-green-700' :
                batchStatus.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
             }`}>
                {batchStatus.status}
             </span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium mb-1">Total Files</p>
                <p className="text-3xl font-bold text-blue-800">{batchStatus.total_records}</p>
             </div>
             <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium mb-1">Successfully Issued</p>
                <p className="text-3xl font-bold text-green-800">{batchStatus.success_count}</p>
             </div>
             <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 font-medium mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-800">{batchStatus.failed_count}</p>
             </div>
          </div>

          {batchStatus.errors && batchStatus.errors.length > 0 && (
            <div className="px-8 pb-8">
               <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h4 className="flex items-center text-red-800 font-semibold mb-3">
                     <AlertCircle className="w-4 h-4 mr-2" />
                     Error Report
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                     {batchStatus.errors.map((err, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-red-100 text-sm flex justify-between items-start">
                           <span className="font-medium text-gray-700 mr-2">{err.file_name}:</span>
                           <span className="text-red-600 flex-1">{err.error_message}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          <div className="bg-gray-50 p-6 flex justify-center">
             <button
               onClick={() => { setFile(null); setBatchStatus(null); setBatchId(null); }}
               className="text-gray-600 hover:text-blue-600 font-medium text-sm flex items-center transition-colors"
             >
               Start New Upload
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
