const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Input validation middleware
const validateSignup = [
  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role').optional().isString().withMessage('Role must be a string'),
  body('department')
    .if(body('role').custom((val) => true))
    .custom((value, { req }) => {
      const r = (req.body.role || '').toString().trim().toLowerCase();
      if (r === 'faculty' || r === 'supervisor') {
        if (!value || !String(value).trim()) {
          throw new Error('Department is required for Faculty and Supervisor');
        }
      }
      return true;
    }),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
];

// Routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);

module.exports = router;
