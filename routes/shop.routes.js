const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const { protect: auth } = require('../middleware/auth.middleware');
const { check } = require('express-validator');

// @route   GET api/shop
// @desc    Get all shop items
// @access  Public (or Private? Let's make it Public to view, Private to buy)
router.get('/', shopController.getShopItems);

// @route   GET api/shop/inventory
// @desc    Get user inventory
// @access  Private
router.get('/inventory', auth, shopController.getUserInventory);

// @route   POST api/shop/buy
// @desc    Buy an item
// @access  Private
router.post(
  '/buy',
  [
    auth,
    [
      check('itemId', 'Item ID is required').not().isEmpty(),
      check('quantity', 'Quantity must be at least 1').isInt({ min: 1 })
    ]
  ],
  shopController.buyItem
);

module.exports = router;
