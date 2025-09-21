const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const questionsController = require('../controllers/questionsController.new');
const authMiddleware = require('../middleware/authMiddleware');

console.log('[QUESTIONS ROUTE] Initializing questions routes...');

// Temporarily disable auth for testing
console.log('[QUESTIONS ROUTE] WARNING: Authentication is temporarily disabled for testing');

// Protect all routes in this file
// router.use(authMiddleware.protect);

// Validation middleware for creating a question
const validateQuestion = [
  body('text')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Question text must be at least 5 characters long')
    .isLength({ max: 1000 })
    .withMessage('Question text cannot exceed 1000 characters'),
  
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isInt()
    .withMessage('Category ID must be an integer'),
    
  body('is_required')
    .optional()
    .isBoolean()
    .withMessage('is_required must be a boolean'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * @route   POST /api/v1/questions
 * @desc    Create a new question
 * @access  Private
 */
router.post('/', validateQuestion, (req, res, next) => {
  console.log('[QUESTIONS ROUTE] Handling POST / request');
  return questionsController.createQuestion(req, res, next);
});

/**
 * @route   GET /api/v1/questions/questions-with-categories
 * @desc    Get all question categories with their associated questions
 * @access  Private
 */
router.get('/questions-with-categories', (req, res, next) => {
  console.log('[QUESTIONS ROUTE] Handling /questions-with-categories request');
  return questionsController.getCategoriesWithQuestions(req, res, next);
});

console.log('[QUESTIONS ROUTE] Questions routes initialized');

module.exports = router;
