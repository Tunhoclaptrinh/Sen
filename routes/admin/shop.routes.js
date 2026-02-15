const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/shop.controller');
const { checkPermission } = require('../../middleware/rbac.middleware');

// All routes here are already protected by 'protect' and 'game_content/read' in admin/index.js
// We add more specific write permissions for POST/PUT/DELETE

// @route   GET api/admin/shop
// @desc    Get all shop items for management
router.get('/', shopController.getShopItems);

// @route   POST api/admin/shop
// @desc    Create a new shop item
router.post(
  '/',
  checkPermission('game_content', 'create'),
  shopController.createShopItem
);

// @route   PUT api/admin/shop/:id
// @desc    Update a shop item
router.put(
  '/:id',
  checkPermission('game_content', 'update'),
  shopController.updateShopItem
);

// @route   DELETE api/admin/shop/:id
// @desc    Delete a shop item
router.delete(
  '/:id',
  checkPermission('game_content', 'delete'),
  shopController.deleteShopItem
);

module.exports = router;
