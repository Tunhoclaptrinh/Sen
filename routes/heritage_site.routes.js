const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const heritageSiteController = require('../controllers/heritage_site.controller');
const { validateSchema } = require('../middleware/validation.middleware');

// Public routes
router.get('/', heritageSiteController.getAll);
router.get('/search', heritageSiteController.search);
router.get('/nearby', heritageSiteController.nearbyHeritageSites);
router.get('/period/:period', heritageSiteController.getByPeriod);
router.get('/timeline/:id', heritageSiteController.getTimeline);
router.get('/:id', heritageSiteController.getById);

// Protected routes
router.post('/',
  protect,
  authorize('admin'),
  validateSchema('heritage_site'),
  heritageSiteController.create
);

router.put('/:id',
  protect,
  authorize('admin'),
  validateSchema('heritage_site'),
  heritageSiteController.update
);

router.delete('/:id',
  protect,
  authorize('admin'),
  heritageSiteController.delete
);

module.exports = router;