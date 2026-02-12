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

  /**
   * Helper to create a notification easily
   */
  async notify(userId, title, message, type, refId = null) {
    try {
      if (!userId) {
        console.error('[Notification] Cannot create notification: No userId provided');
        return null;
      }

      const notification = await db.create('notifications', {
        userId: Number(userId),
        title,
        message,
        type,
        refId: refId ? Number(refId) : null,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`[Notification] Sent to user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('[Notification] Error creating notification:', error);
      return null;
    }
  }

  /**
   * Direct notify to all admins
   */
  async notifyAdmins(title, message, type, refId = null) {
    try {
      const users = await db.findAll('users');
      const admins = users.filter(u => u.role?.toLowerCase() === 'admin');

      for (const admin of admins) {
        await this.notify(admin.id, title, message, type, refId);
      }
    } catch (error) {
      console.error('[Notification] Error notifying admins:', error);
    }
  }

  /**
   * Broadcast notify to all users
   */
  async notifyAll(title, message, type, refId = null) {
    try {
      const users = await db.findAll('users');
      // Limit broadcast to customers mainly, or everyone
      for (const user of users) {
        await this.notify(user.id, title, message, type, refId);
      }
    } catch (error) {
      console.error('[Notification] Error broadcasting notification:', error);
    }
  }
}

module.exports = new NotificationService();
