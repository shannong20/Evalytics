require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const evaluationsRoutes = require('./routes/evaluations');
const usersRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend to access the API
  credentials: true
}));
app.use(express.json());

// Test database connection
require('./config/db');

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/users', usersRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found' } });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { message: 'Something went wrong!' } });
});

// Start server
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
