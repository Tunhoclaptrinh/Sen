const ReviewableController = require('../utils/ReviewableController');
const artifactService = require('../services/artifact.service');

class ArtifactController extends ReviewableController {
  constructor() {
    super(artifactService);
  }

  getRelated = async (req, res, next) => {
    try {
      const result = await this.service.getRelated(parseInt(req.params.id));
      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }
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

module.exports = new ArtifactController();
