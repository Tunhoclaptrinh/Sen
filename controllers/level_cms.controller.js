/**
 * Level CMS Controller - Admin routes để quản lý levels
 */

const levelManagementService = require('../services/level_cms.service');
const { protect, authorize } = require('../middleware/auth.middleware');

class LevelCMSController {

  // ==================== BASIC CRUD ====================

  /**
   * POST /api/admin/levels
   * Tạo level mới với screens config
   */
  createLevel = async (req, res, next) => {
    try {
      const result = await levelManagementService.createLevel(
        req.body,
        req.user.id
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/levels/:id
   * Update level
   */
  updateLevel = async (req, res, next) => {
    try {
      // Validate screens nếu có update
      if (req.body.screens) {
        const validation = levelManagementService.validateScreens(req.body.screens);
        if (!validation.success) {
          return res.status(400).json(validation);
        }
        req.body.screens = levelManagementService.processScreens(req.body.screens);
      }

      const result = await levelManagementService.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/levels/:id
   */
  deleteLevel = async (req, res, next) => {
    try {
      const result = await levelManagementService.delete(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/levels
   * List all levels với filter
   */
  getAllLevels = async (req, res, next) => {
    try {
      const result = await levelManagementService.findAll(req.parsedQuery);

      res.json({
        success: true,
        count: result.data.length,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/levels/:id
   */
  getLevelDetail = async (req, res, next) => {
    try {
      const result = await levelManagementService.findById(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // ==================== TEMPLATES & HELPERS ====================

  /**
   * GET /api/admin/levels/templates
   * Lấy danh sách templates
   */
  getTemplates = async (req, res, next) => {
    try {
      const result = await levelManagementService.getLevelTemplates();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/levels/:id/clone
   * Clone level
   */
  cloneLevel = async (req, res, next) => {
    try {
      const { newName } = req.body;
      const result = await levelManagementService.cloneLevel(
        req.params.id,
        newName
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/levels/:id/preview
   * Preview level với metadata
   */
  previewLevel = async (req, res, next) => {
    try {
      const result = await levelManagementService.previewLevel(req.params.id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // ==================== BULK OPERATIONS ====================

  /**
   * POST /api/admin/levels/bulk/import
   * Import nhiều levels cùng lúc
   */
  bulkImport = async (req, res, next) => {
    try {
      const { levels, chapterId } = req.body;

      if (!levels || !Array.isArray(levels)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input: levels must be an array'
        });
      }

      const result = await levelManagementService.bulkImportLevels(levels, chapterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/chapters/:chapterId/levels/reorder
   * Sắp xếp lại thứ tự levels
   */
  reorderLevels = async (req, res, next) => {
    try {
      const { levelIds } = req.body;

      if (!levelIds || !Array.isArray(levelIds)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input: levelIds must be an array'
        });
      }

      const result = await levelManagementService.reorderLevels(
        req.params.chapterId,
        levelIds
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // ==================== VALIDATION ====================

  /**
   * POST /api/admin/levels/validate
   * Validate level structure (không tạo)
   */
  validateLevel = async (req, res, next) => {
    try {
      const { screens } = req.body;

      if (!screens) {
        return res.status(400).json({
          success: false,
          message: 'Screens data required'
        });
      }

      const result = levelManagementService.validateScreens(screens);

      if (!result.success) {
        return res.status(400).json(result);
      }

      const processed = levelManagementService.processScreens(screens);

      res.json({
        success: true,
        message: 'Validation passed',
        data: {
          original: screens,
          processed: processed,
          metadata: {
            totalScreens: processed.length,
            screenTypes: levelManagementService.countScreenTypes(processed),
            estimatedTime: levelManagementService.estimatePlayTime(processed)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== SCREEN MANAGEMENT ====================

  /**
   * GET /api/admin/levels/:id/screens
   */
  getScreens = async (req, res, next) => {
    try {
      const result = await levelManagementService.getScreens(req.params.id);
      if (!result.success) return res.status(result.statusCode || 404).json(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/levels/:id/screens
   */
  addScreen = async (req, res, next) => {
    try {
      const result = await levelManagementService.addScreen(
        req.params.id,
        req.body
      );
      if (!result.success) return res.status(result.statusCode || 400).json(result);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/levels/:id/screens/:screenId
   */
  updateScreen = async (req, res, next) => {
    try {
      const result = await levelManagementService.updateScreen(
        req.params.id,
        req.params.screenId,
        req.body
      );
      if (!result.success) return res.status(result.statusCode || 400).json(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/levels/:id/screens/:screenId
   */
  deleteScreen = async (req, res, next) => {
    try {
      const result = await levelManagementService.deleteScreen(
        req.params.id,
        req.params.screenId
      );
      if (!result.success) return res.status(result.statusCode || 404).json(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/levels/:id/screens/reorder
   */
  reorderScreens = async (req, res, next) => {
    try {
      const { screenIds } = req.body;
      const result = await levelManagementService.reorderScreens(
        req.params.id,
        screenIds
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // ==================== ASSETS MANAGEMENT ====================

  /**
   * GET /api/admin/levels/:id/assets
   * Lấy danh sách assets đang dùng trong level
   */
  getUsedAssets = async (req, res, next) => {
    try {
      const level = await levelManagementService.findById(req.params.id);

      if (!level.success) {
        return res.status(404).json(level);
      }

      const assets = {
        images: new Set(),
        audio: new Set(),
        video: new Set()
      };

      // Extract từ screens
      level.data.screens?.forEach(screen => {
        if (screen.backgroundImage) assets.images.add(screen.backgroundImage);
        if (screen.backgroundMusic) assets.audio.add(screen.backgroundMusic);
        if (screen.image) assets.images.add(screen.image);
        if (screen.video) assets.video.add(screen.video);

        // Items trong hidden object
        screen.items?.forEach(item => {
          if (item.image) assets.images.add(item.image);
          if (item.sound) assets.audio.add(item.sound);
        });
      });

      res.json({
        success: true,
        data: {
          images: Array.from(assets.images),
          audio: Array.from(assets.audio),
          video: Array.from(assets.video),
          total: assets.images.size + assets.audio.size + assets.video.size
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== STATISTICS ====================

  /**
   * GET /api/admin/levels/stats
   * Thống kê levels
   */
  getStats = async (req, res, next) => {
    try {
      const allLevels = await levelManagementService.findAll({});

      const stats = {
        total: allLevels.data.length,
        byDifficulty: {},
        byChapter: {},
        avgScreens: 0,
        avgPlayTime: 0
      };

      let totalScreens = 0;
      let totalTime = 0;

      allLevels.data.forEach(level => {
        // Count by difficulty
        stats.byDifficulty[level.difficulty] =
          (stats.byDifficulty[level.difficulty] || 0) + 1;



        // Count by chapter
        stats.byChapter[level.chapterId] =
          (stats.byChapter[level.chapterId] || 0) + 1;

        // Calculate averages
        totalScreens += level.screens?.length || 0;
        totalTime += levelManagementService.estimatePlayTime(level.screens);
      });

      stats.avgScreens = Math.round(totalScreens / allLevels.data.length);
      stats.avgPlayTime = Math.round(totalTime / allLevels.data.length);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new LevelCMSController();