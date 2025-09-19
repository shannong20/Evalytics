const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController.new');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no auth)
router.get('/public', questionsController.listQuestionsPublic);
router.get('/public/form/:formId', questionsController.listQuestionsByFormPublic);

// Protect the routes below
router.use(authMiddleware.protect);

/**
 * @route   GET /api/v1/questions/with-categories
 * @desc    Get all question categories with their associated questions
 * @access  Private
 */
router.get('/with-categories', questionsController.getCategoriesWithQuestions);

/**
 * @route   GET /api/v1/questions
 * @desc    List all questions (admin)
 * @access  Private (admin)
 */
router.get('/', authMiddleware.allowAdmin, questionsController.listQuestions);

/**
 * @route   POST /api/v1/questions
 * @desc    Create a new question (admin)
 * @access  Private (admin)
 */
router.post('/', authMiddleware.allowAdmin, questionsController.createQuestion);

/**
 * @route   PATCH /api/v1/questions/:id
 * @desc    Update a question (admin)
 * @access  Private (admin)
 */
router.patch('/:id', authMiddleware.allowAdmin, questionsController.updateQuestion);

/**
 * @route   DELETE /api/v1/questions/:id
 * @desc    Delete a question (admin)
 * @access  Private (admin)
 */
router.delete('/:id', authMiddleware.allowAdmin, questionsController.deleteQuestion);

module.exports = router;
