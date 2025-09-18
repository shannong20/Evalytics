const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const usersController = require('../controllers/usersController.new');
const authMiddleware = require('../middleware/authMiddleware');
const { USER_TYPES, USER_ROLES } = require('../services/userService.new');

// Validation middleware
const validateUserId = param('id').isInt({ gt: 0 }).withMessage('Invalid user ID');

const validateCreateUser = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('userType').isIn(Object.values(USER_TYPES)).withMessage('Invalid user type'),
  body('role')
    .if((value, { req }) => req.body.userType === 'user')
    .isIn(Object.values(USER_ROLES)).withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
  body('departmentId').optional().isInt({ gt: 0 }).withMessage('Invalid department ID'),
];

const validateUpdateUser = [
  validateUserId,
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('userType').optional().isIn(Object.values(USER_TYPES)).withMessage('Invalid user type'),
  body('role')
    .optional()
    .if((value, { req }) => req.body.userType === 'user')
    .isIn(Object.values(USER_ROLES)).withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
  body('departmentId').optional().isInt({ gt: 0 }).withMessage('Invalid department ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

// Apply admin middleware to all routes except GET /me
router.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/' || req.path.endsWith('/me')) {
    return next();
  }
  authMiddleware.restrictTo('admin')(req, res, next);
});

// List users with optional filters
router.get('/', [
  // Validation
  body('userType').optional().isIn(Object.values(USER_TYPES)),
  body('role').optional().isIn(Object.values(USER_ROLES)),
  body('departmentId').optional().isInt({ gt: 0 }),
  body('isActive').optional().isBoolean(),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  body('offset').optional().isInt({ min: 0 }),
], usersController.listUsers);

// Get a single user by ID
router.get('/:id', validateUserId, usersController.getUser);

// Create a new user (admin only)
router.post('/', validateCreateUser, usersController.createUser);

// Update a user (admin only)
router.patch('/:id', validateUpdateUser, usersController.updateUser);

// Delete a user (admin only, soft delete)
router.delete('/:id', validateUserId, usersController.deleteUser);

// Specialized routes for listing user types
router.get('/faculty', usersController.listFaculty);
router.get('/students', usersController.listStudents);
router.get('/supervisors', usersController.listSupervisors);

module.exports = router;
