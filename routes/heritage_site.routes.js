const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const heritageSiteController = require('../controllers/heritage_site.controller');
const importExportController = require('../controllers/importExport.controller');

// Public Routes
router.get('/', optionalProtect, heritageSiteController.getAll);
router.get('/search', heritageSiteController.search);
router.get('/nearby', heritageSiteController.getNearby);
// Export/Import
router.get('/export',
  protect,
  checkPermission('heritage_sites', 'list'), // Or import/export specific permission if available, list is good enough for now as it reads data
  (req, res, next) => {
    req.params.entity = 'heritage_sites';
    next();
  },
  importExportController.exportData
);

router.get('/stats/summary', heritageSiteController.getStats);
router.get('/:id', heritageSiteController.getById);
router.get('/:id/artifacts', heritageSiteController.getArtifacts);
router.get('/:id/timeline', heritageSiteController.getTimeline);
router.post('/:id/view', heritageSiteController.incrementView);

// Protected Routes (Researcher/Admin)
router.post('/',
  protect,
  checkPermission('heritage_sites', 'create'),
  heritageSiteController.create
);

router.put('/:id',
  protect,
  checkPermission('heritage_sites', 'update'),
  heritageSiteController.update
);

// Chỉ Admin được xóa
router.delete('/:id',
  protect,
  checkPermission('heritage_sites', 'delete'),
  heritageSiteController.delete
);

// Review Routes
router.patch('/:id/submit', protect, checkPermission('heritage_sites', 'update'), heritageSiteController.submitReview);
router.patch('/:id/approve', protect, checkPermission('heritage_sites', 'publish'), heritageSiteController.approveReview);
router.patch('/:id/reject', protect, checkPermission('heritage_sites', 'publish'), heritageSiteController.rejectReview);

module.exports = router;