const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const artifactController = require('../controllers/artifact.controller');
const importExportController = require('../controllers/importExport.controller');

// Export/Import (MUST come before /:id)
router.get('/export',
    protect,
    checkPermission('artifacts', 'list'),
    (req, res, next) => {
        req.params.entity = 'artifacts';
        next();
    },
    importExportController.exportData
);

router.post('/import',
    protect,
    checkPermission('artifacts', 'create'),
    importExportController.getUploadMiddleware(),
    (req, res, next) => {
        req.params.entity = 'artifacts';
        next();
    },
    importExportController.importData
);

router.get('/template',
    protect,
    (req, res, next) => {
        req.params.entity = 'artifacts';
        next();
    },
    importExportController.downloadTemplate
);

router.get('/', optionalProtect, artifactController.getAll);
router.get('/search', artifactController.search);
router.get('/stats/summary', artifactController.getStats);
router.get('/:id', artifactController.getById);
router.get('/:id/related', artifactController.getRelated);
router.post('/:id/view', artifactController.incrementView);

router.post('/', protect, checkPermission('artifacts', 'create'), artifactController.create);
router.put('/:id', protect, checkPermission('artifacts', 'update'), artifactController.update);
router.delete('/:id', protect, checkPermission('artifacts', 'delete'), artifactController.delete);

// Review Routes
router.patch('/:id/submit', protect, checkPermission('artifacts', 'update'), artifactController.submitReview);
router.patch('/:id/revert', protect, checkPermission('artifacts', 'update'), artifactController.revertToDraft);
router.patch('/:id/approve', protect, checkPermission('artifacts', 'publish'), artifactController.approveReview);
router.patch('/:id/reject', protect, checkPermission('artifacts', 'publish'), artifactController.rejectReview);

module.exports = router;
