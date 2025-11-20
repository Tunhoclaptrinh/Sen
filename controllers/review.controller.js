const BaseController = require('../utils/BaseController');
const reviewService = require('../services/review.service');

class ReviewController extends BaseController {
  constructor() {
    super(reviewService);
  }

  getByType = async (req, res, next) => {
    try {
      const { type } = req.params;
      const result = await this.service.findByType(type, req.parsedQuery);

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

module.exports = new ReviewController();