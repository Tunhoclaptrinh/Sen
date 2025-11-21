const db = require('../config/database');

class ExhibitionController {
  getAll = async (req, res, next) => {
    try {
      const result = db.findAllAdvanced('exhibitions', req.parsedQuery);
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
      const exhibition = db.findById('exhibitions', req.params.id);
      if (!exhibition) {
        return res.status(404).json({
          success: false,
          message: 'Exhibition not found'
        });
      }
      res.json({
        success: true,
        data: exhibition
      });
    } catch (error) {
      next(error);
    }
  };

  getActive = async (req, res, next) => {
    try {
      const now = new Date();
      const active = db.findAll('exhibitions').filter(e =>
        e.is_active &&
        new Date(e.start_date) <= now &&
        new Date(e.end_date) >= now
      );

      res.json({
        success: true,
        count: active.length,
        data: active
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const exhibition = db.create('exhibitions', {
        ...req.body,
        visitor_count: 0,
        createdAt: new Date().toISOString()
      });
      res.status(201).json({
        success: true,
        message: 'Exhibition created',
        data: exhibition
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const exhibition = db.findById('exhibitions', req.params.id);
      if (!exhibition) {
        return res.status(404).json({
          success: false,
          message: 'Exhibition not found'
        });
      }

      const updated = db.update('exhibitions', req.params.id, req.body);
      res.json({
        success: true,
        message: 'Exhibition updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const exhibition = db.findById('exhibitions', req.params.id);
      if (!exhibition) {
        return res.status(404).json({
          success: false,
          message: 'Exhibition not found'
        });
      }

      db.delete('exhibitions', req.params.id);
      res.json({
        success: true,
        message: 'Exhibition deleted'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ExhibitionController();