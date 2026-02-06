/**
 * Base Controller - Xử lý HTTP requests/responses
 * Các controller khác sẽ extend class này
 */
class BaseController {
  constructor(service) {
    this.service = service;
  }

  /**
   * Helper to apply researcher content isolation filter
   */
  applyResearcherFilter(options, req) {
    // Only strictly isolate if the request is NOT searching for published content (Landing page)
    // Or if there is an explicit context indicating Management
    const isPublicQuery = options.filter && options.filter.status === 'published';
    const isManagementCall = req.headers['x-context'] === 'cms' || req.query.context === 'cms';

    if (req.user && req.user.role === 'researcher' && !isPublicQuery && isManagementCall) {
      options.filter = {
        ...(options.filter || {}),
        $or: [
          { createdBy: req.user.id },
          { created_by: req.user.id }
        ]
      };
    }
    // Note: If no filter is applied, child items/lists will show everything published + researcher's own drafts 
    // depending on other active filters (like status).
  }

  /**
   * Helper to check ownership for researcher
   */
  checkOwnership(item, req) {
    if (req.user && req.user.role === 'researcher') {
      const ownerId = item.createdBy || item.created_by;
      const isSystem = !ownerId || ownerId === 'system' || ownerId === 1 || ownerId === "1" || item.author === 'Hệ thống';

      // Researcher strict isolation: only their own items
      if (req.user.role === 'researcher' && isSystem) {
        return false;
      }

      if (!isSystem && String(ownerId) !== String(req.user.id)) {
        return false;
      }
    }
    return true;
  }

  /**
   * GET all records
   * Supports pagination, filtering, sorting, search
   */
  getAll = async (req, res, next) => {
    try {
      const options = { ...req.parsedQuery, user: req.user };

      // [RBAC] Researcher: Apply content isolation
      this.applyResearcherFilter(options, req);

      const result = await this.service.findAll(options);

      res.json({
        success: result.success,
        count: result.data ? (result.data.length || 0) : 0,
        data: result.data || [],
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET one by ID
   */
  getById = async (req, res, next) => {
    try {
      const result = await this.service.findById(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      // [RBAC] Researcher: Check ownership
      if (!this.checkOwnership(result.data, req)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem tài nguyên này.'
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST - Create new
   */
  create = async (req, res, next) => {
    try {
      // Autopopulate creator info if user is logged in
      if (req.user) {
        // Force createdBy to be current user for non-admins (e.g. researchers)
        // If admin, they might want to set it on behalf of someone (though rarely used here)
        if (req.user.role !== 'admin' || !req.body.createdBy) {
          req.body.createdBy = req.user.id;
        }
      }

      const result = await this.service.create(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT - Update
   */
  // update = async (req, res, next) => {
  //   try {
  //     const errors = this.validateRequest(req);
  //     if (errors) {
  //       return res.status(400).json({
  //         success: false,
  //         errors
  //       });
  //     }

  //     const result = await this.service.update(req.params.id, req.body);

  //     if (!result.success) {
  //       return res.status(result.statusCode || 400).json({
  //         success: false,
  //         message: result.message
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       message: result.message,
  //       data: result.data
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  /**
   * PUT - Update
   * Validation flow:
   * 1. Middleware validateFields() - CHỈ validate fields gửi lên
   * 2. Service.update() - Business validation
   */
  update = async (req, res, next) => {
    try {
      // [RBAC] Researcher: Check ownership
      if (req.user && req.user.role === 'researcher') {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({
              success: false,
              message: 'Bạn chỉ có quyền chỉnh sửa tài nguyên do chính mình tạo.'
            });
          }
        }
      }

      const result = await this.service.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE
   */
  delete = async (req, res, next) => {
    try {
      // [RBAC] Researcher: Check ownership
      if (req.user && req.user.role === 'researcher') {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({
              success: false,
              message: 'Bạn chỉ có quyền xóa tài nguyên do chính mình tạo.'
            });
          }
        }
      }

      const result = await this.service.delete(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET - Search
   */
  search = async (req, res, next) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await this.service.search(q, req.parsedQuery);

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

  /**
   * POST - Increment view count
   */
  incrementView = async (req, res, next) => {
    try {
      const result = await this.service.incrementView(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: 'View count incremented',
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };


  // ============= HELPERS =============

  /**
   * Validate express-validator results
   */
  validateRequest(req) {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return errors.array();
    }
    return null;
  }
}

module.exports = BaseController;