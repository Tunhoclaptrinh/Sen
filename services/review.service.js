const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ReviewService extends BaseService {
  constructor() {
    super('reviews');
  }

  async findByType(type, options = {}) {
    if (!['heritage_site', 'artifact'].includes(type)) {
      return {
        success: false,
        message: 'Invalid type',
        statusCode: 400
      };
    }

    const result = await db.findAllAdvanced('reviews', {
      ...options,
      filter: {
        ...options.filter,
        type
      },
      sort: 'created_at',
      order: 'desc'
    });

    return result;
  }
}

module.exports = new ReviewService();