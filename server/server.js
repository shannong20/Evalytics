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
const reportsRoutes = require('./routes/reports');
const departmentsRoutes = require('./routes/departments');

// Import middleware
const { isLoggedIn } = require('./middleware/authMiddleware');

// Initialize Express app
const app = express();

// Create a router for protected routes
const protectedRouter = express.Router();

// Debug middleware for protected routes
protectedRouter.use((req, res, next) => {
  console.log(`[PROTECTED ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// Apply isLoggedIn middleware to all routes on the protected router
protectedRouter.use((req, res, next) => {
  console.log('[PROTECTED ROUTE] Checking authentication...');
  // Call the actual isLoggedIn middleware
  isLoggedIn(req, res, next);
});

// Trust proxy if behind a reverse proxy (e.g., nginx, Heroku)
app.enable('trust proxy');

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  console.log('  Query:', JSON.stringify(req.query, null, 2));
  console.log('  Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-type'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-type']
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


// Public routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// Make department search public
app.use(`${API_PREFIX}/departments/search`, (req, res, next) => {
  // Create a new request object that points to the departments controller
  req.url = req.url.replace(/^\/api\/v1\/departments/, '');
  departmentsRoutes(req, res, next);
});

// Protected routes (require authentication)
console.log('[SERVER] Registering protected routes...');

// Mount the protected router with the API prefix
console.log(`[SERVER] Mounting protected router at ${API_PREFIX}`);

// Register routes on the protected router
protectedRouter.use('/users', usersRoutes);
protectedRouter.use('/questions', questionsRoutes);
protectedRouter.use('/evaluations', evaluationsRoutes);
protectedRouter.use('/reports', reportsRoutes);
protectedRouter.use('/departments', departmentsRoutes);

// Mount the protected router under the API prefix
app.use(API_PREFIX, protectedRouter);
console.log('[SERVER] All protected routes registered and mounted');

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
