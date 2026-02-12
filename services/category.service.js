const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class CategoryService extends BaseService {
  constructor() {
    super('cultural_categories');
  }

  async validateDelete(id) {
    const categoryId = parseInt(id);
    const [artifacts, sites, articles, modules] = await Promise.all([
      db.findMany('artifacts', { categoryId }),
      db.findMany('heritage_sites', { categoryId }),
      db.findMany('history_articles', { categoryId }),
      db.findMany('learning_modules', { categoryId })
    ]);

    const totalUsage = artifacts.length + sites.length + articles.length + modules.length;

    if (totalUsage > 0) {
      return {
        success: false,
        message: 'Cannot delete category in use',
        statusCode: 400,
        details: {
          artifacts: artifacts.length,
          heritageSites: sites.length,
          historyArticles: articles.length,
          learningModules: modules.length
        }
      };
    }

    return { success: true };
  }

  /**
   * Lấy tất cả vật phẩm/di sản thuộc category này
   */
  async getItemsByCategory(categoryId, queryOptions = {}) {
    const options = {
      ...queryOptions,
      filter: {
        ...(queryOptions.filter || {}),
        categoryId: parseInt(categoryId)
      }
    };

    // Optimization: Check if we need both artifacts and sites or just artifacts
    // For now, mirroring previous logic but using Promise.all if we were to expand
    const result = await db.findAllAdvanced('artifacts', options);

    return {
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination
    };
  }
}

module.exports = new CategoryService();