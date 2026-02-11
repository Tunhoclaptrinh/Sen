const ReviewableController = require('../utils/ReviewableController');
const badgeService = require('../services/badge.service');

class BadgeController extends ReviewableController {
  constructor() {
    super(badgeService);
  }

  getStats = async (req, res, next) => {
    try {
      const result = await this.service.getStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new BadgeController();
