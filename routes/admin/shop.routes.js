/**
 * routes/admin/shop.routes.js
 * Admin routes for managing shop items (CMS)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/rbac.middleware');
const shopCMSController = require('../../controllers/shop_cms.controller');

// Require login and 'game_content' permission
router.use(protect, checkPermission('game_content', 'read'));

// ==================== CRUD ====================
router.get('/', shopCMSController.getAllItems);
router.get('/:id', shopCMSController.getItemById);
router.post('/', checkPermission('game_content', 'create'), shopCMSController.createItem);
router.put('/:id', checkPermission('game_content', 'update'), shopCMSController.updateItem);
router.delete('/:id', checkPermission('game_content', 'delete'), shopCMSController.deleteItem);

module.exports = router;
