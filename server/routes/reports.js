const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all report routes
router.use(authMiddleware.protect);

// Overall average per evaluatee (from Summary_Report)
router.get('/overall', reportsController.getOverallAverages);

// Average per category for a specific evaluatee
router.get('/:evaluatee_id/categories', reportsController.getCategoryAverages);

// Top-rated faculty (highest average_score in Summary_Report)
router.get('/top-faculty', reportsController.getTopRatedFaculty);

module.exports = router;
