const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { createQuestion, listQuestions, listQuestionsPublic, listQuestionsByFormPublic } = require('../controllers/questionsController');

// GET /api/questions
router.get('/', requireAdmin, listQuestions);

// Public listing for clients to fetch questions (optional ?category=Commitment)
router.get('/public', listQuestionsPublic);

// Public listing of questions by form (build evaluations from question bank)
router.get('/public/form/:formId', listQuestionsByFormPublic);

// POST /api/questions
router.post('/', requireAdmin, createQuestion);

module.exports = router;
