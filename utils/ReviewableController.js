const BaseController = require('./BaseController');

/**
 * ReviewableController - Extension of BaseController for entities
 * that require content approval endpoints.
 */
class ReviewableController extends BaseController {
  constructor(service) {
    super(service);
  }

  /**
   * Submit item for review
   */
  submitReview = async (req, res, next) => {
    try {
      if (typeof this.service.submitReview !== 'function') {
        return res.status(501).json({ success: false, message: 'Review workflow not implemented for this resource' });
      }

      // [RBAC] Researcher: Check ownership before submitting
      if (req.user && req.user.role === 'researcher') {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({
              success: false,
              message: 'Bạn chỉ có quyền gửi duyệt tài nguyên do chính mình tạo.'
            });
          }
        }
      }

      const result = await this.service.submitReview(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve item
   */
  approveReview = async (req, res, next) => {
    try {
      if (typeof this.service.approveReview !== 'function') {
        return res.status(501).json({ success: false, message: 'Review workflow not implemented for this resource' });
      }
      const result = await this.service.approveReview(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject item
   */
  rejectReview = async (req, res, next) => {
    try {
      if (typeof this.service.rejectReview !== 'function') {
        return res.status(501).json({ success: false, message: 'Review workflow not implemented for this resource' });
      }
      const { comment } = req.body;
      const result = await this.service.rejectReview(req.params.id, comment);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revert item to draft
   */
  revertToDraft = async (req, res, next) => {
    try {
      // [RBAC] Researcher: Check ownership before reverting
      if (req.user && req.user.role === 'researcher') {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({
              success: false,
              message: 'Bạn chỉ có quyền hoàn về nháp tài nguyên do chính mình tạo.'
            });
          }
        }
      }

      const result = await this.service.revertToDraft(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ReviewableController;
