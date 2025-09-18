const express = require('express');
const router = express.Router();
const departmentsController = require('../controllers/departmentsController');

// Public endpoint to list departments (no auth for signup use)
router.get('/', departmentsController.listDepartments);

module.exports = router;
