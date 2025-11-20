const BaseController = require('../utils/BaseController');
const heritageSiteService = require('../services/heritage_site.service');

class HeritageSiteController extends BaseController {
  constructor() {
    super(heritageSiteService);
  }

  nearbyHeritageSites = async (req, res, next) => {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude required'
        });
      }

      const result = await this.service.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        req.parsedQuery
      );

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

  getByPeriod = async (req, res, next) => {
    try {
      const { period } = req.params;
      const result = await this.service.findByPeriod(period, req.parsedQuery);

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

  getTimeline = async (req, res, next) => {
    try {
      const result = await this.service.getTimeline(req.params.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new HeritageSiteController();
