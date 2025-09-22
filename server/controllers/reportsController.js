const reportService = require('../services/reportService');
const { getProfessorAnalytics } = require('../services/analyticsService');

/**
 * @route GET /api/v1/reports/overall
 * Returns overall average per evaluatee from Summary_Report
 */
async function getOverallAverages(req, res) {
  try {
    const rows = await reportService.getOverallAverages();
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getOverallAverages error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }

}

/**
 * @route GET /api/v1/reports/analytics/professor
 * Query params:
 *  - professor_user_id (required)
 *  - start_date (optional, YYYY-MM-DD)
 *  - end_date (optional, YYYY-MM-DD)
 *  - course_id_list (optional, CSV of ints, or omit for all)
 *  - min_responses (optional, default 5)
 */
async function getProfessorAnalyticsController(req, res) {
  try {
    const professor_user_id = req.query.professor_user_id || null; // allow UUID or integer
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const course_id_list = req.query.course_id_list || null; // CSV string or null
    const min_responses = req.query.min_responses ? parseInt(req.query.min_responses, 10) : 5;
    const evaluator_user_type = req.query.evaluator_user_type || null; // 'student' | 'faculty' | 'supervisor'

    const result = await getProfessorAnalytics({
      professor_user_id,
      start_date,
      end_date,
      course_id_list,
      min_responses,
      evaluator_user_type,
    });

    if (result && result.error) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('getProfessorAnalyticsController error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

/**
 * @route GET /api/v1/reports/:evaluatee_id/categories
 * Returns average per category for a specific evaluatee
 */
async function getCategoryAverages(req, res) {
  try {
    const evaluatee_id = parseInt(req.params.evaluatee_id, 10);
    if (!Number.isInteger(evaluatee_id) || evaluatee_id <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid evaluatee_id' });
    }
    const rows = await reportService.getCategoryAveragesByEvaluatee(evaluatee_id);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getCategoryAverages error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

/**
 * @route GET /api/v1/reports/top-faculty?limit=10
 * Returns top-rated faculty from Summary_Report
 */
async function getTopRatedFaculty(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const rows = await reportService.getTopRatedFaculty(limit);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getTopRatedFaculty error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = {
  getOverallAverages,
  getCategoryAverages,
  getTopRatedFaculty,
  getProfessorAnalytics: getProfessorAnalyticsController,
};
