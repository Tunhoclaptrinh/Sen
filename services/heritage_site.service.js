const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');

class HeritageSiteService extends BaseService {
  constructor() {
    super('heritage_sites');
  }

  async findNearby(lat, lon, radius, options = {}) {
    const allSites = db.findAll('heritage_sites');

    const nearby = allSites
      .filter(site => site.latitude && site.longitude)
      .map(site => ({
        ...site,
        distance: calculateDistance(lat, lon, site.latitude, site.longitude)
      }))
      .filter(site => site.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    const pagination = this.applyPagination(nearby, options.page, options.limit);

    return {
      success: true,
      data: pagination.data,
      pagination: pagination
    };
  }

  async findByPeriod(period, options = {}) {
    const result = db.findAllAdvanced('heritage_sites', {
      ...options,
      filter: {
        ...options.filter,
        cultural_period: period
      }
    });

    return result;
  }

  async getTimeline(siteId) {
    const site = db.findById('heritage_sites', siteId);

    if (!site) {
      return {
        success: false,
        message: 'Heritage site not found',
        statusCode: 404
      };
    }

    const timelines = db.findMany('timelines', { heritage_site_id: parseInt(siteId) })
      .sort((a, b) => a.year - b.year);

    return {
      success: true,
      data: {
        site,
        timelines
      }
    };
  }
}

module.exports = new HeritageSiteService();