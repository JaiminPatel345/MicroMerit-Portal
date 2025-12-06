const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 8003;
const FORWARD_URL = 'http://localhost:3000/auth/learner/oauth/digilocker/callback';

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle all HTTP methods on /doc.php
app.all('/doc.php', async (req, res) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Query Parameters:', req.query);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('======================\n');

    try {
        // Build the forward URL with query parameters
        const queryString = new URLSearchParams(req.query).toString();
        const forwardUrl = queryString ? `${FORWARD_URL}?${queryString}` : FORWARD_URL;

        console.log('Forwarding to:', forwardUrl);

        // Forward the request
        const response = await axios({
            method: req.method,
            url: forwardUrl,
            params: req.query,
            data: req.body,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            validateStatus: () => true, // Accept any status code
        });

        console.log('\n=== Response from target ===');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('===========================\n');

        // Send back the response from the target
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error forwarding request:', error.message);
        res.status(500).json({
            error: 'Failed to forward request',
            message: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 OAuth redirect server running on http://localhost:${PORT}`);
    console.log(`📍 Listening for requests on http://localhost:${PORT}/doc.php`);
    console.log(`📤 Forwarding to ${FORWARD_URL}`);
});