const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const evaluationsController = require('../controllers/evaluationsController.new');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(authMiddleware.protect);

// Validation rules for the evaluation submission
const submissionValidationRules = [
  body('evaluatee_id')
    .isInt({ gt: 0 })
    .withMessage('A valid evaluatee_id is required.'),
  body('course_id')
    .isInt({ gt: 0 })
    .withMessage('A valid course_id is required.'),
  body('form_id')
    .isInt({ gt: 0 })
    .withMessage('A valid form_id is required.'),
  body('responses')
    .isArray({ min: 1 })
    .withMessage('The `responses` array must not be empty.'),
  body('responses.*.question_id')
    .isInt({ gt: 0 })
    .withMessage('Each response must have a valid question_id.'),
  body('responses.*.rating')
    .isNumeric()
    .withMessage('Each response must have a numeric rating.'),
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string if provided.'),
];

/**
 * @route   POST /api/v1/evaluations
 * @desc    Submit a new evaluation
 * @access  Private
 */
router.post('/', submissionValidationRules, evaluationsController.submitEvaluation);

module.exports = router;
