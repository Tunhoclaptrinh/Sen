const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const exhibitionController = require('../controllers/exhibition.controller');
const { validateSchema } = require('../middleware/validation.middleware');

// Public routes
router.get('/', exhibitionController.getAll);
router.get('/active', exhibitionController.getActive);
router.get('/:id', exhibitionController.getById);

// Protected routes
router.post('/',
  protect,
  authorize('admin', 'curator'),
  validateSchema('exhibition'),
  exhibitionController.create
);

router.put('/:id',
  protect,
  authorize('admin', 'curator'),
  validateSchema('exhibition'),
  exhibitionController.update
);

router.delete('/:id',
  protect,
  authorize('admin'),
  exhibitionController.delete
);

module.exports = router;