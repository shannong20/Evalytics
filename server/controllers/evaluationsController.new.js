const evaluationService = require('../services/evaluationService');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/v1/evaluations
 * @desc    Submit a new evaluation
 * @access  Private
 */
const submitEvaluation = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  // The evaluator is the currently authenticated user
  const evaluator_id = req.user.user_id;
  const { evaluatee_id, course_id, responses, form_id } = req.body;

  try {
    const result = await evaluationService.submitEvaluation({
      evaluator_id,
      evaluatee_id,
      course_id,
      responses,
      form_id,
      comments: req.body.comments,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Evaluation submitted successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);

    // Use status from service error if available
    const statusCode = error.status || 500;

    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'An internal server error occurred while submitting the evaluation.',
    });
  }
};

module.exports = {
  submitEvaluation,
};
