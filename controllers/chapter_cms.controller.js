const ReviewableController = require('../utils/ReviewableController');
const chapterCMSService = require('../services/chapter_cms.service');

class ChapterCMSController extends ReviewableController {
  constructor() {
    super(chapterCMSService);
  }

  /**
   * PUT /api/admin/chapters/reorder
   * Reorder chapters for map display and progression flow.
   */
  reorderChapters = async (req, res, next) => {
    try {
      const { chapterIds } = req.body;

      if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input: chapterIds must be a non-empty array'
        });
      }

      const result = await chapterCMSService.reorderChapters(chapterIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ChapterCMSController();