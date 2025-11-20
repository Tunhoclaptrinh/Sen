const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class NotificationService extends BaseService {
  constructor() {
    super('notifications');
  }

  async getNotifications(userId, options = {}) {
    const result = db.findAllAdvanced('notifications', {
      ...options,
      filter: {
        ...options.filter,
        user_id: userId
      },
      sort: 'created_at',
      order: 'desc'
    });

    const unreadCount = result.data.filter(n => !n.is_read).length;

    return {
      success: true,
      data: result.data,
      unreadCount,
      pagination: result.pagination
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = db.findById('notifications', notificationId);

    if (!notification || notification.user_id !== userId) {
      return {
        success: false,
        message: 'Notification not found',
        statusCode: 404
      };
    }

    const updated = db.update('notifications', notificationId, {
      is_read: true
    });

    return {
      success: true,
      data: updated
    };
  }
}

module.exports = new NotificationService();