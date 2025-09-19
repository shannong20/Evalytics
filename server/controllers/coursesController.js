const courseService = require('../services/courseService');

/**
 * GET /api/v1/courses?evaluateeId=123
 * Returns courses for the evaluatee's department
 */
async function listByEvaluatee(req, res) {
  try {
    const raw = (req.query.evaluateeId || req.query.evaluatee_id || '').toString();
    const evaluateeId = Number(raw);
    if (!Number.isInteger(evaluateeId) || evaluateeId <= 0) {
      return res.status(400).json({ status: 'error', message: 'A valid evaluateeId query parameter is required' });
    }

    const courses = await courseService.listCoursesByEvaluatee(evaluateeId);
    return res.status(200).json({ status: 'success', data: courses });
  } catch (error) {
    console.error('Error listing courses by evaluatee:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { listByEvaluatee };
