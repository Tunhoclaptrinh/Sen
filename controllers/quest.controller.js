const BaseController = require('../utils/BaseController');
const questService = require('../services/quest.service');

class QuestController extends BaseController {
  constructor() {
    super(questService);
  }

  getActive = async (req, res, next) => {
    try {
      const result = await this.service.getActiveQuests(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  start = async (req, res, next) => {
    try {
      const result = await this.service.startQuest(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateProgress = async (req, res, next) => {
    try {
      const { currentValue } = req.body;
      const result = await this.service.updateQuestProgress(req.params.id, req.user.id, currentValue);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  complete = async (req, res, next) => {
    try {
      const result = await this.service.completeQuest(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  claimReward = async (req, res, next) => {
    try {
      const result = await this.service.claimReward(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLeaderboard = async (req, res, next) => {
    try {
      const result = await this.service.getLeaderboard(10);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new QuestController();