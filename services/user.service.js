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

  async permanentDeleteUser(userId) {
    const user = await db.findById('users', userId);

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy người dùng',
        statusCode: 404
      };
    }

    const deleted = {
      user: 1,
      gameProgress: 0,
      gameSessions: 0,
      userInventory: 0,
      scanHistory: 0,
      favorites: 0,
      collections: 0,
      notifications: 0
    };

    // Helper to delete many
    const deleteRelated = async (collection, filter) => {
      const items = await db.findMany(collection, filter);
      for (const item of items) {
        await db.delete(collection, item.id);
        const camelCollection = collection.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (deleted[camelCollection] !== undefined) deleted[camelCollection]++;
      }
    };

    // Delete all related data
    await deleteRelated('game_progress', { userId: userId });
    await deleteRelated('game_sessions', { userId: userId });
    await deleteRelated('user_inventory', { userId: userId });
    await deleteRelated('scan_history', { userId: userId });
    await deleteRelated('favorites', { userId: userId });
    await deleteRelated('collections', { userId: userId });
    await deleteRelated('notifications', { userId: userId });

    // Finally delete user
    await db.delete('users', userId);

    return {
      success: true,
      message: 'Đã xóa vĩnh viễn người dùng và tất cả dữ liệu liên quan',
      deleted
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
