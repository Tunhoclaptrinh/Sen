const shopService = require('../services/shop.service');
const { validationResult } = require('express-validator');

exports.getShopItems = async (req, res) => {
  try {
    const result = await shopService.getShopItems(req.parsedQuery);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.buyItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { itemId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const result = await shopService.buyItem(userId, itemId, quantity);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    if (err.message === 'Insufficient funds' || err.message === 'Item not found') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};

exports.getUserInventory = async (req, res) => {
  try {
    const inventory = await shopService.getUserInventory(req.user.id);
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Admin CRUD
exports.createShopItem = async (req, res) => {
  try {
    const item = await shopService.createItem(req.body);
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateShopItem = async (req, res) => {
  try {
    const item = await shopService.updateItem(req.params.id, req.body);
    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error(err.message);
    if (err.message === 'Item not found') {
      return res.status(404).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};

exports.deleteShopItem = async (req, res) => {
  try {
    await shopService.deleteItem(req.params.id);
    res.json({
      success: true,
      message: 'Item removed'
    });
  } catch (err) {
    console.error(err.message);
    if (err.message === 'Item not found') {
      return res.status(404).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};
