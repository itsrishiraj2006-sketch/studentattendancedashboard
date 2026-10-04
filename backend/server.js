const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
const studentsRoutes = require('./routes/students');
const subjectsRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/students', studentsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Student Attendance Dashboard Backend running on port ${PORT}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/dashboard`);
  console.log(`========================================================`);
});
