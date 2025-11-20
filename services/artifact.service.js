const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ArtifactService extends BaseService {
  constructor() {
    super('artifacts');
  }

  async findByHeritageSite(siteId, options = {}) {
    const result = db.findAllAdvanced('artifacts', {
      ...options,
      filter: {
        ...options.filter,
        heritage_site_id: parseInt(siteId)
      }
    });

    return result;
  }

  async findByCategory(categoryId, options = {}) {
    const result = db.findAllAdvanced('artifacts', {
      ...options,
      filter: {
        ...options.filter,
        category_id: parseInt(categoryId)
      }
    });

    return result;
  }
}

module.exports = new ArtifactService();
