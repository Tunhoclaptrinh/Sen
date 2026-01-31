const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class HistoryService extends BaseService {
  constructor() {
    super('history_articles');
  }

  /**
   * Transform data before create
   */
  async beforeCreate(data) {
    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.views) data.views = Number(data.views);

    return super.beforeCreate(data);
  }

  /**
   * Transform data before update
   */
  async beforeUpdate(id, data) {
    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.views) data.views = Number(data.views);

    return super.beforeUpdate(id, data);
  }

  /**
   * Get statistics for history articles
   */
  async getStats() {
    const allArticles = await db.findAll('history_articles');

    const active = allArticles.filter(a => a.isActive !== false).length;
    const inactive = allArticles.length - active;

    const stats = {
      total: allArticles.length,
      active: active,
      inactive: inactive,
      totalViews: allArticles.reduce((sum, a) => sum + (a.views || 0), 0),
      avgViews: allArticles.length > 0 ? (allArticles.reduce((sum, a) => sum + (a.views || 0), 0) / allArticles.length).toFixed(0) : 0,
      summary: [
        { status: 'active', count: active, label: 'Đang hiển thị' },
        { status: 'inactive', count: inactive, label: 'Đã ẩn' }
      ]
    };

    return {
      success: true,
      data: stats
    };
  }

  /**
   * Override find to support search by title
   */
  async find(params) {
    const { q, ...filters } = params;
    let items = await db.findAll(this.modelName);

    // Apply filters
    items = items.filter(item => {
      let match = true;
      for (const key in filters) {
        if (item[key] !== filters[key]) match = false;
      }
      return match;
    });

    // Apply search
    if (q) {
      const lowerQ = q.toLowerCase();
      items = items.filter(item =>
        item.title?.toLowerCase().includes(lowerQ) ||
        item.shortDescription?.toLowerCase().includes(lowerQ)
      );
    }

    // Sort by Date desc
    items.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    return {
      success: true,
      data: items,
      count: items.length
    };
  }

  /**
   * Override findById to populate related data
   */
  async findById(id) {
    const article = await db.findById(this.collection, id);
    if (!article) {
      return {
        success: false,
        message: 'History article not found',
        statusCode: 404
      };
    }

    // Populate Related Heritage
    if (article.relatedHeritageIds?.length) {
      const heritageSites = await db.findAll('heritage_sites');
      article.relatedHeritage = heritageSites.filter(h => article.relatedHeritageIds.includes(h.id));
    }

    // Populate Related Artifacts
    if (article.relatedArtifactIds?.length) {
      const artifacts = await db.findAll('artifacts');
      article.relatedArtifacts = artifacts.filter(a => article.relatedArtifactIds.includes(a.id));
    }

    // Populate Related Game Levels
    if (article.relatedLevelIds?.length) {
      const levels = await db.findAll('game_levels');
      article.relatedLevels = levels.filter(l => article.relatedLevelIds.includes(l.id));
    }

    // Populate Related Products
    if (article.relatedProductIds?.length) {
      const products = await db.findAll('products');
      article.relatedProducts = products.filter(p => article.relatedProductIds.includes(p.id));
    }

    return {
      success: true,
      data: article
    };
  }

  /**
   * Get related articles (simple random or same author for now)
   */
  async getRelated(id, limit = 3) {
    const all = await db.findAll(this.collection);
    const others = all.filter(x => x.id != id);
    // Shuffle
    const shuffled = others.sort(() => 0.5 - Math.random());
    return {
      success: true,
      data: shuffled.slice(0, limit)
    };
  }
}

module.exports = new HistoryService();
