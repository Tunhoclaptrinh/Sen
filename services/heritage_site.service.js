const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');

class HeritageSiteService extends ReviewableService {
  constructor() {
    super('heritage_sites');
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
    if (data.categoryId) data.categoryId = Number(data.categoryId);

    // Initial status for review workflow if not provided (Admins)
    if (!data.status) data.status = 'draft';

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
    if (data.categoryId) data.categoryId = Number(data.categoryId);

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
}

module.exports = new HeritageSiteService();