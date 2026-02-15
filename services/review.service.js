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
    if (!['heritage_site', 'artifact', 'exhibition', 'history_article'].includes(type)) {
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

    // Populate user info
    const users = await db.findAll('users');
    result.data = result.data.map(review => {
      const user = users.find(u => u.id === review.userId);
      return {
        ...review,
        user: {
          id: user?.id,
          name: user?.name,
          avatar: user?.avatar
        },
        userName: user?.name,
        userAvatar: user?.avatar
      };
    });

    return result;
  }

  async findByItem(type, referenceId, options = {}) {
    type = this.normalizeType(type);
    const result = await db.findAllAdvanced('reviews', {
      ...options,
      filter: {
        ...options.filter,
        type,
        referenceId: Number(referenceId)
      }
    });

    // Populate user info
    const users = await db.findAll('users');
    result.data = result.data.map(review => {
      const user = users.find(u => u.id === review.userId);
      return {
        ...review,
        user: {
          id: user?.id,
          name: user?.name,
          avatar: user?.avatar
        },
        userName: user?.name,
        userAvatar: user?.avatar
      };
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
        heritage_site: allReviews.filter(r => r.type === 'heritage_site' || r.type === 'heritageSite').length,
        artifact: allReviews.filter(r => r.type === 'artifact').length,
        exhibition: allReviews.filter(r => r.type === 'exhibition').length,
        history_article: allReviews.filter(r => r.type === 'history_article').length
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
      // Update item rating
      await this.updateItemRating(item.type, item.referenceId);

      const notificationService = require('./notification.service');
      // Notify admins about new review
      let typeLabel = 'mục';
      if (item.type === 'heritage_site') typeLabel = 'di sản';
      else if (item.type === 'artifact') typeLabel = 'cổ vật';
      else if (item.type === 'exhibition') typeLabel = 'triển lãm';
      else if (item.type === 'history_article') typeLabel = 'bài viết lịch sử';

      await notificationService.notifyAdmins(
        'Đánh giá mới! ⭐',
        `Có một đánh giá ${item.rating} sao mới cho ${typeLabel} (ID: ${item.referenceId}).`,
        'review',
        item.referenceId
      );
    } catch (e) {
      console.error('Review notification or rating update failed', e);
    }
  }

  async afterUpdate(item) {
    await this.updateItemRating(item.type, item.referenceId);
  }

  async beforeDelete(id) {
    // Store review data before it's deleted so we can update ratings after
    this._deletingReview = await db.findById('reviews', id);
  }

  async afterDelete(id) {
    if (this._deletingReview && this._deletingReview.type && this._deletingReview.referenceId) {
      await this.updateItemRating(this._deletingReview.type, this._deletingReview.referenceId);
      this._deletingReview = null;
    }
  }

  async updateItemRating(type, referenceId) {
    try {
      type = this.normalizeType(type);
      let table = 'heritage_sites';
      if (type === 'artifact') table = 'artifacts';
      else if (type === 'exhibition') table = 'exhibitions';
      else if (type === 'history_article') table = 'history_articles';

      // Use findAllAdvanced to handle possible type mismatch between string/number referenceId
      const result = await db.findAllAdvanced('reviews', {
        filter: {
          type,
          referenceId: Number(referenceId)
        },
        limit: -1 // Get all reviews
      });

      const reviews = result.data;

      if (reviews.length === 0) {
        await db.update(table, referenceId, {
          rating: 0,
          totalReviews: 0,
          commentCount: 0
        });
        return;
      }

      const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
      const avgRating = parseFloat((totalRating / reviews.length).toFixed(1));

      await db.update(table, referenceId, {
        rating: avgRating,
        totalReviews: reviews.length,
        commentCount: reviews.length
      });
    } catch (error) {
      console.error('Error updating item rating:', error);
    }
  }

  /**
   * Recalculate all ratings and review counts for all item types
   */
  async recalculateAllRatings() {
    console.log('🔄 Starting systematic rating recalculation...');
    const types = [
      { type: 'heritage_site', table: 'heritage_sites' },
      { type: 'artifact', table: 'artifacts' },
      { type: 'exhibition', table: 'exhibitions' },
      { type: 'history_article', table: 'history_articles' }
    ];

    const results = {};

    for (const { type, table } of types) {
      const items = await db.findAll(table);
      console.log(`Processing ${items.length} items for ${table}...`);

      for (const item of items) {
        await this.updateItemRating(type, item.id);
      }
      results[table] = items.length;
    }

    console.log('✅ Rating recalculation complete.');
    return results;
  }
}

module.exports = new ReviewService();