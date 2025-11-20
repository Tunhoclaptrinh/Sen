const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class CategoryService extends BaseService {
  constructor() {
    super('cultural_categories');
  }

  async validateDelete(id) {
    const artifacts = db.findMany('artifacts', { category_id: parseInt(id) });

    if (artifacts.length > 0) {
      return {
        success: false,
        message: 'Cannot delete category in use',
        statusCode: 400,
        details: {
          artifacts_count: artifacts.length
        }
      };
    }

    return { success: true };
  }
}

module.exports = new CategoryService();