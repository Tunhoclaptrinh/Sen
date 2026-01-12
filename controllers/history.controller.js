const BaseController = require('../utils/BaseController');
const historyService = require('../services/history.service');

class HistoryController extends BaseController {
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
}

module.exports = new HistoryController();
