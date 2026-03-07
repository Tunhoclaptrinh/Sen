const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const { sanitizeUser, hashPassword } = require('../utils/helpers');
const userSchema = require('../schemas/user.schema');

class UserService extends BaseService {
  constructor() {
    super('users');
  }

  /**
   * Get schema for import/export
   */
  getSchema() {
    return userSchema;
  }

  /**
   * Transform import data - hash password
   */
  async transformImportData(data) {
    const transformed = await super.transformImportData(data);

    // Hash password if provided
    if (transformed.password) {
      transformed.password = await hashPassword(transformed.password);
    }

    // Generate avatar if not provided
    if (!transformed.avatar && transformed.name) {
      transformed.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(transformed.name)}&background=random`;
    }

    return transformed;
  }

  async beforeCreate(data) {
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    // Generate avatar if not provided
    if (!data.avatar && data.name) {
      data.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
    }

    return {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async beforeUpdate(id, data) {
    if (data.newPassword) {
      data.password = await hashPassword(data.newPassword);
      delete data.newPassword;
    }

    // Hash password if provided directly (for admin updates)
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    return {
      ...data,
      updatedAt: new Date().toISOString()
    };
  }

  async getUserStats() {
    const users = await db.findAll('users');
    const progress = await db.findAll('game_progress');

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      byRole: {
        customer: users.filter(u => u.role === 'customer').length,
        admin: users.filter(u => u.role === 'admin').length,
        researcher: users.filter(u => u.role === 'researcher').length
      },
      activePlayers: progress.filter(p => {
        const lastLogin = new Date(p.lastLogin);
        return lastLogin >= weekAgo;
      }).length,
      recentSignups: users.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= weekAgo;
      }).length
    };

    return {
      success: true,
      data: stats
    };
  }

  async getUserActivity(userId) {
    const user = await db.findById('users', userId);

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy người dùng',
        statusCode: 404
      };
    }

    const progress = await db.findOne('game_progress', { userId: userId });
    const sessions = await db.findMany('game_sessions', { userId: userId });
    const scans = await db.findMany('scan_history', { userId: userId });
    const favorites = await db.findMany('favorites', { userId: userId });
    const reviews = await db.findMany('reviews', { userId: userId });

    const activity = {
      user: sanitizeUser(user),
      gameStats: progress ? {
        level: progress.level,
        coins: progress.coins,
        petals: progress.totalSenPetals,
        characters: progress.collectedCharacters?.length || 0,
        badges: progress.badges?.length || 0,
        streak: progress.streakDays,
        lastLogin: progress.lastLogin
      } : null,
      recentSessions: sessions
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 5),
      recentScans: scans
        .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
        .slice(0, 5),
      totalFavorites: favorites.length,
      totalCollections: await db.count('collections', { userId: userId }),
      totalReviews: reviews.length,
      avgRating: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : 0
    };

    return {
      success: true,
      data: activity
    };
  }

  async toggleUserStatus(userId) {
    const user = await db.findById('users', userId);

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy người dùng',
        statusCode: 404
      };
    }

    const updated = await db.update('users', userId, {
      isActive: !user.isActive,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Người dùng đã được ${updated.isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: sanitizeUser(updated)
    };
  }

  async _deleteByQueries(collection, queries = [], { dryRun = false } = {}) {
    const matchedById = new Map();

    for (const query of queries) {
      const items = await db.findMany(collection, query);
      for (const item of items) {
        if (!item || item.id === undefined || item.id === null) continue;
        if (!matchedById.has(item.id)) {
          matchedById.set(item.id, item);
        }
      }
    }

    const matchedItems = Array.from(matchedById.values());

    if (!dryRun) {
      for (const item of matchedItems) {
        await db.delete(collection, item.id);
      }
    }

    return {
      count: matchedItems.length,
      items: matchedItems
    };
  }

  async purgeUserData(userId, options = {}) {
    const numericUserId = Number(userId);
    const deleteUserRecord = options.deleteUserRecord !== false;
    const dryRun = options.dryRun === true;

    if (!Number.isFinite(numericUserId)) {
      return {
        success: false,
        message: 'ID người dùng không hợp lệ',
        statusCode: 400
      };
    }

    const user = await db.findById('users', numericUserId);

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy người dùng',
        statusCode: 404
      };
    }

    const deleted = {
      users: 0,
      game_progress: 0,
      game_sessions: 0,
      user_inventory: 0,
      scan_history: 0,
      favorites: 0,
      reviews: 0,
      collections: 0,
      notifications: 0,
      ai_chat_history: 0,
      transactions: 0,
      user_quests: 0,
      user_characters: 0,
      user_vouchers: 0,
      welfare_history: 0,
    };

    const scrubbed = {
      createdByCleared: 0,
      byCollection: {}
    };

    const reviewTargets = new Map();

    const deletePlan = [
      { collection: 'game_progress', queries: [{ userId: numericUserId }] },
      { collection: 'game_sessions', queries: [{ userId: numericUserId }] },
      { collection: 'user_inventory', queries: [{ userId: numericUserId }] },
      { collection: 'scan_history', queries: [{ userId: numericUserId }] },
      { collection: 'favorites', queries: [{ userId: numericUserId }] },
      { collection: 'collections', queries: [{ userId: numericUserId }, { createdBy: numericUserId }] },
      { collection: 'notifications', queries: [{ userId: numericUserId }] },
      { collection: 'ai_chat_history', queries: [{ userId: numericUserId }] },
      { collection: 'transactions', queries: [{ userId: numericUserId }] },
      { collection: 'user_quests', queries: [{ userId: numericUserId }] },
      { collection: 'user_characters', queries: [{ userId: numericUserId }] },
      { collection: 'user_vouchers', queries: [{ userId: numericUserId }] },
      { collection: 'welfare_history', queries: [{ userId: numericUserId }] },
    ];

    for (const item of deletePlan) {
      const result = await this._deleteByQueries(item.collection, item.queries, { dryRun });
      deleted[item.collection] = result.count;
    }

    const reviewResult = await this._deleteByQueries('reviews', [
      { userId: numericUserId },
      { createdBy: numericUserId }
    ], { dryRun });
    deleted.reviews = reviewResult.count;

    for (const review of reviewResult.items) {
      if (!review || !review.type || review.referenceId === undefined || review.referenceId === null) continue;
      const key = `${review.type}:${review.referenceId}`;
      if (!reviewTargets.has(key)) {
        reviewTargets.set(key, {
          type: review.type,
          referenceId: Number(review.referenceId)
        });
      }
    }

    const createdByCollections = [
      'heritage_sites',
      'artifacts',
      'exhibitions',
      'history_articles',
      'learning_modules',
      'game_chapters',
      'game_levels'
    ];

    for (const collection of createdByCollections) {
      const items = await db.findMany(collection, { createdBy: numericUserId });
      scrubbed.byCollection[collection] = items.length;
      scrubbed.createdByCleared += items.length;

      if (!dryRun) {
        for (const content of items) {
          await db.update(collection, content.id, {
            createdBy: null,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    if (!dryRun && reviewTargets.size > 0) {
      const reviewService = require('./review.service');
      for (const target of reviewTargets.values()) {
        await reviewService.updateItemRating(target.type, target.referenceId);
      }
    }

    if (deleteUserRecord) {
      if (!dryRun) {
        await db.delete('users', numericUserId);
      }
      deleted.users = 1;
    }

    return {
      success: true,
      message: dryRun
        ? 'Dry run: đã quét dữ liệu liên quan tới người dùng'
        : 'Đã dọn dẹp dữ liệu liên quan tới người dùng thành công',
      data: {
        userId: numericUserId,
        email: user.email,
        deleteUserRecord,
        dryRun,
        deleted,
        scrubbed,
        affectedReviewItems: reviewTargets.size
      }
    };
  }

  async delete(id) {
    return this.permanentDeleteUser(id);
  }

  async permanentDeleteUser(userId) {
    const result = await this.purgeUserData(userId, {
      deleteUserRecord: true,
      dryRun: false
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      message: 'Đã xóa vĩnh viễn người dùng và tất cả dữ liệu liên quan',
      deleted: result.data.deleted,
      scrubbed: result.data.scrubbed,
      affectedReviewItems: result.data.affectedReviewItems
    };
  }

  async afterCreate(item) {
    try {
      const notificationService = require('./notification.service');
      // Notify admins about new signup
      await notificationService.notifyAdmins(
        'Thành viên mới! 👋',
        `Người dùng "${item.name}" vừa đăng ký tài khoản mới.`,
        'system'
      );
    } catch (e) {
      console.error('User registration notification failed', e);
    }
  }

  async afterUpdate(item) {
    try {
      const notificationService = require('./notification.service');
      // Check if password was updated (this is a bit tricky since item is the updated record)
      // For now, if updatedAt was just set, we could notify if a "passwordUpdated" flag was passed, 
      // but BaseService doesn't pass that.
      // However, we can notify the user that their profile has been updated.

      await notificationService.notify(
        item.id,
        'Cập nhật tài khoản 🔐',
        'Thông tin tài khoản của bạn vừa được cập nhật thành công.',
        'system'
      );
    } catch (e) {
      console.error('User update notification failed', e);
    }
  }
}

module.exports = new UserService();
