const PDFDocument = require('pdfkit');

/**
 * Generates a simple certificate-style PDF as a Buffer.
 * @param {Object} params
 * @param {string} params.issuer - Issuer name (e.g. "Google")
 * @param {string} params.credentialId - Credential/course ID
 * @param {string} params.learnerName - Learner's full name
 * @param {string} params.learnerEmail - Learner's email
 * @param {string} params.title - Certificate/course title
 * @param {string} params.issuedDate - ISO date string
 * @param {string} [params.description] - Optional description
 * @returns {Promise<Buffer>}
 */
function generateCertificatePdf({ issuer, credentialId, learnerName, learnerEmail, title, issuedDate, description }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Border ──────────────────────────────────────────────────────────
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#4A90D9');
    doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke('#4A90D9');

    // ── Header ──────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#888888').text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(26).fillColor('#2c3e50').font('Helvetica-Bold')
      .text(issuer, { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#888888').font('Helvetica')
      .text('hereby certifies that', { align: 'center' });

    // ── Learner Name ─────────────────────────────────────────────────────
    doc.moveDown(0.6);
    doc.fontSize(22).fillColor('#4A90D9').font('Helvetica-Bold')
      .text(learnerName, { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#555555').font('Helvetica')
      .text(learnerEmail, { align: 'center' });

    // ── Course title ─────────────────────────────────────────────────────
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor('#888888').font('Helvetica')
      .text('has successfully completed', { align: 'center' });

    doc.moveDown(0.4);
    doc.fontSize(16).fillColor('#2c3e50').font('Helvetica-Bold')
      .text(title, { align: 'center' });

    // ── Description ──────────────────────────────────────────────────────
    if (description) {
      doc.moveDown(0.8);
      doc.fontSize(10).fillColor('#666666').font('Helvetica')
        .text(description, { align: 'center', width: 450, lineGap: 3 });
    }

    // ── Divider ──────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // ── Metadata row ─────────────────────────────────────────────────────
    const labelY = doc.y;
    const col1X = 100;
    const col2X = doc.page.width / 2;

    doc.fontSize(9).fillColor('#888888').font('Helvetica')
      .text('CREDENTIAL ID', col1X, labelY)
      .text('DATE OF ISSUE', col2X, labelY);

    doc.fontSize(11).fillColor('#2c3e50').font('Helvetica-Bold')
      .text(String(credentialId), col1X, labelY + 16)
      .text(issuedDate, col2X, labelY + 16);

    // ── Footer ───────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#aaaaaa').font('Helvetica')
      .text(`This certificate was issued by ${issuer} via MicroMerit Portal.`, {
        align: 'center',
        y: doc.page.height - 70,
      });

    doc.end();
  });
}

module.exports = { generateCertificatePdf };
