const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const formsController = require('../controllers/formsController.new');

// Public read endpoints (used by evaluator flow)
router.get('/', formsController.listForms);
router.get('/:id', formsController.getForm);

// Admin-only mutation endpoints
router.use(auth.protect);
router.use(auth.allowAdmin);

router.post('/', formsController.createForm);
router.patch('/:id', formsController.updateForm);
router.delete('/:id', formsController.deleteForm);

module.exports = router;
