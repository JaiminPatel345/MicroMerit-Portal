# Verification API - Usage Examples

## Table of Contents
1. [Verify Credential by UID](#1-verify-credential-by-uid)
2. [Verify PDF Upload](#2-verify-pdf-upload)
3. [Frontend Integration Examples](#3-frontend-integration-examples)
4. [cURL Examples](#4-curl-examples)

---

## 1. Verify Credential by UID

### Request
```http
GET /verify/CRED-1731888000000-A1B2C3D4E5F6G7H8 HTTP/1.1
Host: localhost:3000
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Credential verified successfully",
  "data": {
    "success": true,
    "credential": {
      "uid": "CRED-1731888000000-A1B2C3D4E5F6G7H8",
      "status": "claimed",
      "issuedAt": "2024-01-15T10:30:00.000Z",
      "claimedAt": "2024-01-16T14:20:00.000Z",
      "metadata": {
        "title": "Certificate of Completion",
        "description": "Successfully completed the Advanced Web Development course",
        "courseCode": "CS301",
        "grade": "A",
        "credits": 4
      }
    },
    "issuer": {
      "id": 1,
      "name": "Tech University",
      "type": "university",
      "logoUrl": "https://s3.example.com/logos/tech-uni.png",
      "officialDomain": "tech.edu",
      "websiteUrl": "https://tech.edu",
      "email": "credentials@tech.edu",
      "status": "approved"
    },
    "learner": {
      "id": 5,
      "email": "student@example.com",
      "phone": "+1234567890",
      "profileUrl": "https://s3.example.com/profiles/student.jpg"
    },
    "pdf": {
      "pdfUrl": "https://s3.example.com/certificates/CRED-123-certificate.pdf",
      "qrCodeUrl": "https://s3.example.com/certificates/CRED-123-qr.png",
      "createdAt": "2024-01-15T10:35:00.000Z"
    },
    "blockchain": {
      "transactionId": "0xabc123def456789...",
      "hashValue": "a1b2c3d4e5f6g7h8i9j0...",
      "storedAt": "2024-01-15T10:40:00.000Z"
    }
  },
  "statusCode": 200
}
```

### Not Found Response (404)
```json
{
  "success": false,
  "message": "Credential not found",
  "error": "NOT_FOUND",
  "statusCode": 404
}
```

### Unclaimed Credential with Pending Blockchain
```json
{
  "success": true,
  "message": "Credential verified successfully",
  "data": {
    "success": true,
    "credential": {
      "uid": "CRED-1731888000000-B2C3D4E5F6G7H8I9",
      "status": "issued",
      "issuedAt": "2024-02-01T09:00:00.000Z",
      "claimedAt": null,
      "metadata": {
        "title": "Professional Certification",
        "description": "Certified in Project Management"
      }
    },
    "issuer": {
      "id": 2,
      "name": "Professional Certifications Inc",
      "type": "training_provider",
      "logoUrl": null,
      "officialDomain": "profcert.com",
      "websiteUrl": "https://profcert.com",
      "email": "info@profcert.com",
      "status": "approved"
    },
    "learner": null,
    "pdf": null,
    "blockchain": {
      "transactionId": "pending",
      "hashValue": "pending",
      "storedAt": null,
      "note": "Blockchain verification pending"
    }
  },
  "statusCode": 200
}
```

---

## 2. Verify PDF Upload

### Request
```http
POST /verify/pdf HTTP/1.1
Host: localhost:3000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="pdf_file"; filename="certificate.pdf"
Content-Type: application/pdf

[PDF Binary Data]
------WebKitFormBoundary--
```

### Success Response - Verified PDF (200 OK)
```json
{
  "success": true,
  "message": "PDF verification completed",
  "data": {
    "verified": true,
    "reason": "PDF verification successful - authentic and unmodified",
    "hashMatch": true,
    "credential": {
      "uid": "CRED-1731888000000-A1B2C3D4E5F6G7H8",
      "status": "claimed",
      "issuedAt": "2024-01-15T10:30:00.000Z",
      "claimedAt": "2024-01-16T14:20:00.000Z",
      "metadata": {
        "title": "Certificate of Completion",
        "description": "Successfully completed the Advanced Web Development course"
      }
    },
    "issuer": {
      "id": 1,
      "name": "Tech University",
      "type": "university",
      "logoUrl": "https://s3.example.com/logos/tech-uni.png",
      "officialDomain": "tech.edu",
      "websiteUrl": "https://tech.edu"
    },
    "learner": {
      "id": 5,
      "email": "student@example.com",
      "phone": "+1234567890",
      "profileUrl": "https://s3.example.com/profiles/student.jpg"
    },
    "blockchain": {
      "transactionId": "0xabc123def456789...",
      "hashValue": "a1b2c3d4e5f6g7h8i9j0...",
      "storedAt": "2024-01-15T10:40:00.000Z"
    }
  },
  "statusCode": 200
}
```

### Tampered PDF Response (200 OK)
```json
{
  "success": true,
  "message": "PDF verification completed",
  "data": {
    "verified": false,
    "reason": "PDF has been tampered with (hash mismatch)",
    "hashMatch": false,
    "credential": {
      "uid": "CRED-1731888000000-A1B2C3D4E5F6G7H8",
      "status": "issued",
      "issuedAt": "2024-01-15T10:30:00.000Z"
    },
    "issuer": {
      "id": 1,
      "name": "Tech University"
    },
    "learner": null
  },
  "statusCode": 200
}
```

### No Credential UID Found (200 OK)
```json
{
  "success": true,
  "message": "PDF verification completed",
  "data": {
    "verified": false,
    "reason": "No credential UID found in PDF",
    "credential": null,
    "issuer": null,
    "learner": null
  },
  "statusCode": 200
}
```

### Revoked Credential (200 OK)
```json
{
  "success": true,
  "message": "PDF verification completed",
  "data": {
    "verified": false,
    "reason": "Credential has been revoked by issuer",
    "hashMatch": true,
    "credential": {
      "uid": "CRED-1731888000000-REVOKED123",
      "status": "revoked",
      "issuedAt": "2024-01-15T10:30:00.000Z",
      "claimedAt": "2024-01-16T14:20:00.000Z"
    },
    "issuer": {
      "id": 1,
      "name": "Tech University",
      "type": "university"
    },
    "learner": {
      "id": 5,
      "email": "student@example.com"
    }
  },
  "statusCode": 200
}
```

### Error Responses

#### No File Uploaded (400)
```json
{
  "success": false,
  "message": "No PDF file uploaded. Upload a PDF file using the field name \"pdf_file\"",
  "error": "NO_FILE",
  "statusCode": 400
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Invalid file type: image/png. Expected: application/pdf",
  "error": "INVALID_FILE_TYPE",
  "statusCode": 400
}
```

#### File Too Large (400)
```json
{
  "success": false,
  "message": "File size 12582912 exceeds maximum 10485760 bytes (10MB)",
  "error": "FILE_TOO_LARGE",
  "statusCode": 400
}
```

#### Corrupted PDF (400)
```json
{
  "success": false,
  "message": "Invalid or corrupted PDF file. Please ensure you are uploading a valid PDF certificate",
  "error": "INVALID_PDF",
  "statusCode": 400
}
```

---

## 3. Frontend Integration Examples

### React/Next.js Example

#### Verify by UID
```javascript
import { useState } from 'react';

function VerifyByUID() {
  const [credentialUid, setCredentialUid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/verify/${credentialUid}`);
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        value={credentialUid}
        onChange={(e) => setCredentialUid(e.target.value)}
        placeholder="Enter Credential UID"
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <h3>Credential Verified ✓</h3>
          <p><strong>Status:</strong> {result.credential.status}</p>
          <p><strong>Issuer:</strong> {result.issuer.name}</p>
          <p><strong>Issued:</strong> {new Date(result.credential.issuedAt).toLocaleDateString()}</p>
          
          {result.learner && (
            <p><strong>Learner:</strong> {result.learner.email}</p>
          )}
          
          {result.pdf && (
            <a href={result.pdf.pdfUrl} target="_blank">Download Certificate</a>
          )}
          
          {result.blockchain && result.blockchain.transactionId !== 'pending' && (
            <p><strong>Blockchain TX:</strong> {result.blockchain.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

#### Verify by PDF Upload
```javascript
import { useState } from 'react';

function VerifyByPDF() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Validate file
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      setFile(null);
      return;
    }
    
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf_file', file);
      
      const response = await fetch('http://localhost:3000/verify/pdf', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to verify PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <button onClick={handleVerify} disabled={loading || !file}>
        {loading ? 'Verifying...' : 'Verify PDF'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className={`result ${result.verified ? 'success' : 'failure'}`}>
          <h3>{result.verified ? '✓ PDF Verified' : '✗ Verification Failed'}</h3>
          <p>{result.reason}</p>
          
          {result.credential && (
            <>
              <p><strong>Credential UID:</strong> {result.credential.uid}</p>
              <p><strong>Status:</strong> {result.credential.status}</p>
            </>
          )}
          
          {result.issuer && (
            <p><strong>Issuer:</strong> {result.issuer.name}</p>
          )}
          
          {result.learner && (
            <p><strong>Learner:</strong> {result.learner.email}</p>
          )}
          
          {result.hashMatch !== null && (
            <p>
              <strong>Hash Match:</strong> 
              {result.hashMatch ? ' ✓ Yes' : ' ✗ No (Tampered)'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Verify Credential</title>
</head>
<body>
    <h1>Verify Credential</h1>
    
    <!-- Verify by UID -->
    <div>
        <h2>Verify by UID</h2>
        <input type="text" id="credentialUid" placeholder="Enter Credential UID">
        <button onclick="verifyByUid()">Verify</button>
        <div id="uidResult"></div>
    </div>
    
    <!-- Verify by PDF -->
    <div>
        <h2>Verify by PDF Upload</h2>
        <input type="file" id="pdfFile" accept="application/pdf">
        <button onclick="verifyByPdf()">Verify PDF</button>
        <div id="pdfResult"></div>
    </div>

    <script>
        async function verifyByUid() {
            const uid = document.getElementById('credentialUid').value;
            const resultDiv = document.getElementById('uidResult');
            
            try {
                const response = await fetch(`http://localhost:3000/verify/${uid}`);
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `
                        <h3>Verified ✓</h3>
                        <p><strong>Status:</strong> ${data.data.credential.status}</p>
                        <p><strong>Issuer:</strong> ${data.data.issuer.name}</p>
                        <p><strong>Issued:</strong> ${new Date(data.data.credential.issuedAt).toLocaleDateString()}</p>
                    `;
                } else {
                    resultDiv.innerHTML = `<p style="color: red;">Error: ${data.message}</p>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
        
        async function verifyByPdf() {
            const fileInput = document.getElementById('pdfFile');
            const file = fileInput.files[0];
            const resultDiv = document.getElementById('pdfResult');
            
            if (!file) {
                alert('Please select a PDF file');
                return;
            }
            
            const formData = new FormData();
            formData.append('pdf_file', file);
            
            try {
                const response = await fetch('http://localhost:3000/verify/pdf', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const result = data.data;
                    resultDiv.innerHTML = `
                        <h3>${result.verified ? 'Verified ✓' : 'Verification Failed ✗'}</h3>
                        <p>${result.reason}</p>
                        ${result.credential ? `<p><strong>UID:</strong> ${result.credential.uid}</p>` : ''}
                        ${result.issuer ? `<p><strong>Issuer:</strong> ${result.issuer.name}</p>` : ''}
                    `;
                } else {
                    resultDiv.innerHTML = `<p style="color: red;">Error: ${data.message}</p>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

---

## 4. cURL Examples

### Verify by UID
```bash
# Basic verification
curl -X GET "http://localhost:3000/verify/CRED-1731888000000-A1B2C3D4E5F6G7H8"

# With pretty-printed JSON
curl -X GET "http://localhost:3000/verify/CRED-1731888000000-A1B2C3D4E5F6G7H8" | jq

# Save response to file
curl -X GET "http://localhost:3000/verify/CRED-1731888000000-A1B2C3D4E5F6G7H8" > verification_result.json
```

### Verify by PDF Upload
```bash
# Upload PDF for verification
curl -X POST "http://localhost:3000/verify/pdf" \
  -F "pdf_file=@/path/to/certificate.pdf"

# With pretty-printed JSON
curl -X POST "http://localhost:3000/verify/pdf" \
  -F "pdf_file=@/path/to/certificate.pdf" | jq

# With verbose output
curl -v -X POST "http://localhost:3000/verify/pdf" \
  -F "pdf_file=@/path/to/certificate.pdf"

# Save response to file
curl -X POST "http://localhost:3000/verify/pdf" \
  -F "pdf_file=@/path/to/certificate.pdf" \
  -o verification_result.json
```

### Using with Authentication Headers (if needed in future)
```bash
curl -X GET "http://localhost:3000/verify/CRED-123" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. Testing with Postman

### Verify by UID
1. Method: **GET**
2. URL: `http://localhost:3000/verify/CRED-1731888000000-A1B2C3D4E5F6G7H8`
3. Headers: (none required)
4. Send request

### Verify by PDF Upload
1. Method: **POST**
2. URL: `http://localhost:3000/verify/pdf`
3. Body: 
   - Select **form-data**
   - Key: `pdf_file` (change type to **File**)
   - Value: Select your PDF file
4. Send request

---

## 6. Response Status Codes

| Status Code | Meaning | When |
|------------|---------|------|
| 200 | Success | Credential found or PDF processed |
| 400 | Bad Request | Invalid file, wrong type, too large |
| 404 | Not Found | Credential UID doesn't exist |
| 500 | Server Error | Internal server error |

---

## 7. Common Use Cases

### Use Case 1: Employer Verification
An employer wants to verify a candidate's certificate:
1. Scan QR code on certificate OR enter credential UID
2. System fetches credential details
3. Display issuer, date, status
4. Show blockchain verification status

### Use Case 2: Self-Verification
A learner wants to verify their downloaded certificate:
1. Upload PDF file
2. System extracts UID and computes hash
3. Compare with stored hash
4. Confirm certificate is authentic

### Use Case 3: Bulk Verification
HR department verifying multiple certificates:
1. Loop through credential UIDs
2. Call verification endpoint for each
3. Store results in database
4. Flag any revoked or invalid credentials

---

## Notes
- All endpoints are **public** (no authentication required)
- Maximum PDF file size: **10MB**
- Supported file type: **application/pdf** only
- Hash algorithm: **SHA256**
- QR codes automatically point to verification URLs
