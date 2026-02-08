/**
 * services/shop_cms.service.js
 * Service for shop items management (CMS)
 */

const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { 
  getValidShopTypes, 
  getValidCurrencies,
  isValidShopType,
  isValidCurrency 
} = require('../constants/shop.constants');

class ShopCMSService extends BaseService {
  constructor() {
    super('shop_items');
  }

  /**
   * Override create to add validation & defaults
   */
  async create(data) {
    // Validate required fields
    if (!data.name || !data.type || !data.price || !data.currency) {
      return {
        success: false,
        message: 'Missing required fields: name, type, price, currency',
        statusCode: 400
      };
    }

    // Validate type
    if (!isValidShopType(data.type)) {
      return {
        success: false,
        message: `Invalid type. Must be one of: ${getValidShopTypes().join(', ')}`,
        statusCode: 400
      };
    }

    // Validate currency
    if (!isValidCurrency(data.currency)) {
      return {
        success: false,
        message: `Currency must be one of: ${getValidCurrencies().join(', ')}`,
        statusCode: 400
      };
    }

    // Set defaults
    const itemData = {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isConsumable: data.isConsumable !== undefined ? data.isConsumable : true,
      maxStack: data.maxStack || (data.isConsumable ? 99 : 1),
      createdAt: new Date().toISOString()
    };

    return await super.create(itemData);
  }

  /**
   * Override update to validate fields
   */
  async update(id, data) {
    // Get existing item
    const existing = await db.findById(this.collection, id);
    if (!existing) {
      return {
        success: false,
        message: 'Shop item not found',
        statusCode: 404
      };
    }

    // Validate type if provided
    if (data.type) {
      const validTypes = ['hint', 'boost', 'character_skin', 'avatar', 'title', 'theme', 'collectible', 'powerup'];
      if (!validTypes.includes(data.type)) {
        return {
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          statusCode: 400
        };
      }
    }

    // Validate currency if provided
    if (data.currency && !['coins', 'petals'].includes(data.currency)) {
      return {
        success: false,
        message: 'Currency must be either "coins" or "petals"',
        statusCode: 400
      };
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    return await super.update(id, updateData);
  }

  /**
   * Get active items only (for public shop)
   */
  async getActiveItems() {
    const items = await db.findMany(this.collection, { isActive: true, isAvailable: true });
    return {
      success: true,
      data: items
    };
  }
}

module.exports = new ShopCMSService();
