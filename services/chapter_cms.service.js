const BaseService = require('../utils/BaseService');

class ChapterCMSService extends BaseService {
  constructor() {
    super('game_chapters'); // Tên collection trong db.json
  }
  async create(data) {
    // Auto-generate order if missing
    if (!data.order) {
      const result = await this.findAll();
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