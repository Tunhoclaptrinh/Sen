/**
 * Level Management Service - Cho phép Admin setup màn chơi nhanh
 * Hỗ trợ: Kịch bản, Screens, Assets, Cơ chế đa dạng
 */

const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class LevelManagementService extends BaseService {
  constructor() {
    super('game_levels');
  }

  // ==================== CMS: CREATE LEVEL ====================

  /**
   * Tạo level mới với screens configuration
   * Admin có thể setup nhanh theo template
   */
  async createLevel(data, creatorId) {
    try {
      // Validate screens structure
      const screensValidation = this.validateScreens(data.screens);
      if (!screensValidation.success) {
        return screensValidation;
      }

      // Auto-generate screen IDs if not provided
      const processedScreens = this.processScreens(data.screens);

      // Auto-assign order if not provided
      if (!data.order && data.chapter_id) {
        const existingLevels = await db.findMany('game_levels', { chapter_id: data.chapter_id });
        const maxOrder = existingLevels.reduce((max, lvl) => Math.max(max, lvl.order || 0), 0);
        data.order = maxOrder + 1;
      }

      // Create level
      const level = await this.create({
        ...data,
        screens: processedScreens,
        created_by: creatorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return level;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  // ==================== SCREENS VALIDATION ====================

  /**
   * Validate screens structure
   */
  validateScreens(screens) {
    if (!Array.isArray(screens) || screens.length === 0) {
      return {
        success: false,
        message: 'Screens must be a non-empty array'
      };
    }

    const errors = [];
    const screenIds = new Set();
    const allowedTypes = ['DIALOGUE', 'HIDDEN_OBJECT', 'QUIZ', 'TIMELINE', 'MEMORY', 'PUZZLE', 'VIDEO', 'IMAGE_VIEWER'];

    screens.forEach((screen, index) => {
      // Check required fields
      if (!screen.id) {
        errors.push(`Screen ${index}: Missing 'id' field`);
      } else {
        if (screenIds.has(screen.id)) {
          errors.push(`Screen ${index}: Duplicate screen ID '${screen.id}'`);
        }
        screenIds.add(screen.id);
      }

      if (!screen.type) {
        errors.push(`Screen ${index}: Missing 'type' field`);
      } else if (!allowedTypes.includes(screen.type)) {
        errors.push(`Screen ${index}: Invalid type '${screen.type}'. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate based on type
      switch (screen.type) {
        case 'HIDDEN_OBJECT':
          if (!screen.items || !Array.isArray(screen.items)) {
            errors.push(`Screen ${index}: HIDDEN_OBJECT requires 'items' array`);
          } else {
            screen.items.forEach((item, itemIdx) => {
              if (!item.coordinates) {
                errors.push(`Screen ${index}, Item ${itemIdx}: Missing 'coordinates'`);
              }
            });
          }
          break;

        case 'QUIZ':
          if (!screen.question) {
            errors.push(`Screen ${index}: QUIZ requires 'question' field`);
          }
          if (!screen.options || !Array.isArray(screen.options)) {
            errors.push(`Screen ${index}: QUIZ requires 'options' array`);
          }
          break;

        case 'DIALOGUE':
          if (!screen.content || !Array.isArray(screen.content)) {
            errors.push(`Screen ${index}: DIALOGUE requires 'content' array`);
          }
          break;
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Screens validation failed',
        errors
      };
    }

    return { success: true };
  }

  /**
   * Process screens: auto-generate IDs, validate flow
   */
  processScreens(screens) {
    return screens.map((screen, index) => {
      // Auto-generate ID if missing
      if (!screen.id) {
        screen.id = `screen_${String(index + 1).padStart(2, '0')}`;
      }

      // Workflow and Flow Linking
      screen.is_first = index === 0;

      if (index < screens.length - 1) {
        // Not the last screen: auto-link to next unless already linked
        if (!screen.next_screen_id) {
          screen.next_screen_id = screens[index + 1].id;
        }
        screen.is_last = false;
      } else {
        // Last screen in array
        screen.next_screen_id = null;
        screen.is_last = true;
      }

      // Add defaults based on type
      switch (screen.type) {
        case 'HIDDEN_OBJECT':
          screen.ai_hints_enabled = screen.ai_hints_enabled !== false;
          screen.required_items = screen.required_items || screen.items?.length || 0;
          break;

        case 'QUIZ':
          screen.time_limit = screen.time_limit || 60;
          screen.show_hint_after = screen.show_hint_after || 30;
          break;

        case 'DIALOGUE':
          screen.skip_allowed = screen.skip_allowed !== false;
          screen.auto_advance = screen.auto_advance || false;
          break;
      }

      return screen;
    });
  }

  // ==================== SCREEN MANAGEMENT (GRANULAR) ====================

  /**
   * Get all screens of a level
   */
  async getScreens(levelId) {
    const level = await this.findById(levelId);
    if (!level.success) return { success: false, message: 'Level not found', statusCode: 404 };

    return {
      success: true,
      data: level.data.screens || []
    };
  }

  /**
   * Add a single screen to level
   */
  async addScreen(levelId, screenData) {
    const levelRes = await this.findById(levelId);
    if (!levelRes.success) return { success: false, message: 'Level not found', statusCode: 404 };
    const level = levelRes.data;

    // Initialize screens if null
    const screens = level.screens || [];

    // Auto-generate ID if missing
    if (!screenData.id) {
      screenData.id = `screen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // Validate this single screen
    const validation = this.validateScreens([screenData]); // Reuse existing validator
    if (!validation.success) return validation;

    // Add to array
    screens.push(screenData);

    // Reprocess entire list to ensure correct linking and is_last flags
    const processedScreens = this.processScreens(screens);

    // Update level
    return this.update(levelId, {
      screens: processedScreens,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Update a specific screen
   */
  async updateScreen(levelId, screenId, screenData) {
    const levelRes = await this.findById(levelId);
    if (!levelRes.success) return { success: false, message: 'Level not found', statusCode: 404 };
    const level = levelRes.data;

    const screens = level.screens || [];
    const index = screens.findIndex(s => s.id === screenId);

    if (index === -1) {
      return { success: false, message: 'Screen not found', statusCode: 404 };
    }

    // Update fields
    screens[index] = { ...screens[index], ...screenData, id: screenId };

    // Reprocess entire list
    const processedScreens = this.processScreens(screens);

    return this.update(levelId, {
      screens: processedScreens,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Delete a screen
   */
  async deleteScreen(levelId, screenId) {
    const levelRes = await this.findById(levelId);
    if (!levelRes.success) return { success: false, message: 'Level not found', statusCode: 404 };
    const level = levelRes.data;

    let screens = level.screens || [];
    const initialLength = screens.length;
    screens = screens.filter(s => s.id !== screenId);

    if (screens.length === initialLength) {
      return { success: false, message: 'Screen not found', statusCode: 404 };
    }

    return this.update(levelId, {
      screens,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Reorder screens
   */
  async reorderScreens(levelId, screenIds) {
    const levelRes = await this.findById(levelId);
    if (!levelRes.success) return { success: false, message: 'Level not found', statusCode: 404 };
    const level = levelRes.data;

    const currentScreens = level.screens || [];
    const screenMap = new Map(currentScreens.map(s => [s.id, s]));

    const newScreens = [];
    for (const id of screenIds) {
      if (screenMap.has(id)) {
        newScreens.push(screenMap.get(id));
      }
    }

    // Append any missing screens (to be safe)
    currentScreens.forEach(s => {
      if (!newScreens.find(ns => ns.id === s.id)) {
        newScreens.push(s);
      }
    });

    return this.update(levelId, {
      screens: newScreens,
      updatedAt: new Date().toISOString()
    });
  }

  // ==================== CMS: TEMPLATES ====================

  /**
   * Get level templates cho Admin
   */
  async getLevelTemplates() {
    const templates = [
      {
        id: 'template_hidden_object',
        name: 'Hidden Object Game',
        description: 'Template cho game tìm đồ vật',
        screens: [
          {
            id: 'intro',
            type: 'DIALOGUE',
            content: [
              { speaker: 'AI', text: 'Hãy tìm các vật phẩm ẩn trong bức tranh!' }
            ],
            next_screen_id: 'gameplay'
          },
          {
            id: 'gameplay',
            type: 'HIDDEN_OBJECT',
            guide_text: 'Tìm {required_items} vật phẩm',
            items: [
              {
                id: 'item1',
                name: 'Vật phẩm 1',
                coordinates: { x: 10, y: 10, width: 5, height: 5 },
                fact_popup: 'Mô tả về vật phẩm',
                points: 10
              }
            ],
            next_screen_id: 'completion'
          },
          {
            id: 'completion',
            type: 'DIALOGUE',
            content: [
              { speaker: 'AI', text: 'Tuyệt vời! Bạn đã hoàn thành!' }
            ]
          }
        ]
      },
      {
        id: 'template_quiz',
        name: 'Quiz Level',
        description: 'Template cho màn quiz kiến thức',
        screens: [
          {
            id: 'intro',
            type: 'DIALOGUE',
            content: [
              { speaker: 'AI', text: 'Hãy trả lời các câu hỏi!' }
            ],
            next_screen_id: 'quiz1'
          },
          {
            id: 'quiz1',
            type: 'QUIZ',
            question: 'Câu hỏi 1?',
            options: [
              { text: 'Đáp án A', is_correct: false },
              { text: 'Đáp án B', is_correct: true }
            ],
            next_screen_id: 'quiz2'
          },
          {
            id: 'quiz2',
            type: 'QUIZ',
            question: 'Câu hỏi 2?',
            options: [
              { text: 'Đáp án A', is_correct: true },
              { text: 'Đáp án B', is_correct: false }
            ]
          }
        ]
      },
      {
        id: 'template_story',
        name: 'Story-Based Level',
        description: 'Template cho màn kể chuyện có tương tác',
        screens: [
          {
            id: 'scene1',
            type: 'DIALOGUE',
            background_image: 'scene1.jpg',
            content: [
              { speaker: 'AI', text: 'Ngày xửa ngày xưa...' }
            ],
            next_screen_id: 'scene2'
          },
          {
            id: 'scene2',
            type: 'IMAGE_VIEWER',
            image: 'artifact.jpg',
            caption: 'Đây là cổ vật quý',
            next_screen_id: 'quiz'
          },
          {
            id: 'quiz',
            type: 'QUIZ',
            question: 'Cổ vật này có ý nghĩa gì?',
            options: [
              { text: 'Ý nghĩa 1', is_correct: true },
              { text: 'Ý nghĩa 2', is_correct: false }
            ]
          }
        ]
      }
    ];

    return {
      success: true,
      data: templates
    };
  }

  /**
   * Clone level (tạo bản sao để chỉnh sửa)
   */
  async cloneLevel(levelId, newName) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const cloned = await this.create({
      ...level,
      id: undefined, // Let DB generate new ID
      name: newName || `${level.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return cloned;
  }

  // ==================== LEVEL PREVIEW ====================

  /**
   * Preview level (không tính progress)
   */
  async previewLevel(levelId) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    // Thêm metadata hữu ích cho preview
    const preview = {
      ...level,
      metadata: {
        total_screens: level.screens?.length || 0,
        screen_types: this.countScreenTypes(level.screens),
        estimated_time: this.estimatePlayTime(level.screens),
        difficulty_score: this.calculateDifficultyScore(level)
      }
    };

    return {
      success: true,
      data: preview
    };
  }

  countScreenTypes(screens) {
    const types = {};
    screens?.forEach(screen => {
      types[screen.type] = (types[screen.type] || 0) + 1;
    });
    return types;
  }

  estimatePlayTime(screens) {
    let time = 0;
    screens?.forEach(screen => {
      switch (screen.type) {
        case 'DIALOGUE':
          time += 30; // 30 seconds per dialogue
          break;
        case 'HIDDEN_OBJECT':
          time += 120; // 2 minutes
          break;
        case 'QUIZ':
          time += screen.time_limit || 60;
          break;
        case 'VIDEO':
          time += screen.duration || 60;
          break;
        default:
          time += 30;
      }
    });
    return time;
  }

  calculateDifficultyScore(level) {
    let score = 0;

    // Base difficulty
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    score += difficultyMap[level.difficulty] || 2;

    // Add complexity based on screens
    if (level.screens) {
      score += level.screens.length * 0.1;

      // Hidden object complexity
      const hiddenObjectScreens = level.screens.filter(s => s.type === 'HIDDEN_OBJECT');
      hiddenObjectScreens.forEach(screen => {
        score += (screen.items?.length || 0) * 0.2;
      });

      // Quiz complexity
      const quizScreens = level.screens.filter(s => s.type === 'QUIZ');
      score += quizScreens.length * 0.5;
    }

    return Math.min(10, Math.round(score)); // Scale 1-10
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk import levels from JSON
   */
  async bulkImportLevels(levelsData, chapterId) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < levelsData.length; i++) {
      const levelData = levelsData[i];
      try {
        await this.createLevel({
          ...levelData,
          chapter_id: chapterId
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          level: levelData.name,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      data: results
    };
  }

  /**
   * Reorder levels in chapter
   */
  async reorderLevels(chapterId, levelIdsInOrder) {
    for (let index = 0; index < levelIdsInOrder.length; index++) {
      const levelId = levelIdsInOrder[index];
      await db.update('game_levels', levelId, {
        order: index + 1,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: 'Levels reordered successfully'
    };
  }
}

module.exports = new LevelManagementService();