const express = require('express');
const router = express.Router();
const { googleCredentials } = require('../data');
const { generateCertificatePdf } = require('../pdf-generator');

/**
 * GET /google/:id
 * Returns credential details + PDF as base64 for a given Google credential ID.
 * Response uses Google-style field names: learner_email, learner_name, title.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const credential = googleCredentials.find(c => c.id === id);

  if (!credential) {
    return res.status(404).json({
      success: false,
      error: `Google credential with ID ${id} not found`,
    });
  }

  try {
    const pdfBuffer = await generateCertificatePdf({
      issuer: 'Google',
      credentialId: credential.id,
      learnerName: credential.learner_name,
      learnerEmail: credential.learner_email,
      title: credential.title,
      issuedDate: credential.issued_date,
      description: credential.description,
    });

    return res.json({
      success: true,
      data: {
        id: credential.id,
        learner_email: credential.learner_email,
        learner_name: credential.learner_name,
        title: credential.title,
        issued_date: credential.issued_date,
        description: credential.description,
        issuer: 'Google',
        pdf_base64: pdfBuffer.toString('base64'),
      },
    });
  } catch (err) {
    console.error('[Google] PDF generation failed:', err.message);
    return res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
});

module.exports = router;
