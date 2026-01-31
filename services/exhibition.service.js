const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ExhibitionService extends BaseService {
  constructor() {
    super('exhibitions');
  }

  async beforeCreate(data) {
    data.visitorCount = 0;
    return super.beforeCreate(data);
  }

  async getActiveExhibitions(options = {}) {
    const now = new Date();
    const allExhibitions = await db.findAll('exhibitions');

    const activeExhibitions = allExhibitions.filter(ex => {
      const start = new Date(ex.startDate);
      const end = new Date(ex.endDate);
      return start <= now && now <= end && ex.isActive;
    });

    const pagination = this.applyPagination(activeExhibitions, options.page, options.limit);

    return {
      success: true,
      data: pagination.data,
      pagination: pagination
    };
  }
}

module.exports = new ExhibitionService();