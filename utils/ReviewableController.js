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

      // [RBAC] Check ownership before submitting (Admins and Researchers)
      if (req.user) {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          // Only owner can submit
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
   * [OVERRIDE] Update item - Adds status-based security for researchers
   */
  update = async (req, res, next) => {
    try {
      // [RBAC] Researcher Security Audit
      if (req.user && req.user.role === 'researcher') {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;

          // 1. Ownership Check (Already in Base but we repeat for clarity/safety)
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa tài nguyên này.' });
          }

          // 2. Status Check
          if (item.status === 'published') {
            return res.status(403).json({
              success: false,
              message: 'Nội dung đã xuất bản không thể chỉnh sửa trực tiếp. Vui lòng gỡ bài về Nháp trước.'
            });
          }

          if (item.status === 'pending') {
            return res.status(403).json({
              success: false,
              message: 'Nội dung đang chờ duyệt không thể chỉnh sửa. Vui lòng rút yêu cầu về Nháp trước.'
            });
          }

          if (item.status === 'unpublish_pending') {
            // EXCEPTION: Only allow updating 'isActive' toggle
            const allowedFields = ['isActive'];
            const sentFields = Object.keys(req.body);
            const hasForbiddenFields = sentFields.some(f => !allowedFields.includes(f));

            if (hasForbiddenFields) {
              return res.status(403).json({
                success: false,
                message: 'Chỉ có thể thay đổi trạng thái ẩn/hiện khi đang chờ gỡ bài.'
              });
            }
          }
        }
      }

      // Instead of super.update(req, res, next), perform base logic directly 
      // because BaseController.update is an arrow function and not accessible via 'super'.
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
   * Approve item (Published)
   */
  approveReview = async (req, res, next) => {
    try {
      if (typeof this.service.approveReview !== 'function') {
        return res.status(501).json({ success: false, message: 'Review workflow not implemented for this resource' });
      }

      const itemResult = await this.service.findById(req.params.id);
      if (itemResult.success && itemResult.data.status === 'unpublish_pending') {
        // If it was an unpublish request being approved -> it goes to Draft
        const result = await this.service.revertToDraft(req.params.id);
        return res.json(result);
      }

      const result = await this.service.approveReview(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject item (Rejected/Draft)
   */
  rejectReview = async (req, res, next) => {
    try {
      if (typeof this.service.rejectReview !== 'function') {
        return res.status(501).json({ success: false, message: 'Review workflow not implemented for this resource' });
      }

      // Check if it's rejecting an unpublish request
      const itemResult = await this.service.findById(req.params.id);
      if (itemResult.success && itemResult.data.status === 'unpublish_pending') {
        // If it was an unpublish request being rejected -> it goes back to Published
        const result = await this.service.restorePublished(req.params.id);
        return res.json(result);
      }

      const { comment } = req.body;
      const result = await this.service.rejectReview(req.params.id, comment);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request unpublish (status -> unpublish_pending)
   */
  requestUnpublish = async (req, res, next) => {
    try {
      const { reason } = req.body;

      // [RBAC] Check ownership
      if (req.user) {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;
          const ownerId = item.createdBy || item.created_by;
          if (ownerId && String(ownerId) !== String(req.user.id)) {
            return res.status(403).json({
              success: false,
              message: 'Bạn chỉ có quyền yêu cầu gỡ tài nguyên do chính mình tạo.'
            });
          }
        }
      }

      if (typeof this.service.requestUnpublish !== 'function') {
        return res.status(501).json({ success: false, message: 'Unpublish workflow not implemented for this resource' });
      }

      const result = await this.service.requestUnpublish(req.params.id, reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revert item to draft (Admin approved unpublish)
   */
  revertToDraft = async (req, res, next) => {
    try {
      // [RBAC] Author can only revert PENDING items (cancel submission)
      // Admin can revert PUBLISHED/UNPUBLISH_PENDING items
      if (req.user) {
        const itemResult = await this.service.findById(req.params.id);
        if (itemResult.success) {
          const item = itemResult.data;

          // If author is cancelling a request - ALLOW
          if (item.status === 'pending' || item.status === 'unpublish_pending') {
            const ownerId = item.createdBy || item.created_by;
            if (ownerId && String(ownerId) === String(req.user.id)) {
              // Proceed based on sub-status
              if (item.status === 'unpublish_pending') {
                // If canceling unpublish request, restore to Published
                const result = await this.service.restorePublished(req.params.id);
                return res.json(result);
              }
            } else if (req.user.role !== 'admin') {
              return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này.'
              });
            }
          } else if (req.user.role !== 'admin') {
            // Published items can only be "Request Unpublish" by author
            return res.status(403).json({
              success: false,
              message: 'Nội dung đã xuất bản chỉ có thể yêu cầu gỡ bài (Chờ phê duyệt).'
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
