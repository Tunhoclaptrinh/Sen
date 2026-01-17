/**
 * Screen CMS Controller
 * API endpoints cho management screens
 */

const screenService = require('../services/screen_cms.service');

class ScreenCMSController {
  
  /**
   * GET /api/admin/levels/:levelId/screens
   */
  getScreens = async (req, res, next) => {
    try {
      const result = await screenService.getScreens(req.params.levelId);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/levels/:levelId/screens/:screenId
   */
  getScreenDetail = async (req, res, next) => {
    try {
      const result = await screenService.getScreenById(
        req.params.levelId,
        req.params.screenId
      );
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/levels/:levelId/screens
   */
  addScreen = async (req, res, next) => {
    try {
      const result = await screenService.addScreen(
        req.params.levelId,
        req.body
      );
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/levels/:levelId/screens/:screenId
   */
  updateScreen = async (req, res, next) => {
    try {
      const result = await screenService.updateScreen(
        req.params.levelId,
        req.params.screenId,
        req.body
      );
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/levels/:levelId/screens/:screenId
   */
  deleteScreen = async (req, res, next) => {
    try {
      const result = await screenService.deleteScreen(
        req.params.levelId,
        req.params.screenId
      );
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/levels/:levelId/screens/reorder
   */
  reorderScreens = async (req, res, next) => {
    try {
      const { screenIds } = req.body;
      if (!Array.isArray(screenIds)) {
        return res.status(400).json({
          success: false,
          message: 'screenIds must be an array'
        });
      }

      const result = await screenService.reorderScreens(
        req.params.levelId,
        screenIds
      );
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ScreenCMSController();
