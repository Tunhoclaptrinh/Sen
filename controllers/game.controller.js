/**
 * Game Controller - Xử lý game logic cho SEN
 * Quản lý Sen flowers, levels, game progression
 */

const db = require('../config/database');
const gameService = require('../services/game.service');

class GameController {
  /**
   * GET /api/game/progress
   * Lấy tiến độ chơi của user
   */
  getProgress = async (req, res, next) => {
    try {
      const result = await gameService.getProgress(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/chapters
   * Lấy danh sách chapters (lớp cánh hoa sen)
   */
  getChapters = async (req, res, next) => {
    try {
      const result = await gameService.getChapters(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/chapters/:id
   * Chi tiết một chapter
   */
  getChapterDetail = async (req, res, next) => {
    try {
      const result = await gameService.getChapterDetail(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/chapters/:id/unlock
   * Mở khóa chapter
   */
  unlockChapter = async (req, res, next) => {
    try {
      const result = await gameService.unlockChapter(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/levels/:chapterId
   * Lấy danh sách levels trong chapter
   */
  getLevels = async (req, res, next) => {
    try {
      const result = await gameService.getLevels(
        req.params.chapterId,
        req.user.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/levels/:id/detail
   * Chi tiết level (màn chơi)
   */
  getLevelDetail = async (req, res, next) => {
    try {
      const result = await gameService.getLevelDetail(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/levels/:id/start
   * Bắt đầu chơi level
   */
  startLevel = async (req, res, next) => {
    try {
      const result = await gameService.startLevel(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/levels/:id/collect-clue
   * Thu thập manh mối trong level
   */
  collectClue = async (req, res, next) => {
    try {
      const { clueId } = req.body;

      if (!clueId) {
        return res.status(400).json({
          success: false,
          message: 'Clue ID is required'
        });
      }

      const result = await gameService.collectClue(
        req.params.id,
        req.user.id,
        clueId
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/levels/:id/complete
   * Hoàn thành level
   */
  completeLevel = async (req, res, next) => {
    try {
      const { score, timeSpent } = req.body;

      const result = await gameService.completeLevel(
        req.params.id,
        req.user.id,
        { score, timeSpent }
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/museum
   * Lấy bộ sưu tập bảo tàng của user
   */
  getMuseum = async (req, res, next) => {
    try {
      const result = await gameService.getMuseum(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/museum/toggle
   * Mở/đóng bảo tàng để kiếm tiền
   */
  toggleMuseum = async (req, res, next) => {
    try {
      const { isOpen } = req.body;

      const result = await gameService.toggleMuseum(
        req.user.id,
        isOpen
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/badges
   * Lấy danh sách badges đã thu thập
   */
  getBadges = async (req, res, next) => {
    try {
      const result = await gameService.getBadges(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/achievements
   * Lấy danh sách achievements
   */
  getAchievements = async (req, res, next) => {
    try {
      const result = await gameService.getAchievements(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/scan
   * Scan QR code/object tại di tích thực tế
   */
  scanObject = async (req, res, next) => {
    try {
      const { code, latitude, longitude } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Scan code is required'
        });
      }

      const result = await gameService.scanObject(
        req.user.id,
        code,
        { latitude, longitude }
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/leaderboard
   * Bảng xếp hạng
   */
  getLeaderboard = async (req, res, next) => {
    try {
      const { type = 'global', limit = 20 } = req.query;

      const result = await gameService.getLeaderboard(
        type,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/daily-reward
   * Nhận phần thưởng hàng ngày
   */
  getDailyReward = async (req, res, next) => {
    try {
      const result = await gameService.getDailyReward(req.user.id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/shop/purchase
   * Mua items trong shop
   */
  purchaseItem = async (req, res, next) => {
    try {
      const { itemId, quantity = 1 } = req.body;

      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: 'Item ID is required'
        });
      }

      const result = await gameService.purchaseItem(
        req.user.id,
        itemId,
        quantity
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/game/inventory
   * Lấy túi đồ của user
   */
  getInventory = async (req, res, next) => {
    try {
      const result = await gameService.getInventory(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/game/inventory/use
   * Sử dụng item từ inventory
   */
  useItem = async (req, res, next) => {
    try {
      const { itemId, targetId } = req.body;

      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: 'Item ID is required'
        });
      }

      const result = await gameService.useItem(
        req.user.id,
        itemId,
        targetId
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new GameController();