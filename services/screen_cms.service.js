/**
 * Screen CMS Service
 * Quản lý Screen độc lập (Atomic operations trên Level)
 */

const BaseService = require('../utils/BaseService');
const db = require('../config/database');
const levelService = require('./level_cms.service'); // Reuse validation logic

class ScreenCMSService extends BaseService {
  constructor() {
    super('game_levels'); // We are still manipulating the 'game_levels' collection
  }

  /**
   * Get all screens of a level
   */
  async getScreens(levelId) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    return {
      success: true,
      data: level.screens || []
    };
  }

  /**
   * Get single screen detail
   */
  async getScreenById(levelId, screenId) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const screen = level.screens?.find(s => s.id === screenId);
    if (!screen) {
      return {
        success: false,
        message: 'Screen not found',
        statusCode: 404
      };
    }

    return {
      success: true,
      data: screen
    };
  }

  /**
   * Add new screen to level
   */
  async addScreen(levelId, screenData) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    // Initialize screens array if not exists
    const currentScreens = level.screens || [];

    // Check duplicate ID
    if (currentScreens.some(s => s.id === screenData.id)) {
      return {
        success: false,
        message: `Screen ID '${screenData.id}' already exists`,
        statusCode: 400
      };
    }

    // Validate using LevelService logic
    // Wrap in array because validator expects array
    const validation = levelService.validateScreens([screenData]);
    if (!validation.success) {
      return validation;
    }

    // Process (auto defaults)
    const processed = levelService.processScreens([screenData]);
    const newScreen = processed[0];

    // Auto-link previous screen to this one
    // If there was a last screen, and it didn't have a nextScreenId
    if (currentScreens.length > 0) {
      const lastScreen = currentScreens[currentScreens.length - 1];
      if (!lastScreen.nextScreenId) {
        lastScreen.nextScreenId = newScreen.id;
      }
    }

    // Push new screen
    currentScreens.push(newScreen);

    // Save
    await db.update('game_levels', levelId, {
      screens: currentScreens,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Screen added successfully',
      data: newScreen
    };
  }

  /**
   * Update existing screen
   */
  async updateScreen(levelId, screenId, updateData) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const screens = level.screens || [];
    const index = screens.findIndex(s => s.id === screenId);

    if (index === -1) {
      return {
        success: false,
        message: 'Screen not found',
        statusCode: 404
      };
    }

    // Merge data
    const existingScreen = screens[index];
    const newScreenData = {
      ...existingScreen,
      ...updateData,
      id: screenId // Cannot change ID via update for now to avoid breaking links
    };

    // Validate
    const validation = levelService.validateScreens([newScreenData]);
    if (!validation.success) {
      return validation;
    }

    // Process defaults again to ensure integrity
    const processed = levelService.processScreens([newScreenData]);
    screens[index] = processed[0];

    // Save
    await db.update('game_levels', levelId, {
      screens: screens,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Screen updated successfully',
      data: screens[index]
    };
  }

  /**
   * Delete screen
   */
  async deleteScreen(levelId, screenId) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const screens = level.screens || [];
    const index = screens.findIndex(s => s.id === screenId);

    if (index === -1) {
      return {
        success: false,
        message: 'Screen not found',
        statusCode: 404
      };
    }

    // Remove
    screens.splice(index, 1);

    // Save
    await db.update('game_levels', levelId, {
      screens: screens,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Screen deleted successfully'
    };
  }

  /**
   * Reorder screens
   */
  async reorderScreens(levelId, screenIds) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const currentScreens = level.screens || [];

    // Verify all IDs exist
    const screenMap = new Map(currentScreens.map(s => [s.id, s]));
    const newScreens = [];

    for (const id of screenIds) {
      if (!screenMap.has(id)) {
        return {
          success: false,
          message: `Screen ID '${id}' not found in this level`,
          statusCode: 400
        };
      }
      newScreens.push(screenMap.get(id));
    }

    if (newScreens.length !== currentScreens.length) {
      return {
        success: false,
        message: 'Missing screens in reorder list',
        statusCode: 400
      };
    }

    // Auto-fix nextScreenId based on new order
    for (let i = 0; i < newScreens.length; i++) {
      if (i < newScreens.length - 1) {
        newScreens[i].nextScreenId = newScreens[i + 1].id;
      } else {
        delete newScreens[i].nextScreenId; // Last one has no next
      }
    }

    // Save
    await db.update('game_levels', levelId, {
      screens: newScreens,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Screens reordered successfully',
      data: newScreens
    };
  }
}

module.exports = new ScreenCMSService();
