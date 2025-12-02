
/**
 * routes/admin/level.routes.js
 * Admin routes để quản lý levels (CMS)
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth.middleware');
const levelCMSController = require('../../controllers/level_cms.controller');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// ==================== TEMPLATES & HELPERS ====================
router.get('/templates', levelCMSController.getTemplates);
router.get('/stats', levelCMSController.getStats);
router.post('/validate', levelCMSController.validateLevel);

// ==================== CRUD ====================
router.get('/', levelCMSController.getAllLevels);
router.get('/:id', levelCMSController.getLevelDetail);
router.get('/:id/preview', levelCMSController.previewLevel);
router.get('/:id/assets', levelCMSController.getUsedAssets);

router.post('/', levelCMSController.createLevel);
router.put('/:id', levelCMSController.updateLevel);
router.delete('/:id', levelCMSController.deleteLevel);

// ==================== ADVANCED OPERATIONS ====================
router.post('/:id/clone', levelCMSController.cloneLevel);
router.post('/bulk/import', levelCMSController.bulkImport);
router.put('/chapters/:chapterId/reorder', levelCMSController.reorderLevels);

module.exports = router;
