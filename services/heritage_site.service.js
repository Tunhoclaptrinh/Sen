const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');

class HeritageSiteService extends BaseService {
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

    if (data.period && !data.cultural_period) {
      data.cultural_period = data.period;
    }

    if (data.shortDescription && !data.short_description) {
      data.short_description = data.shortDescription;
    }
    
    // Ensure numeric fields are numbers
    if (data.entrance_fee) data.entrance_fee = Number(data.entrance_fee);
    if (data.year_established) data.year_established = Number(data.year_established);

    // Debug logging
    console.log('[HeritageService] Creating:', { name: data.name, short_desc: data.short_description });

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

    if (data.period && !data.cultural_period) {
      data.cultural_period = data.period;
    }

    if (data.shortDescription && !data.short_description) {
      data.short_description = data.shortDescription;
    }
    
    // Ensure numeric fields are numbers
    if (data.entrance_fee) data.entrance_fee = Number(data.entrance_fee);
    if (data.year_established) data.year_established = Number(data.year_established);

    // Debug logging
    console.log('[HeritageService] Updating:', { id, short_desc: data.short_description });

    return super.beforeUpdate(id, data);
  }

  async findById(id) {
    const site = await super.findById(id);
    if (!site) return null;

    // No longer auto-populate related items
    // Frontend will fetch them separately using related_artifact_ids and related_history_ids

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
    const artifacts = await db.findMany('artifacts', { heritage_site_id: parseInt(siteId) });
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
    const timelines = (await db.findMany('timelines', { heritage_site_id: parseInt(siteId) }))
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
      unesco: allSites.filter(s => s.unesco_listed).length,
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