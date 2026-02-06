const BaseService = require('./BaseService');

/**
 * ReviewableService - Extension of BaseService for entities that require
 * a content approval workflow (Draft -> Pending -> Published/Rejected).
 */
class ReviewableService extends BaseService {
  constructor(collectionName) {
    super(collectionName);
  }

  // ==================== OVERRIDE METHODS ====================

  /**
   * Override findAll to include status filtering by default
   */
  async findAll(options = {}) {
    try {
      // Content Approval Logic: Default to 'published' for public users
      // Content Approval Logic: Default to 'published' for public users
      if (this.schema && this.schema.status) {
        if (!options.user || (options.user.role !== 'admin' && options.user.role !== 'researcher')) {
          if (!options.filter) options.filter = {};
          // Only show published content to public/customers
          if (!options.filter.status) {
            options.filter.status = 'published';
          }
        }
      }

      return await super.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  // ==================== REVIEW METHODS ====================

  /**
   * Submit item for review
   */
  async submitReview(id) {
    try {
      const result = await this.update(id, {
        status: 'pending',
        review_comment: null // Clear previous comments
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve item (status -> published)
   */
  async approveReview(id) {
    try {
      const updateData = {
        status: 'published',
        review_comment: null
      };

      // Automatically set publishDate if it exists in schema
      if (this.schema && this.schema.publishDate) {
        updateData.publishDate = new Date().toISOString();
      }

      const result = await this.update(id, updateData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject item (status -> rejected)
   */
  async rejectReview(id, comment) {
    try {
      const result = await this.update(id, {
        status: 'rejected',
        review_comment: comment || 'Nội dung chưa đạt yêu cầu.'
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revert item to draft status
   */
  async revertToDraft(id) {
    try {
      const result = await this.update(id, {
        status: 'draft',
        review_comment: null
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ReviewableService;
