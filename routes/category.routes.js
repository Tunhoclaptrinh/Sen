const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');
const { validateSchema } = require('../middleware/validation.middleware');

// Public
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Admin only
router.post('/',
  protect,
  authorize('admin'),
  validateSchema('cultural_category'),
  categoryController.create
);

router.put('/:id',
  protect,
  authorize('admin'),
  validateSchema('cultural_category'),
  categoryController.update
);

router.delete('/:id',
  protect,
  authorize('admin'),
  categoryController.delete
);

module.exports = router;