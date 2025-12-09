/**
 * Example: How to use the AI Services for QR Code Appending
 * 
 * This example demonstrates how to use the aiServices.appendQrToCredential method
 * to add a QR code to a credential PDF from your React component.
 */

import { aiServices } from '../services/aiServices';

/**
 * Example 1: Basic usage in a React component
 */
const handleAppendQrToCredential = async (pdfFile, credentialData) => {
    try {
        // The QR data should contain the verification URL or credential ID
        const qrData = `https://micromerit.com/verify/${credentialData.id}`;
        
        // Call the AI service to append QR code
        const modifiedPdfBlob = await aiServices.appendQrToCredential(pdfFile, qrData);
        
        // Create a download link for the modified PDF
        const url = URL.createObjectURL(modifiedPdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `credential_${credentialData.id}_with_qr.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('QR code successfully added to credential!');
    } catch (error) {
        console.error('Failed to append QR code:', error);
        // Handle error - show toast/notification to user
    }
};

/**
 * Example 2: Using with file input
 */
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    
    if (!file || file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }
    
    try {
        // Generate QR data based on your credential
        const qrData = JSON.stringify({
            credentialId: 'CRED-12345',
            verificationUrl: 'https://micromerit.com/verify/CRED-12345',
            timestamp: new Date().toISOString()
        });
        
        const modifiedPdf = await aiServices.appendQrToCredential(file, qrData);
        
        // You can now upload this to your backend, or download it
        // Example: Upload to backend
        // const formData = new FormData();
        // formData.append('credential_pdf', modifiedPdf, 'credential_with_qr.pdf');
        // await credentialServices.uploadCredential(formData);
        
        // Or download it directly
        const url = URL.createObjectURL(modifiedPdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modified_${file.name}`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error processing PDF:', error);
    }
};

/**
 * Example 3: Integration with credential issuance flow
 */
const issueCredentialWithQr = async (credentialData, originalPdf) => {
    try {
        // Step 1: Issue credential and get credential ID from backend
        const issuedCredential = await credentialServices.issueCredential(credentialData);
        
        // Step 2: Generate QR data with blockchain transaction hash and verification URL
        const qrData = JSON.stringify({
            credentialId: issuedCredential.id,
            transactionHash: issuedCredential.blockchain_tx_hash,
            verificationUrl: `https://micromerit.com/verify/${issuedCredential.uid}`,
            ipfsCid: issuedCredential.ipfs_cid
        });
        
        // Step 3: Add QR code to PDF
        const pdfWithQr = await aiServices.appendQrToCredential(originalPdf, qrData);
        
        // Step 4: Upload the modified PDF back to your system
        const formData = new FormData();
        formData.append('credential_id', issuedCredential.id);
        formData.append('pdf_file', pdfWithQr, `credential_${issuedCredential.uid}.pdf`);
        
        // await credentialServices.updateCredentialPdf(formData);
        
        console.log('Credential issued with QR code successfully!');
        return issuedCredential;
    } catch (error) {
        console.error('Failed to issue credential with QR:', error);
        throw error;
    }
};

/**
 * Example 4: React component with state management
 */
const CredentialQrComponent = () => {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState(null);
    
    const processCredentialPdf = async (file, credentialId) => {
        setIsProcessing(true);
        setError(null);
        
        try {
            const qrData = `https://micromerit.com/verify/${credentialId}`;
            const modifiedPdf = await aiServices.appendQrToCredential(file, qrData);
            
            // Download the file
            const url = URL.createObjectURL(modifiedPdf);
            const link = document.createElement('a');
            link.href = url;
            link.download = `credential_${credentialId}_with_qr.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div>
            <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => processCredentialPdf(e.target.files[0], 'CRED-123')}
                disabled={isProcessing}
            />
            {isProcessing && <p>Processing PDF...</p>}
            {error && <p style={{color: 'red'}}>Error: {error}</p>}
        </div>
    );
};

export {
    handleAppendQrToCredential,
    handleFileUpload,
    issueCredentialWithQr,
    CredentialQrComponent
};
