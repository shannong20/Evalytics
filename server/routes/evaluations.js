const express = require('express');
const router = express.Router();
const { createEvaluation, submitEvaluation, getEvaluationsByFaculty } = require('../controllers/evaluationsController');

// Structured endpoint (primary):
// POST /api/evaluations -> create response + answers
router.post('/', submitEvaluation);

// Legacy endpoint: JSONB-only submission (kept for backward compatibility)
// POST /api/evaluations/submissions
router.post('/submissions', createEvaluation);

// GET /api/evaluations/:facultyId -> responses for a faculty including answers
router.get('/:facultyId(\\d+)', getEvaluationsByFaculty);

module.exports = router;
