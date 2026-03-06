const express = require('express');
const cors = require('cors');

const googleRoutes = require('./routes/google');
const udemyRoutes = require('./routes/udemy');
const jaiminRoutes = require('./routes/jaimin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dummy Issuer Server running', port: PORT });
});

// Issuer routes
app.use('/google', googleRoutes);
app.use('/udemy', udemyRoutes);
app.use('/jaimin', jaiminRoutes);

// List all available credentials index
app.get('/', (req, res) => {
  res.json({
    message: 'MicroMerit Dummy Issuer Server',
    issuers: {
      google: {
        description: 'Google Certificates',
        endpoint: 'GET /google/:id',
        example: '/google/1',
        ids: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        fieldNames: { email: 'learner_email', name: 'learner_name', title: 'title', date: 'issued_date' },
      },
      udemy: {
        description: 'Udemy Course Completions',
        endpoint: 'GET /udemy/:id',
        example: '/udemy/1',
        ids: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        fieldNames: { email: 'student_email', name: 'student_name', title: 'course_title', date: 'completion_date' },
      },
      jaimin: {
        description: 'Jaimin Pvt Ltd Training',
        endpoint: 'GET /jaimin/:id',
        example: '/jaimin/1',
        ids: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        fieldNames: { email: 'trainee_email', name: 'trainee_name', title: 'program_name', date: 'awarded_on' },
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

app.listen(PORT, () => {
  console.log(`✅  Dummy Issuer Server running at http://localhost:${PORT}`);
  console.log(`   Google:  http://localhost:${PORT}/google/:id  (IDs 1-10)`);
  console.log(`   Udemy:   http://localhost:${PORT}/udemy/:id   (IDs 1-10)`);
  console.log(`   Jaimin:  http://localhost:${PORT}/jaimin/:id  (IDs 1-10)`);
});

module.exports = app;
