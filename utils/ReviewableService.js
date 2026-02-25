const BaseService = require('./BaseService');
const notificationService = require('../services/notification.service');

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
   * Override findAll to include status filtering and auto-unpublish check
   */
  async findAll(options = {}) {
    try {
      // Periodic check for expired unpublish requests
      await this.autoUnpublishCheck();

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

  /**
   * Override findById to include auto-unpublish check
   */
  async findById(id) {
    try {
      await this.autoUnpublishCheck();
      let result = await super.findById(id);

      // Dynamic Level Population
      if (result.success && result.data) {
        result.data = await this.populateLevels(result.data);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Populate related game levels for an item based on many-to-many lookup
   */
  async populateLevels(item) {
    if (!item) return item;
    const enriched = { ...item };

    // Determine which field to filter game_levels by based on collection name
    let filterField;
    if (this.collection === 'heritage_sites') filterField = 'relatedHeritageIds';
    else if (this.collection === 'artifacts') filterField = 'relatedArtifactIds';
    else if (this.collection === 'history_articles') filterField = 'relatedHistoryIds';

    if (filterField) {
      try {
        const db = require('../config/database');
        const allLevels = await db.findAll('game_levels');
        const relatedLevelIds = Array.isArray(enriched.relatedLevelIds) ? enriched.relatedLevelIds : [];

        // A level is related if:
        // 1. Its filterField array contains the item's id (Level -> Entity)
        // 2. The item's relatedLevelIds contains the level's id (Entity -> Level)
        enriched.relatedLevels = allLevels.filter(level =>
          (Array.isArray(level[filterField]) && level[filterField].includes(Number(item.id))) ||
          (level[filterField] === Number(item.id)) ||
          relatedLevelIds.includes(Number(level.id))
        );
      } catch (err) {
        console.error(`[ReviewableService:${this.collection}] Failed to populate levels:`, err);
        enriched.relatedLevels = enriched.relatedLevels || [];
      }
    }

    return enriched;
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

      // Notify Admins
      if (result.success) {
        const item = result.data;
        await notificationService.notifyAdmins(
          'Nội dung mới cần duyệt',
          `"${item.name || item.title}" đã được gửi yêu cầu duyệt.`,
          this.collection === 'artifacts' ? 'artifact' :
            this.collection === 'heritage_sites' ? 'heritage' : 'history',
          id
        );
      }

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
        review_comment: null,
        unpublish_requested_at: null,
        unpublish_reason: null
      };

      // Automatically set publishDate if it exists in schema
      if (this.schema && this.schema.publishDate) {
        updateData.publishDate = new Date().toISOString();
      }

      const result = await this.update(id, updateData);

      // Notify Researcher
      if (result.success) {
        const item = result.data;
        const creatorId = item.createdBy || item.created_by;
        if (creatorId) {
          await notificationService.notify(
            creatorId,
            'Nội dung đã được duyệt',
            `Chúc mừng! "${item.name || item.title}" của bạn đã được phê duyệt và công khai.`,
            this.collection === 'artifacts' ? 'artifact' :
              this.collection === 'heritage_sites' ? 'heritage' : 'history',
            id
          );
        }

        // Broadcast to ALL users
        const typeLabel = this.collection === 'artifacts' ? 'cổ vật' :
          this.collection === 'heritage_sites' ? 'di sản' : 'nội dung';

        await notificationService.notifyAll(
          'Khám phá mới! ✨',
          `Một ${typeLabel} mới mang tên "${item.name || item.title}" vừa được ra mắt. Hãy khám phá ngay!`,
          this.collection === 'artifacts' ? 'artifact' :
            this.collection === 'heritage_sites' ? 'heritage' : 'history',
          id
        );
      }

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

      // Notify Researcher
      if (result.success) {
        const item = result.data;
        const creatorId = item.createdBy || item.created_by;
        if (creatorId) {
          await notificationService.notify(
            creatorId,
            'Nội dung bị từ chối',
            `Nội dung "${item.name || item.title}" của bạn không được phê duyệt: ${comment || 'Nội dung chưa đạt yêu cầu.'}`,
            this.collection === 'artifacts' ? 'artifact' :
              this.collection === 'heritage_sites' ? 'heritage' : 'history',
            id
          );
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request Unpublish (status -> unpublish_pending)
   */
  async requestUnpublish(id, reason) {
    try {
      const result = await this.update(id, {
        status: 'unpublish_pending',
        unpublish_reason: reason || 'Tác giả yêu cầu gỡ bài.',
        unpublish_requested_at: new Date().toISOString()
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revert item to draft status (Immediate / Admin approved)
   */
  async revertToDraft(id) {
    try {
      const result = await this.update(id, {
        status: 'draft',
        review_comment: null,
        unpublish_requested_at: null,
        unpublish_reason: null
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore to published status (Researcher canceled unpublish or Admin rejected it)
   * Unlike approveReview, this does NOT update publishDate if it already exists.
   */
  async restorePublished(id) {
    try {
      const result = await this.update(id, {
        status: 'published',
        unpublish_requested_at: null,
        unpublish_reason: null
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Auto-unpublish logic: If status is 'unpublish_pending' and 3 days passed, revert to draft.
   * This is called on-access (findAll/findById) since we use JSON database with no cron.
   */
  async autoUnpublishCheck() {
    try {
      // Get all items in unpublish_pending
      const pendingItems = await super.findAll({
        filter: { status: 'unpublish_pending' }
      });

      if (!pendingItems.success || !pendingItems.data.length) return;

      const now = new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

      for (const item of pendingItems.data) {
        const requestedAt = new Date(item.unpublish_requested_at);
        if (now - requestedAt >= threeDaysInMs) {
          console.log(`[Auto-Unpublish] Item ${item.id} has reached 3-day threshold. Reverting to draft.`);
          await this.revertToDraft(item.id);
        }
      }
    } catch (error) {
      console.error('[Auto-Unpublish Error]', error);
    }
  }
}

module.exports = ReviewableService;
