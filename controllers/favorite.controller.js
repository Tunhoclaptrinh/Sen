const BaseController = require('../utils/BaseController');
const favoriteService = require('../services/favorite.service');

class FavoriteController extends BaseController {
  constructor() {
    super(favoriteService);
  }

  getFavorites = async (req, res, next) => {
    try {
      const result = await this.service.getFavorites(req.user.id, req.parsedQuery);

      res.json({
        success: true,
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  addFavorite = async (req, res, next) => {
    try {
      const { type, id } = req.params;
      const result = await this.service.addFavorite(req.user.id, type, id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  removeFavorite = async (req, res, next) => {
    try {
      const { type, id } = req.params;
      const result = await this.service.removeFavorite(req.user.id, type, id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new FavoriteController();