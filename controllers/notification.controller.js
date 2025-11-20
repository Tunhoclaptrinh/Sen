const BaseController = require('../utils/BaseController');
const notificationService = require('../services/notification.service');

class NotificationController extends BaseController {
  constructor() {
    super(notificationService);
  }

  getNotifications = async (req, res, next) => {
    try {
      const result = await this.service.getNotifications(req.user.id, req.parsedQuery);

      res.json({
        success: true,
        count: result.data.length,
        unreadCount: result.unreadCount,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const result = await this.service.markAsRead(req.params.id, req.user.id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new NotificationController();