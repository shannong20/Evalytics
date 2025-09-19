const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const coursesController = require('../controllers/coursesController');

// Protect all course routes
router.use(authMiddleware.protect);

// GET /api/v1/courses?evaluateeId=123
router.get('/', coursesController.listByEvaluatee);

module.exports = router;
