const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const artifactController = require('../controllers/artifact.controller');
const { validateSchema } = require('../middleware/validation.middleware');

// Public routes
router.get('/', artifactController.getAll);
router.get('/search', artifactController.search);
router.get('/site/:siteId', artifactController.getByHeritageSite);
router.get('/category/:categoryId', artifactController.getByCategory);
router.get('/:id', artifactController.getById);

// Protected routes (Researchers & Admin)
router.post('/',
  protect,
  authorize('admin', 'researcher'),
  validateSchema('artifact'),
  artifactController.create
);

router.put('/:id',
  protect,
  authorize('admin', 'researcher'),
  validateSchema('artifact'),
  artifactController.update
);

router.delete('/:id',
  protect,
  authorize('admin'),
  artifactController.delete
);

module.exports = router;