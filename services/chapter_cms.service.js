const ReviewableService = require('../utils/ReviewableService');
const chapterSchema = require('../schemas/game_chapter.schema');

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
}

module.exports = new ChapterCMSService();