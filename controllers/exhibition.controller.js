const BaseController = require('../utils/BaseController');
const exhibitionService = require('../services/exhibition.service');

class ExhibitionController extends BaseController {
  constructor() {
    super(exhibitionService);
  }

  getActive = async (req, res, next) => {
    try {
      const result = await this.service.getActiveExhibitions(req.parsedQuery);

      res.json({
        success: true,
        count: result.data.length,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ExhibitionController();
