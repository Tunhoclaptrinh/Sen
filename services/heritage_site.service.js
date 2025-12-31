const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');

class HeritageSiteService extends BaseService {
  constructor() {
    super('heritage_sites');
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
    const timelines = (await db.findMany('timelines', { heritage_site_id: parseInt(siteId) }))
      .sort((a, b) => a.year - b.year);
    return {
      success: true,
      data: timelines
    };
  }
}

module.exports = new HeritageSiteService();