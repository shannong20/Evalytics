const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController.new');
const authMiddleware = require('../middleware/authMiddleware');

// Debug middleware for auth routes
router.use((req, res, next) => {
  console.log(`[AUTH ROUTE] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  console.log('  Cookies:', req.cookies);
  console.log('  Authenticated User:', req.user ? `ID: ${req.user.id}` : 'None');
  
  // Log request body for non-GET requests
  if (req.method !== 'GET' && req.body) {
    console.log('  Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log query parameters if any
  if (Object.keys(req.query).length > 0) {
    console.log('  Query Params:', JSON.stringify(req.query, null, 2));
  }
  
  next();
});

// Validation middleware
const validateSignup = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('middleInitial')
    .optional({ checkFalsy: true, nullable: true })
    .trim()
    .isLength({ max: 1 })
    .withMessage('Middle initial must be a single character'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  // Accept userType case-insensitively and validate against lowercase set
  body('userType')
    .optional({ nullable: true })
    .customSanitizer(v => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    .isIn(Object.values(authController.USER_TYPES).map(v => (typeof v === 'string' ? v.toLowerCase() : v)))
    .withMessage(`userType must be one of: ${Object.values(authController.USER_TYPES).join(', ')}`),
  // Accept role case-insensitively and only require/validate when userType is 'User'
  body('role')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer(v => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    .custom((value, { req }) => {
      const typeLc = (req.body.userType || '').toString().trim().toLowerCase();
      const roleLc = (value || '').toString().trim().toLowerCase();
      const allowedRolesLc = Object.values(authController.USER_ROLES).map(v => (typeof v === 'string' ? v.toLowerCase() : v));
      if (typeLc === 'user') {
        if (!roleLc) {
          throw new Error('Role is required when userType is User');
        }
        if (!allowedRolesLc.includes(roleLc)) {
          throw new Error(`Role must be one of: ${Object.values(authController.USER_ROLES).join(', ')}`);
        }
      }
      // When admin, role can be null/empty and will be ignored downstream
      return true;
    }),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
];

const validateChangePassword = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);

// Protected routes (require authentication)
router.use(authMiddleware.protect);

// Get current user's profile
router.get('/me', authController.getProfile);

// Update current user's profile
router.patch('/me', [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('middleInitial')
    .optional({ checkFalsy: true, nullable: true })
    .trim()
    .isLength({ max: 1 })
    .withMessage('Middle initial must be a single character'),
], authController.updateProfile);

// Change password
router.post('/change-password', validateChangePassword, authController.changePassword);

module.exports = router;
