const ReviewableController = require('../utils/ReviewableController');
const chapterCMSService = require('../services/chapter_cms.service');

class ChapterCMSController extends ReviewableController {
  constructor() {
    super(chapterCMSService);
  }
}

module.exports = new ChapterCMSController();