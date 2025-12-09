import axios from 'axios';

// Create a separate axios instance for AI service
const aiApi = axios.create({
    baseURL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001',
});

export const aiServices = {
    /**
     * Append QR code to credential PDF
     * @param {File} file - The PDF file to process
     * @param {string} qrData - The data to encode in the QR code
     * @returns {Promise<Blob>} - The modified PDF as a Blob
     */
    appendQrToCredential: async (file, qrData) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('qr_data', qrData);

            const response = await aiApi.post('/ai/append-qr', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob', // Important: receive PDF as blob
            });

            return response.data;
        } catch (error) {
            console.error('Error appending QR to credential:', error);
            throw error;
        }
    },

    /**
     * Process OCR for certificate analysis
     * @param {File} file - The certificate file (PDF/Image)
     * @param {string} learnerEmail - Learner's email
     * @param {string} certificateTitle - Title of the certificate
     * @param {string} issuerName - Name of the issuer
     * @param {Array} nsqfContext - Optional NSQF context
     * @returns {Promise<Object>} - OCR analysis results
     */
    processOCR: async (file, learnerEmail, certificateTitle, issuerName, nsqfContext = null) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('learner_email', learnerEmail);
            formData.append('certificate_title', certificateTitle);
            formData.append('issuer_name', issuerName);
            
            if (nsqfContext) {
                formData.append('nsqf_context', JSON.stringify(nsqfContext));
            }

            const response = await aiApi.post('/ai/process-ocr', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error processing OCR:', error);
            throw error;
        }
    },

    /**
     * Extract certificate ID from a certificate file
     * @param {File} file - The certificate file
     * @param {string} issuerName - Optional issuer name
     * @returns {Promise<Object>} - Certificate ID extraction result
     */
    extractCertificateId: async (file, issuerName = null) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            if (issuerName) {
                formData.append('issuer_name', issuerName);
            }

            const response = await aiApi.post('/ai/extract-certificate-id', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error extracting certificate ID:', error);
            throw error;
        }
    },

    /**
     * Get AI service health status
     * @returns {Promise<Object>} - Health check response
     */
    healthCheck: async () => {
        try {
            const response = await aiApi.get('/ai/health');
            return response.data;
        } catch (error) {
            console.error('Error checking AI service health:', error);
            throw error;
        }
    },
};
