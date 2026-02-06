const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const historyController = require('../controllers/history.controller');
const importExportController = require('../controllers/importExport.controller');

// Export/Import (MUST come before /:id)
// Export/Import (MUST come before /:id)
router.get('/export',
  protect,
  checkPermission('history_articles', 'list'),
  (req, res, next) => {
    req.params.entity = 'history_articles';
    next();
  },
  importExportController.exportData
);

router.post('/import',
  protect,
  checkPermission('history_articles', 'create'),
  importExportController.getUploadMiddleware(),
  (req, res, next) => {
    req.params.entity = 'history_articles';
    next();
  },
  importExportController.importData
);

router.get('/template',
  protect,
  (req, res, next) => {
    req.params.entity = 'history_articles';
    next();
  },
  importExportController.downloadTemplate
);

// Public Routes
router.get('/', optionalProtect, historyController.getAll);
router.get('/stats/summary', historyController.getStats);
router.get('/:id', historyController.getById);
router.get('/:id/related', historyController.getRelated);
router.post('/:id/view', historyController.incrementView);

// Protected Routes (Researcher/Admin)
router.post('/',
  protect,
  checkPermission('history_articles', 'create'), // Ensure this permission exists or use a generic one like 'articles'
  historyController.create
);

router.put('/:id',
  protect,
  checkPermission('history_articles', 'update'),
  historyController.update
);

router.delete('/:id',
  protect,
  checkPermission('history_articles', 'delete'),
  historyController.delete
);

// Review Routes
router.patch('/:id/submit', protect, checkPermission('history_articles', 'update'), historyController.submitReview);
router.patch('/:id/revert', protect, checkPermission('history_articles', 'update'), historyController.revertToDraft);
router.patch('/:id/approve', protect, checkPermission('history_articles', 'publish'), historyController.approveReview);
router.patch('/:id/reject', protect, checkPermission('history_articles', 'publish'), historyController.rejectReview);

module.exports = router;

// Trigger restart for data reload
