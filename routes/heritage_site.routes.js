const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const heritageSiteController = require('../controllers/heritage_site.controller');
const importExportController = require('../controllers/importExport.controller');

// Public Routes
router.get('/', heritageSiteController.getAll);
router.get('/search', heritageSiteController.search);
router.get('/nearby', heritageSiteController.getNearby);
// Export/Import
router.get('/export',
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

module.exports = router;