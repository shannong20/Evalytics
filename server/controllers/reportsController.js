const reportService = require('../services/reportService');

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
};
