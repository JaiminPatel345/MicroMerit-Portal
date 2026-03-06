const express = require('express');
const router = express.Router();
const { jaiminCredentials } = require('../data');
const { generateCertificatePdf } = require('../pdf-generator');

/**
 * GET /jaimin/:id
 * Returns credential details + PDF as base64 for a given Jaimin credential ID.
 * Response uses Jaimin-style field names: trainee_email, trainee_name, program_name.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const credential = jaiminCredentials.find(c => c.id === id);

  if (!credential) {
    return res.status(404).json({
      success: false,
      error: `Jaimin credential with ID ${id} not found`,
    });
  }

  try {
    const pdfBuffer = await generateCertificatePdf({
      issuer: 'Jaimin Pvt Ltd',
      credentialId: credential.id,
      learnerName: credential.trainee_name,
      learnerEmail: credential.trainee_email,
      title: credential.program_name,
      issuedDate: credential.awarded_on,
      description: credential.program_desc,
    });

    return res.json({
      success: true,
      data: {
        id: credential.id,
        trainee_email: credential.trainee_email,  // Different field name intentionally
        trainee_name: credential.trainee_name,     // Different field name intentionally
        program_name: credential.program_name,     // Different field name intentionally
        awarded_on: credential.awarded_on,          // Different field name intentionally
        program_desc: credential.program_desc,
        issuer: 'Jaimin Pvt Ltd',
        pdf_base64: pdfBuffer.toString('base64'),
      },
    });
  } catch (err) {
    console.error('[Jaimin] PDF generation failed:', err.message);
    return res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
});

module.exports = router;
