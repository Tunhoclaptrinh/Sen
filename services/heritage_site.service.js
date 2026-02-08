const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');

class HeritageSiteService extends BaseService {
  constructor() {
    super('heritage_sites');
  }

  /**
   * ✅ Transform heritage type: snake_case → camelCase for Frontend
   */
  _transformTypeForOutput(type) {
    if (!type) return type;
    const typeMap = {
      'historic_building': 'historicBuilding',
      'archaeological_site': 'archaeologicalSite',
      'natural_heritage': 'naturalHeritage',
      'intangible_heritage': 'intangibleHeritage'
    };
    return typeMap[type] || type; // Keep original if not in map (monument, temple, museum)
  }

  /**
   * ✅ Transform heritage type: camelCase → snake_case for Database
   */
  _transformTypeForInput(type) {
    if (!type) return type;
    const typeMap = {
      'historicBuilding': 'historic_building',
      'archaeologicalSite': 'archaeological_site',
      'naturalHeritage': 'natural_heritage',
      'intangibleHeritage': 'intangible_heritage'
    };
    return typeMap[type] || type; // Keep original if not in map
  }

  /**
   * Override create to add bidirectional linking
   */
  async create(data) {
    // ✅ Transform type from Frontend format to DB format
    if (data.type) {
      data.type = this._transformTypeForInput(data.type);
    }

    const heritageSite = await super.create(data);

    // ✅ Transform type back to Frontend format
    if (heritageSite.data && heritageSite.data.type) {
      heritageSite.data.type = this._transformTypeForOutput(heritageSite.data.type);
    }

    // 🆕 Bidirectional linking: Update Artifacts
    if (data.relatedArtifactIds && data.relatedArtifactIds.length > 0) {
      await this._syncArtifactLinks(heritageSite.data.id, data.relatedArtifactIds, []);
    }

    // 🆕 Bidirectional linking: Update History Articles
    if (data.relatedHistoryIds && data.relatedHistoryIds.length > 0) {
      await this._syncHistoryLinks(heritageSite.data.id, data.relatedHistoryIds, []);
    }

    return heritageSite;
  }

  /**
   * Override update to sync bidirectional links
   */
  async update(id, data) {
    // ✅ Transform type from Frontend format to DB format
    if (data.type) {
      data.type = this._transformTypeForInput(data.type);
    }

    // Get old heritage to compare links
    const oldHeritage = await db.findById('heritage_sites', id);
    if (!oldHeritage) {
      return {
        success: false,
        message: 'Heritage site not found',
        statusCode: 404
      };
    }

    const updatedHeritage = await super.update(id, data);

    // ✅ Transform type back to Frontend format
    if (updatedHeritage.data && updatedHeritage.data.type) {
      updatedHeritage.data.type = this._transformTypeForOutput(updatedHeritage.data.type);
    }

    // 🆕 Sync Artifact links
    if (data.relatedArtifactIds !== undefined) {
      const oldArtifactIds = oldHeritage.relatedArtifactIds || [];
      const newArtifactIds = data.relatedArtifactIds || [];
      await this._syncArtifactLinks(id, newArtifactIds, oldArtifactIds);
    }

    // 🆕 Sync History links
    if (data.relatedHistoryIds !== undefined) {
      const oldHistoryIds = oldHeritage.relatedHistoryIds || [];
      const newHistoryIds = data.relatedHistoryIds || [];
      await this._syncHistoryLinks(id, newHistoryIds, oldHistoryIds);
    }

    return updatedHeritage;
  }

  /**
   * Override findById to transform type
   */
  async findById(id) {
    const result = await super.findById(id);
    if (result && result.data && result.data.type) {
      result.data.type = this._transformTypeForOutput(result.data.type);
    }
    return result;
  }

  /**
   * Override findAll to transform types in array
   */
  async findAll(options = {}) {
    const result = await super.findAll(options);
    if (result && result.data && Array.isArray(result.data)) {
      result.data = result.data.map(item => ({
        ...item,
        type: this._transformTypeForOutput(item.type)
      }));
    }
    return result;
  }

  /**
   * Override delete to cleanup bidirectional links
   */
  async delete(id) {
    const heritage = await db.findById('heritage_sites', id);
    if (!heritage) {
      return {
        success: false,
        message: 'Heritage site not found',
        statusCode: 404
      };
    if (heritage.relatedHistoryIds && heritage.relatedHistoryIds.length > 0) {
      await this._syncHistoryLinks(id, [], heritage.relatedHistoryIds);
    }

    }

    // 🆕 Cleanup bidirectional links
    if (heritage.relatedArtifactIds && heritage.relatedArtifactIds.length > 0) {
      await this._syncArtifactLinks(id, [], heritage.relatedArtifactIds);
    }

    return await super.delete(id);
  }

  /**
   * Transform data before create
   */
  async beforeCreate(data) {
    // Transform input data
    if (data.location) {
      if (data.location.address) data.address = data.location.address;
      if (data.location.latitude) data.latitude = data.location.latitude;
      if (data.location.longitude) data.longitude = data.location.longitude;
    }

    if (data.period && !data.culturalPeriod) {
      data.culturalPeriod = data.period;
    }

    // Ensure numeric fields are numbers
    if (data.entranceFee) data.entranceFee = Number(data.entranceFee);
    if (data.yearEstablished) data.yearEstablished = Number(data.yearEstablished);

    // Debug logging
    console.log('[HeritageService] Creating:', { name: data.name, shortDesc: data.shortDescription });

    return super.beforeCreate(data);
  }

  /**
   * Transform data before update
   */
  async beforeUpdate(id, data) {
    // Transform input data
    if (data.location) {
      if (data.location.address) data.address = data.location.address;
      if (data.location.latitude) data.latitude = data.location.latitude;
      if (data.location.longitude) data.longitude = data.location.longitude;
    }

    if (data.period && !data.culturalPeriod) {
      data.culturalPeriod = data.period;
    }

    // Ensure numeric fields are numbers
    if (data.entranceFee) data.entranceFee = Number(data.entranceFee);
    if (data.yearEstablished) data.yearEstablished = Number(data.yearEstablished) || null;

    // Debug logging
    console.log('[HeritageService] Updating:', { id, shortDesc: data.shortDescription });

    return super.beforeUpdate(id, data);
  }

  /**
   * Custom find to support IDs filter
   */
  async find(params) {
    const { ids, q, ...filters } = params;
    let items = await db.findAll(this.collection);

    // Filter by IDs
    if (ids) {
      const idList = typeof ids === 'string' ? ids.split(',').map(Number) : ids.map(Number);
      items = items.filter(item => idList.includes(item.id));
    }

    // Filter by query
    if (q) {
      const lowerQ = q.toLowerCase();
      items = items.filter(item => item.name?.toLowerCase().includes(lowerQ));
    }

    // Other filters
    for (const key in filters) {
      if (items.length > 0 && items[0][key] !== undefined) {
        items = items.filter(item => item[key] == filters[key]);
      }
    }

    return {
      success: true,
      data: items,
      count: items.length
    };
  }

  async findById(id) {
    const site = await super.findById(id);
    if (!site) return null;

    // No longer auto-populate related items
    // Frontend will fetch them separately using relatedArtifactIds and relatedHistoryIds

    return {
      success: true,
      data: site
    };
  }

  async findNearby(lat, lon, radius = 5, options = {}) {
    const allSites = await db.findAll('heritage_sites');

    const nearby = allSites
      .filter(site => site.latitude && site.longitude)
      .map(site => ({
        ...site,
        distance: calculateDistance(lat, lon, site.latitude, site.longitude)
      }))
      .filter(site => site.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return {
      success: true,
      data: nearby,
      count: nearby.length
    };
  }

  async getArtifacts(siteId) {
    const artifacts = await db.findMany('artifacts', { heritageSiteId: parseInt(siteId) });
    return {
      success: true,
      data: artifacts,
      count: artifacts.length
    };
  }

  async getTimeline(siteId) {
    // 1. First check if timeline is nested in the site record
    const siteRes = await db.findById('heritage_sites', siteId);
    if (siteRes && siteRes.timeline && siteRes.timeline.length > 0) {
      return {
        success: true,
        data: siteRes.timeline.sort((a, b) => (a.year || 0) - (b.year || 0))
      };
    }

    // 2. Fallback to separate collection if that's where it's stored
    const timelines = (await db.findMany('timelines', { heritageSiteId: parseInt(siteId) }))
      .sort((a, b) => a.year - b.year);

    return {
      success: true,
      data: timelines
    };
  }

  async getStats() {
    const allSites = await db.findAll('heritage_sites');

    const stats = {
      total: allSites.length,
      unesco: allSites.filter(s => s.unescoListed).length,
      topRated: allSites.filter(s => s.rating >= 4).length,
      region: {
        north: allSites.filter(s => s.region === 'Bắc' || s.region === 'North').length,
        center: allSites.filter(s => s.region === 'Trung' || s.region === 'Center').length,
        south: allSites.filter(s => s.region === 'Nam' || s.region === 'South').length
      }
    };

    return {
      success: true,
      data: stats
    };
  }

  // 🆕 Sync bidirectional links with Artifacts
  async _syncArtifactLinks(heritageId, newArtifactIds, oldArtifactIds) {
    try {
      const toAdd = newArtifactIds.filter(id => !oldArtifactIds.includes(id));
      const toRemove = oldArtifactIds.filter(id => !newArtifactIds.includes(id));

      for (const artifactId of toAdd) {
        const artifact = await db.findById('artifacts', artifactId);
        if (artifact) {
          const relatedHeritages = artifact.relatedHeritageIds || [];
          if (!relatedHeritages.includes(heritageId)) {
            await db.update('artifacts', artifactId, {
              relatedHeritageIds: [...relatedHeritages, heritageId]
            });
            console.log(`✅ Added heritage ${heritageId} to artifact ${artifactId}`);
          }
        }
      }

      for (const artifactId of toRemove) {
        const artifact = await db.findById('artifacts', artifactId);
        if (artifact && artifact.relatedHeritageIds) {
          await db.update('artifacts', artifactId, {
            relatedHeritageIds: artifact.relatedHeritageIds.filter(id => id !== heritageId)
          });
          console.log(`✅ Removed heritage ${heritageId} from artifact ${artifactId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing artifact links:', error);
    }
  }

  /**
   * 🆕 Sync bidirectional links with History Articles
   */
  async _syncHistoryLinks(heritageId, newHistoryIds, oldHistoryIds) {
    try {
      const toAdd = newHistoryIds.filter(id => !oldHistoryIds.includes(id));
      const toRemove = oldHistoryIds.filter(id => !newHistoryIds.includes(id));

      for (const historyId of toAdd) {
        const history = await db.findById('history_articles', historyId);
        if (history) {
          const relatedHeritages = history.relatedHeritageIds || [];
          if (!relatedHeritages.includes(heritageId)) {
            await db.update('history_articles', historyId, {
              relatedHeritageIds: [...relatedHeritages, heritageId]
            });
            console.log(`✅ Added heritage ${heritageId} to history ${historyId}`);
          }
        }
      }

      for (const historyId of toRemove) {
        const history = await db.findById('history_articles', historyId);
        if (history && history.relatedHeritageIds) {
          await db.update('history_articles', historyId, {
            relatedHeritageIds: history.relatedHeritageIds.filter(id => id !== heritageId)
          });
          console.log(`✅ Removed heritage ${heritageId} from history ${historyId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing history links:', error);
    }
  }
}

module.exports = new HeritageSiteService();