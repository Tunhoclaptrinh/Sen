const ReviewableController = require('../utils/ReviewableController');
const historyService = require('../services/history.service');

class HistoryController extends ReviewableController {
  constructor() {
    super(historyService);
  }

  getRelated = async (req, res, next) => {
    try {
      const result = await this.service.getRelated(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const result = await this.service.getStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new HistoryController();
