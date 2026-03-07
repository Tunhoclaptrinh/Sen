const ReviewableService = require('../utils/ReviewableService');
const chapterSchema = require('../schemas/game_chapter.schema');
const db = require('../config/database');

class ChapterCMSService extends ReviewableService {
  constructor() {
    super('game_chapters', chapterSchema); // Pass schema for validation
  }
  async create(data) {
    // Auto-generate order if missing
    if (!data.order) {
      const result = await this.findAll({ user: { role: 'admin' } });
      const chapters = result.data || [];
      const maxOrder = chapters.length > 0
        ? Math.max(...chapters.map(c => c.order || 0))
        : 0;
      data.order = maxOrder + 1;
    }



    return super.create(data);
  }

  /**
   * Transform data before create (called by BaseService.create)
   */
  async beforeCreate(data) {
    // Initial status for review workflow if not provided
    if (!data.status) data.status = 'draft';

    return super.beforeCreate(data);
  }

  /**
   * Reorder chapters by provided ID sequence.
   */
  async reorderChapters(chapterIdsInOrder = []) {
    for (let index = 0; index < chapterIdsInOrder.length; index++) {
      const chapterId = chapterIdsInOrder[index];
      await db.update('game_chapters', chapterId, {
        order: index + 1,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: 'Chapters reordered successfully'
    };
  }
}

module.exports = new ChapterCMSService();