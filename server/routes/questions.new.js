const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController.new');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(authMiddleware.protect);

/**
 * @route   GET /api/v1/questions/with-categories
 * @desc    Get all question categories with their associated questions
 * @access  Private
 */
router.get('/with-categories', questionsController.getCategoriesWithQuestions);

module.exports = router;
