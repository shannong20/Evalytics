const express = require('express');
const router = express.Router();
const departmentsController = require('../controllers/departmentsController');

// Middleware to disable caching
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

// Public endpoints for departments
router.get('/', noCache, departmentsController.listDepartments);

// Search endpoint - this will be mounted at /api/v1/departments/search
router.get('/search', noCache, async (req, res, next) => {
  try {
    console.log('Search endpoint hit with query:', req.query);
    // Call the controller and await its response
    await departmentsController.findDepartmentByName(req, res, next);
  } catch (error) {
    console.error('Error in department search:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during department search'
    });
  }
});

module.exports = router;
