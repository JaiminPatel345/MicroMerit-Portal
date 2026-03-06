const express = require('express');
const router = express.Router();
const { udemyCredentials } = require('../data');
const { generateCertificatePdf } = require('../pdf-generator');

/**
 * GET /udemy/:id
 * Returns credential details + PDF as base64 for a given Udemy credential ID.
 * Response uses Udemy-style field names: student_email, student_name, course_title.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const credential = udemyCredentials.find(c => c.id === id);

  if (!credential) {
    return res.status(404).json({
      success: false,
      error: `Udemy credential with ID ${id} not found`,
    });
  }

  try {
    const pdfBuffer = await generateCertificatePdf({
      issuer: 'Udemy',
      credentialId: credential.id,
      learnerName: credential.student_name,
      learnerEmail: credential.student_email,
      title: credential.course_title,
      issuedDate: credential.completion_date,
      description: credential.course_description,
    });

    return res.json({
      success: true,
      data: {
        id: credential.id,
        student_email: credential.student_email,    // Different field name intentionally
        student_name: credential.student_name,       // Different field name intentionally
        course_title: credential.course_title,       // Different field name intentionally
        completion_date: credential.completion_date, // Different field name intentionally
        course_description: credential.course_description,
        issuer: 'Udemy',
        pdf_base64: pdfBuffer.toString('base64'),
      },
    });
  } catch (err) {
    console.error('[Udemy] PDF generation failed:', err.message);
    return res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
});

module.exports = router;
