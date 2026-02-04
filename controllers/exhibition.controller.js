const ReviewableController = require('../utils/ReviewableController');
const exhibitionService = require('../services/exhibition.service');

class ExhibitionController extends ReviewableController {
  constructor() {
    super(exhibitionService);
  }

  getActive = async (req, res, next) => {
    try {
      const result = await this.service.getActiveExhibitions(req.parsedQuery);
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

module.exports = new ExhibitionController();
