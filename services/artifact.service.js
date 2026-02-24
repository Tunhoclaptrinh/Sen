const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ArtifactService extends BaseService {
  constructor() {
    super('artifacts');
  }

  /**
   * Override findAll to handle custom filters
   */
  async findAll(query) {
    // Handle 'Dynasty' filter (searches in multiple fields)
    if (query.filter && query.filter.dynasty) {
      const dynastyTerm = query.filter.dynasty.toLowerCase();
      
      // Clone query to avoid mutating original
      const dbQuery = JSON.parse(JSON.stringify(query));
      delete dbQuery.filter.dynasty;
      
      // Fetch ALL matching other filters (limit=1000 to be safe)
      dbQuery.limit = 1000;
      dbQuery.page = 1;
      
      const result = await super.findAll(dbQuery);
      
      if (!result.success) return result;
      
      let items = result.data;
      
      // Client-side filter for Dynasty
      items = items.filter(item => {
        const inName = item.name && item.name.toLowerCase().includes(dynastyTerm);
        const inCreator = item.creator && item.creator.toLowerCase().includes(dynastyTerm);
        const inDesc = item.description && item.description.toLowerCase().includes(dynastyTerm);
        const inPeriod = item.culturalPeriod && item.culturalPeriod.toLowerCase().includes(dynastyTerm);
        
        return inName || inCreator || inDesc || inPeriod;
      });
      
      // Manual Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const total = items.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedItems = items.slice(start, end);
      
      return {
        success: true,
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    }
    
    return super.findAll(query);
  }

  /**
   * Override create to add bidirectional linking
   */
  async create(data) {
    // ✅ FIX: Validate category
    if (data.category && typeof data.category !== 'string') {
      return {
        success: false,
        message: 'Category must be a string',
        statusCode: 400
      };
    }

    const artifact = await super.create(data);

    // 🆕 Bidirectional linking: Update Heritage Sites
    if (data.relatedHeritageIds && data.relatedHeritageIds.length > 0) {
      await this._syncHeritageLinks(artifact.data.id, data.relatedHeritageIds, []);
    }

    // 🆕 Bidirectional linking: Update History Articles
    if (data.relatedHistoryIds && data.relatedHistoryIds.length > 0) {
      await this._syncHistoryLinks(artifact.data.id, data.relatedHistoryIds, []);
    }

    return artifact;
  }

  /**
   * Override update to sync bidirectional links
   */
  async update(id, data) {
    // ✅ FIX: Validate category if present
    if (data.category && typeof data.category !== 'string') {
      return {
        success: false,
        message: 'Category must be a string',
        statusCode: 400
      };
    }

    // Get old artifact to compare links
    const oldArtifact = await db.findById('artifacts', id);
    if (!oldArtifact) {
      return {
        success: false,
        message: 'Artifact not found',
        statusCode: 404
      };
    }

    const updatedArtifact = await super.update(id, data);

    // 🆕 Sync Heritage Site links
    if (data.relatedHeritageIds !== undefined) {
      const oldHeritageIds = oldArtifact.relatedHeritageIds || [];
      const newHeritageIds = data.relatedHeritageIds || [];
      await this._syncHeritageLinks(id, newHeritageIds, oldHeritageIds);
    }

    // 🆕 Sync History Article links
    if (data.relatedHistoryIds !== undefined) {
      const oldHistoryIds = oldArtifact.relatedHistoryIds || [];
      const newHistoryIds = data.relatedHistoryIds || [];
      await this._syncHistoryLinks(id, newHistoryIds, oldHistoryIds);
    }

    return updatedArtifact;
  }

  /**
   * Override delete to cleanup bidirectional links
   */
  async delete(id) {
    const artifact = await db.findById('artifacts', id);
    if (!artifact) {
      return {
        success: false,
        message: 'Artifact not found',
        statusCode: 404
      };
    }

    // 🆕 Cleanup all bidirectional links
    if (artifact.relatedHeritageIds && artifact.relatedHeritageIds.length > 0) {
      await this._syncHeritageLinks(id, [], artifact.relatedHeritageIds);
    }

    if (artifact.relatedHistoryIds && artifact.relatedHistoryIds.length > 0) {
      await this._syncHistoryLinks(id, [], artifact.relatedHistoryIds);
    }

    return await super.delete(id);
  }

  /**
   * Transform data before create
   */
  async beforeCreate(data) {
    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.heritageSiteId) data.heritageSiteId = Number(data.heritageSiteId);
    if (data.yearCreated) data.yearCreated = Number(data.yearCreated);
    if (data.weight) data.weight = Number(data.weight);

    return super.beforeCreate(data);
  }

  /**
   * Transform data before update
   */
  async beforeUpdate(id, data) {
    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.heritageSiteId) data.heritageSiteId = Number(data.heritageSiteId);
    if (data.yearCreated) data.yearCreated = Number(data.yearCreated);
    if (data.weight) data.weight = Number(data.weight);

    return super.beforeUpdate(id, data);
  }

  async getByType(type) {
    const artifacts = await db.findMany('artifacts', { artifactType: type });
    return {
      success: true,
      data: artifacts
    };
  }

  async getRelated(artifactId) {
    const artifact = await db.findById('artifacts', artifactId);
    if (!artifact) {
      return { success: false, message: 'Artifact not found', statusCode: 404 };
    }

    const allArtifacts = await db.findAll('artifacts');
    const related = allArtifacts
      .filter(a => {
        const isSameSite = a.heritageSiteId == artifact.heritageSiteId; // Use == for loose equality to be safe
        const isSameCat = a.categoryId == artifact.categoryId;
        const isNotSelf = a.id != artifactId;
        
        return isNotSelf && (isSameSite || isSameCat);
      })
      .slice(0, 5);
      
    // Fallback: If no related artifacts found, return random artifacts (Discovery Mode)
    if (related.length === 0) {
       const others = allArtifacts.filter(a => a.id != artifactId);
       // Shuffle and pick 5
       const shuffled = others.sort(() => 0.5 - Math.random());
       related.push(...shuffled.slice(0, 5));
    }

    return {
      success: true,
      data: related
    };
  }

  async getStats() {
    const allArtifacts = await db.findAll('artifacts');
    const allSites = await db.findAll('heritage_sites');
    const allReviews = await db.findMany('reviews', { type: 'artifact' });

    const siteMap = allSites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {});

    // Calculate average rating
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : "0.0";

    const stats = {
      total: allArtifacts.length,
      onDisplay: allArtifacts.filter(a => a.isOnDisplay !== false).length,
      goodCondition: allArtifacts.filter(a => ['excellent', 'good'].includes(a.condition)).length,
      avgRating: avgRating,
      unesco: allArtifacts.filter(a => siteMap[a.heritageSiteId]?.unescoListed).length,
      region: {
        north: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Bắc' || region === 'North';
        }).length,
        center: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Trung' || region === 'Center';
        }).length,
        south: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Nam' || region === 'South';
        }).length
      }
    };

    return {
      success: true,
      data: stats
    };
  }

  // 🆕 Sync bidirectional links with Heritage Sites
  async _syncHeritageLinks(artifactId, newHeritageIds, oldHeritageIds) {
    try {
      const toAdd = newHeritageIds.filter(id => !oldHeritageIds.includes(id));
      const toRemove = oldHeritageIds.filter(id => !newHeritageIds.includes(id));

      for (const heritageId of toAdd) {
        const heritage = await db.findById('heritage_sites', heritageId);
        if (heritage) {
          const relatedArtifacts = heritage.relatedArtifactIds || [];
          if (!relatedArtifacts.includes(artifactId)) {
            await db.update('heritage_sites', heritageId, {
              relatedArtifactIds: [...relatedArtifacts, artifactId]
            });
            console.log(`✅ Added artifact ${artifactId} to heritage ${heritageId}`);
          }
        }
      }

      for (const heritageId of toRemove) {
        const heritage = await db.findById('heritage_sites', heritageId);
        if (heritage && heritage.relatedArtifactIds) {
          await db.update('heritage_sites', heritageId, {
            relatedArtifactIds: heritage.relatedArtifactIds.filter(id => id !== artifactId)
          });
          console.log(`✅ Removed artifact ${artifactId} from heritage ${heritageId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing heritage links:', error);
    }
  }

  // 🆕 Sync bidirectional links with History Articles
  async _syncHistoryLinks(artifactId, newHistoryIds, oldHistoryIds) {
    try {
      const toAdd = newHistoryIds.filter(id => !oldHistoryIds.includes(id));
      const toRemove = oldHistoryIds.filter(id => !newHistoryIds.includes(id));

      for (const historyId of toAdd) {
        const history = await db.findById('history_articles', historyId);
        if (history) {
          const relatedArtifacts = history.relatedArtifactIds || [];
          if (!relatedArtifacts.includes(artifactId)) {
            await db.update('history_articles', historyId, {
              relatedArtifactIds: [...relatedArtifacts, artifactId]
            });
            console.log(`✅ Added artifact ${artifactId} to history ${historyId}`);
          }
        }
      }

      for (const historyId of toRemove) {
        const history = await db.findById('history_articles', historyId);
        if (history && history.relatedArtifactIds) {
          await db.update('history_articles', historyId, {
            relatedArtifactIds: history.relatedArtifactIds.filter(id => id !== artifactId)
          });
          console.log(`✅ Removed artifact ${artifactId} from history ${historyId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing history links:', error);
    }
  }
}

module.exports = new ArtifactService();
