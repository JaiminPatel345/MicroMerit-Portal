// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Dummy issuer backend running' });
});

/**
 * POST /api/issue
 * Receives: file, learner_email, certificate_title, issued_at?, ai_extracted_data?
 */
app.post(
  '/api/issue',
  upload.single('file'),
  async (req, res) => {
    try {
      const {
        learner_email,
        certificate_title,
        issued_at,
        ai_extracted_data,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'PDF file is required' });
      }
      if (!learner_email || !certificate_title) {
        return res.status(400).json({ success: false, message: 'learner_email and certificate_title are required' });
      }

      const form = new FormData();
      form.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      form.append('learner_email', learner_email);
      form.append('certificate_title', certificate_title);

      // if (issued_at) form.append('issued_at', issued_at);
      if (ai_extracted_data) form.append('ai_extracted_data', ai_extracted_data);

      const response = await axios.post(
        `${process.env.MICROMERIT_BASE_URL}/credentials/api/issue`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-api-key': process.env.MICROMERIT_API_KEY,
          },
        },
      );

      // Just forward MicroMerit response back to frontend
      res.status(response.status).json(response.data);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to issue credential',
        error: err?.response?.data || err.message,
      });
    }
  },
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Dummy issuer backend listening on port ${PORT}`);
});
