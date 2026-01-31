const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class NotificationService extends BaseService {
  constructor() {
    super('notifications');
  }

  async getNotifications(userId, options = {}) {
    const result = await db.findAllAdvanced('notifications', {
      ...options,
      filter: {
        ...options.filter,
        userId: userId
      },
      sort: 'createdAt',
      order: 'desc'
    });

    const unreadCount = result.data.filter(n => !n.isRead).length;

    return {
      success: true,
      data: result.data,
      unreadCount,
      pagination: result.pagination
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await db.findById('notifications', notificationId);

    if (!notification || notification.userId !== userId) {
      return {
        success: false,
        message: 'Notification not found',
        statusCode: 404
      };
    }

    const updated = await db.update('notifications', notificationId, {
      isRead: true
    });

    return {
      success: true,
      data: updated
    };
  }


  async markAllAsRead(userId) {
    // This is a bit inefficient with JSON DB but works for now
    const notifications = await db.findAll('notifications');
    const userNotifications = notifications.filter(n => n.userId === userId && !n.isRead);

    for (const notif of userNotifications) {
      await db.update('notifications', notif.id, { isRead: true });
    }

    return {
      success: true,
      message: 'All notifications marked as read',
      count: userNotifications.length
    };
  }

  async deleteAll(userId) {
    const notifications = await db.findAll('notifications');
    const userNotificationIds = notifications
      .filter(n => n.userId === userId)
      .map(n => n.id);

    // Since JSON DB might not support bulk delete properly, we do loop or simple filter rewrite
    // Assuming simple delete loop for safety
    for (const id of userNotificationIds) {
      await db.delete('notifications', id);
    }

    return {
      success: true,
      message: 'All notifications deleted',
      count: userNotificationIds.length
    };
  }
}

module.exports = new NotificationService();
