const collectionService = require('../services/collection.service');

class CollectionController {
  constructor() {
    this.service = collectionService;
  }

  getAll = async (req, res, next) => {
    try {
      // Use findMany to filter by userId
      const result = await this.service.findMany({ userId: req.user.id });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      // Use service.getById to get populated items
      const result = await this.service.getById(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      const collection = result.data;

      // Check ownership
      if (collection.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const collectionData = {
        ...req.body,
        userId: req.user.id,
        items: [], // Initialize empty items array
        totalItems: 0
      };

      const result = await this.service.create(collectionData);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      // First check ownership
      const check = await this.service.findById(req.params.id);
      if (!check.success) {
        return res.status(check.statusCode || 404).json(check);
      }

      if (check.data.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const result = await this.service.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      // Check ownership
      const check = await this.service.findById(req.params.id);
      if (!check.success) {
        return res.status(check.statusCode || 404).json(check);
      }

      if (check.data.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const result = await this.service.delete(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req, res, next) => {
    try {
      // Check ownership first
      const check = await this.service.findById(req.params.id);
      if (!check.success) return res.status(404).json(check);

      if (check.data.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

      // req.body: { id: number, type: 'heritage'|'artifact' }
      const itemData = req.body;
      if (!itemData.id || !itemData.type) {
        return res.status(400).json({ success: false, message: 'Item ID and Type are required' });
      }

      // Convert id to number just in case
      itemData.id = parseInt(itemData.id);

      const result = await this.service.addItem(req.params.id, itemData);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req, res, next) => {
    try {
      // Check ownership first
      const check = await this.service.findById(req.params.id);
      if (!check.success) return res.status(404).json(check);

      if (check.data.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

      const { itemId } = req.params;
      const { type } = req.query; // Pass type as query param: ?type=artifact

      if (!type) {
        return res.status(400).json({ success: false, message: 'Type query param is required' });
      }

      const result = await this.service.removeItem(req.params.id, itemId, type);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CollectionController();

