/**
 * controllers/shop_cms.controller.js
 * Admin controller for shop items management
 */

const shopCMSService = require('../services/shop_cms.service');

class ShopCMSController {
  /**
   * Get all shop items (with pagination, search, filter)
   */
  async getAllItems(req, res, next) {
    try {
      const result = await shopCMSService.findAll(req.parsedQuery || {});
      return res.json(result);
    } catch (error) {
      console.error('Error in getAllItems:', error);
      next(error);
    }
  }

  /**
   * Get shop item by ID
   */
  async getItemById(req, res, next) {
    try {
      const result = await shopCMSService.findById(req.params.id);
      return res.json(result);
    } catch (error) {
      console.error('Error in getItemById:', error);
      next(error);
    }
  }

  /**
   * Create new shop item
   */
  async createItem(req, res, next) {
    try {
      const result = await shopCMSService.create(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error in createItem:', error);
      next(error);
    }
  }

  /**
   * Update shop item
   */
  async updateItem(req, res, next) {
    try {
      const result = await shopCMSService.update(req.params.id, req.body);
      return res.json(result);
    } catch (error) {
      console.error('Error in updateItem:', error);
      next(error);
    }
  }

  /**
   * Delete shop item
   */
  async deleteItem(req, res, next) {
    try {
      const result = await shopCMSService.delete(req.params.id);
      return res.json(result);
    } catch (error) {
      console.error('Error in deleteItem:', error);
      next(error);
    }
  }
}

module.exports = new ShopCMSController();
