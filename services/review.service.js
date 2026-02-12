const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ReviewService extends BaseService {
  constructor() {
    super('reviews');
  }

  normalizeType(type) {
    if (type === 'heritageSite' || type === 'heritage_site') return 'heritage_site';
    return type;
  }

  async findByType(type, options = {}) {
    type = this.normalizeType(type);
    if (!['heritage_site', 'artifact'].includes(type)) {
      return {
        success: false,
        message: 'Invalid type',
        statusCode: 400
      };
    }

    const result = await db.findAllAdvanced('reviews', {
      ...options,
      filter: {
        ...options.filter,
        type
      },
      sort: 'createdAt',
      order: 'desc'
    });

    return result;
  }

  async getStats() {
    const allReviews = await db.findAll('reviews');

    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : "0.0";

    const stats = {
      total: allReviews.length,
      avgRating: parseFloat(avgRating),
      types: {
        heritageSite: allReviews.filter(r => r.type === 'heritage_site' || r.type === 'heritageSite').length,
        heritage_site: allReviews.filter(r => r.type === 'heritage_site' || r.type === 'heritageSite').length,
        artifact: allReviews.filter(r => r.type === 'artifact').length
      },
      ratings: {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length
      }
    };

    return {
      success: true,
      data: stats
    };
  }

  async afterCreate(item) {
    try {
      const notificationService = require('./notification.service');
      // Notify admins about new review
      await notificationService.notifyAdmins(
        'Đánh giá mới! ⭐',
        `Có một đánh giá ${item.rating} sao mới cho ${item.type === 'heritage_site' ? 'di sản' : 'cổ vật'} (ID: ${item.referenceId}).`,
        'review',
        item.referenceId
      );
    } catch (e) {
      console.error('Review notification failed', e);
    }
  }
}

module.exports = new ReviewService();