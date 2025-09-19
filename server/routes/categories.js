const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

// Public list
router.get('/public', categoriesController.listCategoriesPublic);

// Protected (admin) list
router.use(authMiddleware.protect);
router.get('/', authMiddleware.restrictTo('admin'), categoriesController.listCategories);

module.exports = router;
