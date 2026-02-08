const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class HistoryService extends BaseService {
  constructor() {
    super('history_articles');
  }

  /**
   * Override create to add bidirectional linking
   */
  async create(data) {
    const article = await super.create(data);

    // 🆕 Bidirectional linking: Update Artifacts
    if (data.relatedArtifactIds && data.relatedArtifactIds.length > 0) {
      await this._syncArtifactLinks(article.data.id, data.relatedArtifactIds, []);
    }

    return article;
  }

  /**
   * Override update to sync bidirectional links
   */
  async update(id, data) {
    // Get old article to compare links
    const oldArticle = await db.findById('history_articles', id);
    if (!oldArticle) {
      return {
        success: false,
        message: 'History article not found',
        statusCode: 404
      };
    }

    const updatedArticle = await super.update(id, data);

    // 🆕 Sync Artifact links
    if (data.relatedArtifactIds !== undefined) {
      const oldArtifactIds = oldArticle.relatedArtifactIds || [];
      const newArtifactIds = data.relatedArtifactIds || [];
      await this._syncArtifactLinks(id, newArtifactIds, oldArtifactIds);
    }

    return updatedArticle;
  }

  /**
   * Override delete to cleanup bidirectional links
   */
  async delete(id) {
    const article = await db.findById('history_articles', id);
    if (!article) {
      return {
        success: false,
        message: 'History article not found',
        statusCode: 404
      };
    }

    // 🆕 Cleanup bidirectional links
    if (article.relatedArtifactIds && article.relatedArtifactIds.length > 0) {
      await this._syncArtifactLinks(id, [], article.relatedArtifactIds);
    }

    return await super.delete(id);
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
      // ✅ Normalize IDs to numbers for comparison
      const normalizedHeritageIds = article.relatedHeritageIds.map(id => Number(id));
      // ✅ Remove nested related arrays to avoid circular data
      article.relatedHeritage = heritageSites
        .filter(h => normalizedHeritageIds.includes(h.id))
        .map(h => {
          const { relatedArtifacts, relatedHistory, relatedLevels, relatedProducts, ...cleanHeritage } = h;
          return cleanHeritage;
        });
    }

    // Populate Related Artifacts
    if (article.relatedArtifactIds?.length) {
      const artifacts = await db.findAll('artifacts');
      // ✅ Normalize IDs to numbers for comparison
      const normalizedArtifactIds = article.relatedArtifactIds.map(id => Number(id));
      article.relatedArtifacts = artifacts.filter(a => normalizedArtifactIds.includes(a.id));
    }

    // Populate Related Game Levels
    if (article.relatedLevelIds?.length) {
      const levels = await db.findAll('game_levels');
      // ✅ Normalize IDs to numbers for comparison
      const normalizedLevelIds = article.relatedLevelIds.map(id => Number(id));
      article.relatedLevels = levels.filter(l => normalizedLevelIds.includes(l.id));
    }

    // Populate Related Products
    if (article.relatedProductIds?.length) {
      const products = await db.findAll('products');
      // ✅ Normalize IDs to numbers for comparison
      const normalizedProductIds = article.relatedProductIds.map(id => Number(id));
      article.relatedProducts = products.filter(p => normalizedProductIds.includes(p.id));
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

  // 🆕 Sync bidirectional links with Artifacts
  async _syncArtifactLinks(historyId, newArtifactIds, oldArtifactIds) {
    try {
      const toAdd = newArtifactIds.filter(id => !oldArtifactIds.includes(id));
      const toRemove = oldArtifactIds.filter(id => !newArtifactIds.includes(id));

      for (const artifactId of toAdd) {
        const artifact = await db.findById('artifacts', artifactId);
        if (artifact) {
          const relatedHistories = artifact.relatedHistoryIds || [];
          if (!relatedHistories.includes(historyId)) {
            await db.update('artifacts', artifactId, {
              relatedHistoryIds: [...relatedHistories, historyId]
            });
            console.log(`✅ Added history ${historyId} to artifact ${artifactId}`);
          }
        }
      }

      for (const artifactId of toRemove) {
        const artifact = await db.findById('artifacts', artifactId);
        if (artifact && artifact.relatedHistoryIds) {
          await db.update('artifacts', artifactId, {
            relatedHistoryIds: artifact.relatedHistoryIds.filter(id => id !== historyId)
          });
          console.log(`✅ Removed history ${historyId} from artifact ${artifactId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing artifact links:', error);
    }
  }
}

module.exports = new HistoryService();
