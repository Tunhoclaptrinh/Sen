const BaseController = require('../utils/BaseController');
const artifactService = require('../services/artifact.service');

class ArtifactController extends BaseController {
  constructor() {
    super(artifactService);
  }

  getByHeritageSite = async (req, res, next) => {
    try {
      const result = await this.service.findByHeritageSite(
        req.params.siteId,
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

  getByCategory = async (req, res, next) => {
    try {
      const result = await this.service.findByCategory(
        req.params.categoryId,
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
}

module.exports = new ArtifactController();