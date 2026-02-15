const db = require('../config/database');
const reviewService = require('../services/review.service');

class ReviewController {
  getByType = async (req, res, next) => {
    try {
      let { type } = req.params;
      if (type === 'heritageSite' || type === 'heritage_site') type = 'heritage_site';

      if (!['heritage_site', 'artifact', 'exhibition', 'history_article'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type'
        });
      }

      const result = await reviewService.findByType(type, req.parsedQuery);

      // Populate user info for each review if needed (though findByType might already handle common fields)
      // BaseService.populateAuthor is handled in reviewService.findByType (via findAllAdvanced)

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

  getByItem = async (req, res, next) => {
    try {
      let { type, referenceId } = req.params;
      if (type === 'heritageSite' || type === 'heritage_site') type = 'heritage_site';

      if (!['heritage_site', 'artifact', 'exhibition', 'history_article'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type'
        });
      }

      const result = await reviewService.findByItem(type, referenceId, req.parsedQuery);
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

  create = async (req, res, next) => {
    try {
      const result = await reviewService.create({
        ...req.body,
        userId: req.user.id,
        createdAt: new Date().toISOString()
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Review created',
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const review = await db.findById('reviews', req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const result = await reviewService.update(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        message: 'Review updated',
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const review = await db.findById('reviews', req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      await reviewService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Review deleted'
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const result = await db.findAllAdvanced('reviews', req.parsedQuery);
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

  getById = async (req, res, next) => {
    try {
      const review = await db.findById('reviews', req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  };

  search = async (req, res, next) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query required'
        });
      }

      const result = await db.findAllAdvanced('reviews', {
        q: q,
        ...req.parsedQuery
      });

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

  getStats = async (req, res, next) => {
    try {
      const result = await reviewService.getStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  syncRatings = async (req, res, next) => {
    try {
      const result = await reviewService.recalculateAllRatings();
      res.json({
        success: true,
        message: 'All ratings recalculated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ReviewController();