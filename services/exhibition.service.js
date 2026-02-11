const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');

class ExhibitionService extends ReviewableService {
  constructor() {
    super('exhibitions');
  }

  async beforeCreate(data, options = {}) {
    data.visitorCount = 0;

    // Set default status if not provided or if created by researcher
    if (!data.status) {
      data.status = 'draft';
    }

    if (options.user && options.user.role === 'researcher') {
      data.status = 'draft';
      data.createdBy = options.user.id;
    }

    return super.beforeCreate(data, options);
  }

  async beforeUpdate(id, data, options = {}) {
    // If researcher updates a published/rejected item, revert to draft
    if (options.user && options.user.role === 'researcher') {
      const currentItem = await this.findById(id);
      if (currentItem.success && ['published', 'rejected'].includes(currentItem.data.status)) {
        data.status = 'draft';
      }
    }
    return super.beforeUpdate(id, data, options);
  }

  async getActiveExhibitions(options = {}) {
    const now = new Date();
    // Use the base findAll which handles status: 'published' via ReviewableService
    options.filter = {
      ...options.filter,
      isActive: true,
      status: 'published'
    };

    const result = await this.findAll(options);
    if (!result.success) return result;

    const activeItems = result.data.filter(ex => {
      const start = new Date(ex.startDate);
      const end = new Date(ex.endDate);
      return start <= now && now <= end;
    });

    return {
      success: true,
      data: activeItems,
      pagination: result.pagination
    };
  }

  async getStats() {
    const all = await db.findMany(this.collection, {});
    const now = new Date();

    return {
      success: true,
      data: {
        total: all.length,
        published: all.filter(ex => ex.status === 'published').length,
        pending: all.filter(ex => ex.status === 'pending').length,
        draft: all.filter(ex => ex.status === 'draft').length,
        active: all.filter(ex => {
          const start = new Date(ex.startDate);
          const end = new Date(ex.endDate);
          return start <= now && now <= end && ex.status === 'published';
        }).length
      }
    };
  }
}

module.exports = new ExhibitionService();