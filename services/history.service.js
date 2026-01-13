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
    if (data.shortDescription && !data.short_description) {
      data.short_description = data.shortDescription;
    }
    
    // Ensure numeric fields
    if (data.category_id) data.category_id = Number(data.category_id);
    if (data.views) data.views = Number(data.views);
    
    return super.beforeCreate(data);
  }

  /**
   * Transform data before update
   */
  async beforeUpdate(id, data) {
    if (data.shortDescription && !data.short_description) {
      data.short_description = data.shortDescription;
    }

    // Ensure numeric fields
    if (data.category_id) data.category_id = Number(data.category_id);
    if (data.views) data.views = Number(data.views);

    return super.beforeUpdate(id, data);
  }

  /**
   * Get statistics for history articles
   */
  async getStats() {
    const allArticles = await db.findAll('history_articles');
    
    const active = allArticles.filter(a => a.is_active !== false).length;
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
    if (article.related_heritage_ids?.length) {
      const heritageSites = await db.findAll('heritage_sites');
      article.related_heritage = heritageSites.filter(h => article.related_heritage_ids.includes(h.id));
    }

    // Populate Related Artifacts
    if (article.related_artifact_ids?.length) {
      const artifacts = await db.findAll('artifacts');
      article.related_artifacts = artifacts.filter(a => article.related_artifact_ids.includes(a.id));
    }

    // Populate Related Game Levels
    if (article.related_level_ids?.length) {
      const levels = await db.findAll('game_levels');
      article.related_levels = levels.filter(l => article.related_level_ids.includes(l.id));
    }

     // Populate Related Products
     if (article.related_product_ids?.length) {
      const products = await db.findAll('products');
      article.related_products = products.filter(p => article.related_product_ids.includes(p.id));
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
