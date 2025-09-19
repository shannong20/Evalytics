require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.new');
const usersRoutes = require('./routes/users.new');
const questionsRoutes = require('./routes/questions.new');
const evaluationsRoutes = require('./routes/evaluations.new');
const coursesRoutes = require('./routes/courses');
const reportsRoutes = require('./routes/reports');
const departmentsRoutes = require('./routes/departments');
const categoriesRoutes = require('./routes/categories');

// Import middleware
const { isLoggedIn } = require('./middleware/authMiddleware');

// Initialize Express app
const app = express();

// Trust proxy if behind a reverse proxy (e.g., nginx, Heroku)
app.enable('trust proxy');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
require('./config/db');

// API routes
const API_PREFIX = '/api/v1';

// Authentication routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// User management routes
app.use(`${API_PREFIX}/users`, usersRoutes);

// Other API routes
// Mount the new questions routes
app.use(`${API_PREFIX}/questions`, questionsRoutes);

// Deprecate old questions routes if necessary, or remove them.
// For now, we are replacing it directly.
app.use(`${API_PREFIX}/evaluations`, evaluationsRoutes);
app.use(`${API_PREFIX}/courses`, coursesRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/departments`, departmentsRoutes);
app.use(`${API_PREFIX}/categories`, categoriesRoutes);

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler for API routes
app.all(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API: http://localhost:${PORT}${API_PREFIX}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (for Heroku, etc.)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = app;

module.exports = app;
