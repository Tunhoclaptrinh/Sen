/**
 * Game Session Service - Xử lý screen-based gameplay
 * Tách riêng logic session để dễ maintain
 */

const db = require('../config/database');

class GameSessionService {

  // ==================== SESSION LIFECYCLE ====================

  /**
   * Tạo session mới khi bắt đầu level
   */
  async createSession(userId, levelId) {
    const level = db.findById('game_levels', levelId);
    if (!level || !level.screens || level.screens.length === 0) {
      return {
        success: false,
        message: 'Invalid level configuration',
        statusCode: 400
      };
    }

    // Validate level screens structure
    const validation = this.validateScreensStructure(level.screens);
    if (!validation.success) {
      return validation;
    }

    const session = db.create('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress',

      // Screen tracking
      current_screen_id: level.screens[0].id,
      current_screen_index: 0,
      completed_screens: [],
      screen_states: {}, // Lưu state của từng screen

      // Progress tracking
      collected_items: [],
      answered_questions: [],
      timeline_order: [],

      // Scoring
      score: 0,
      hints_used: 0,
      time_spent: 0,

      // Metadata
      total_screens: level.screens.length,
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        session_id: session.id,
        current_screen: this.enrichScreen(level.screens[0], session, 0, level.screens.length)
      }
    };
  }

  /**
   * Lấy session hiện tại
   */
  async getSession(sessionId, userId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId
    });

    if (!session) {
      return {
        success: false,
        message: 'Session not found',
        statusCode: 404
      };
    }

    const level = db.findById('game_levels', session.level_id);
    const currentScreen = level.screens[session.current_screen_index];

    return {
      success: true,
      data: {
        session,
        current_screen: this.enrichScreen(
          currentScreen,
          session,
          session.current_screen_index,
          level.screens.length
        ),
        progress: this.calculateProgress(session, level)
      }
    };
  }

  // ==================== SCREEN NAVIGATION ====================

  /**
   * Navigate to next screen
   */
  async nextScreen(sessionId, userId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId,
      status: 'in_progress'
    });

    if (!session) {
      return {
        success: false,
        message: 'Active session not found',
        statusCode: 404
      };
    }

    const level = db.findById('game_levels', session.level_id);
    const currentScreen = level.screens[session.current_screen_index];

    // Validate screen completion
    const canProceed = this.validateScreenCompletion(currentScreen, session);
    if (!canProceed.success) {
      return canProceed;
    }

    // Tìm next screen
    let nextIndex = session.current_screen_index + 1;

    // Support custom next_screen_id (branching)
    if (currentScreen.next_screen_id) {
      nextIndex = level.screens.findIndex(s => s.id === currentScreen.next_screen_id);
      if (nextIndex === -1) {
        return {
          success: false,
          message: 'Invalid next_screen_id configuration',
          statusCode: 500
        };
      }
    }

    // Check if level completed
    if (nextIndex >= level.screens.length) {
      return await this.completeLevel(sessionId, userId);
    }

    const nextScreen = level.screens[nextIndex];

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      current_screen_id: nextScreen.id,
      current_screen_index: nextIndex,
      completed_screens: [...session.completed_screens, currentScreen.id],
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Moved to next screen',
      data: {
        current_screen: this.enrichScreen(nextScreen, updatedSession, nextIndex, level.screens.length),
        progress: this.calculateProgress(updatedSession, level)
      }
    };
  }

  /**
   * Jump to specific screen (Admin/Debug)
   */
  async jumpToScreen(sessionId, userId, screenId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId
    });

    if (!session) {
      return { success: false, message: 'Session not found', statusCode: 404 };
    }

    const level = db.findById('game_levels', session.level_id);
    const targetIndex = level.screens.findIndex(s => s.id === screenId);

    if (targetIndex === -1) {
      return { success: false, message: 'Screen not found', statusCode: 404 };
    }

    db.update('game_sessions', sessionId, {
      current_screen_id: screenId,
      current_screen_index: targetIndex,
      last_activity: new Date().toISOString()
    });

    return { success: true, message: 'Jumped to screen' };
  }

  // ==================== SCREEN ACTIONS ====================

  /**
   * HIDDEN_OBJECT: Collect item
   */
  async collectItem(sessionId, userId, itemId) {
    const { session, level, currentScreen } = await this.getSessionContext(sessionId, userId);

    if (!session) return { success: false, message: 'Session not found', statusCode: 404 };
    if (currentScreen.type !== 'HIDDEN_OBJECT') {
      return { success: false, message: 'Not a hidden object screen', statusCode: 400 };
    }

    // Find item
    const item = currentScreen.items?.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found', statusCode: 404 };
    }

    // Check already collected
    if (session.collected_items.includes(itemId)) {
      return { success: false, message: 'Item already collected', statusCode: 400 };
    }

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      collected_items: [...session.collected_items, itemId],
      score: session.score + (item.points || 10),
      last_activity: new Date().toISOString()
    });

    // Check completion
    const requiredItems = currentScreen.required_items || currentScreen.items.length;
    const allCollected = updatedSession.collected_items.length >= requiredItems;

    return {
      success: true,
      data: {
        item,
        points_earned: item.points || 10,
        total_score: updatedSession.score,
        progress: {
          collected: updatedSession.collected_items.length,
          required: requiredItems,
          all_collected: allCollected
        }
      }
    };
  }

  /**
   * QUIZ: Submit answer
   */
  async submitAnswer(sessionId, userId, selectedOptionText) {
    const { session, level, currentScreen } = await this.getSessionContext(sessionId, userId);

    if (!session) return { success: false, message: 'Session not found', statusCode: 404 };
    if (currentScreen.type !== 'QUIZ') {
      return { success: false, message: 'Not a quiz screen', statusCode: 400 };
    }

    // Check already answered
    const alreadyAnswered = session.answered_questions.some(
      q => q.screen_id === currentScreen.id
    );
    if (alreadyAnswered) {
      return { success: false, message: 'Already answered', statusCode: 400 };
    }

    // Find option
    const selectedOption = currentScreen.options?.find(o => o.text === selectedOptionText);
    if (!selectedOption) {
      return { success: false, message: 'Invalid option', statusCode: 400 };
    }

    const isCorrect = selectedOption.is_correct;
    const pointsEarned = isCorrect ? (currentScreen.reward?.points || 20) : 0;

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      answered_questions: [
        ...session.answered_questions,
        {
          screen_id: currentScreen.id,
          answer: selectedOptionText,
          is_correct: isCorrect,
          points: pointsEarned,
          answered_at: new Date().toISOString()
        }
      ],
      score: session.score + pointsEarned,
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        is_correct: isCorrect,
        points_earned: pointsEarned,
        total_score: updatedSession.score,
        explanation: selectedOption.explanation,
        correct_answer: isCorrect ? null : currentScreen.options.find(o => o.is_correct)?.text
      }
    };
  }

  /**
   * TIMELINE: Submit order
   */
  async submitTimelineOrder(sessionId, userId, eventIds) {
    const { session, level, currentScreen } = await this.getSessionContext(sessionId, userId);

    if (!session) return { success: false, message: 'Session not found', statusCode: 404 };
    if (currentScreen.type !== 'TIMELINE') {
      return { success: false, message: 'Not a timeline screen', statusCode: 400 };
    }

    // Validate order
    const correctOrder = currentScreen.events
      .sort((a, b) => a.year - b.year)
      .map(e => e.id);

    const isCorrect = JSON.stringify(eventIds) === JSON.stringify(correctOrder);
    const pointsEarned = isCorrect ? (currentScreen.points_per_correct * eventIds.length) : 0;

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      timeline_order: eventIds,
      score: session.score + pointsEarned,
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        is_correct: isCorrect,
        points_earned: pointsEarned,
        total_score: updatedSession.score,
        correct_order: isCorrect ? null : correctOrder
      }
    };
  }

  /**
   * DIALOGUE: Mark as read
   */
  async markDialogueRead(sessionId, userId) {
    const { session, currentScreen } = await this.getSessionContext(sessionId, userId);

    if (!session) return { success: false, message: 'Session not found', statusCode: 404 };
    if (currentScreen.type !== 'DIALOGUE') {
      return { success: false, message: 'Not a dialogue screen', statusCode: 400 };
    }

    // Update screen state
    const screenStates = session.screen_states || {};
    screenStates[currentScreen.id] = { read: true, read_at: new Date().toISOString() };

    db.update('game_sessions', session.id, {
      screen_states: screenStates,
      last_activity: new Date().toISOString()
    });

    return { success: true, message: 'Dialogue marked as read' };
  }

  // ==================== LEVEL COMPLETION ====================

  /**
   * Complete level
   */
  async completeLevel(sessionId, userId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId
    });

    if (!session) {
      return { success: false, message: 'Session not found', statusCode: 404 };
    }

    const level = db.findById('game_levels', session.level_id);

    // Calculate final score
    const timeBonus = this.calculateTimeBonus(session.time_spent, level.time_limit);
    const hintPenalty = session.hints_used * 5;
    const finalScore = Math.max(0, session.score + timeBonus - hintPenalty);
    const passed = finalScore >= (level.passing_score || 70);

    // Update session
    db.update('game_sessions', sessionId, {
      status: 'completed',
      score: finalScore,
      completed_at: new Date().toISOString()
    });

    if (!passed) {
      return {
        success: true,
        message: 'Level completed but not passed',
        data: {
          passed: false,
          score: finalScore,
          required_score: level.passing_score || 70,
          can_retry: true
        }
      };
    }

    // Update user progress
    const progress = db.findOne('game_progress', { user_id: userId });
    const newCompleted = progress.completed_levels.includes(level.id)
      ? progress.completed_levels
      : [...progress.completed_levels, level.id];

    const rewards = level.rewards || {};
    const newPetals = progress.total_sen_petals + (rewards.petals || 1);
    const newCoins = progress.coins + (rewards.coins || 50);

    let newCharacters = [...progress.collected_characters];
    if (rewards.character && !newCharacters.includes(rewards.character)) {
      newCharacters.push(rewards.character);
    }

    db.update('game_progress', progress.id, {
      completed_levels: newCompleted,
      total_sen_petals: newPetals,
      total_points: progress.total_points + finalScore,
      coins: newCoins,
      collected_characters: newCharacters
    });

    return {
      success: true,
      message: 'Level completed successfully!',
      data: {
        passed: true,
        score: finalScore,
        time_bonus: timeBonus,
        hint_penalty: hintPenalty,
        rewards: {
          petals: rewards.petals || 1,
          coins: rewards.coins || 50,
          character: rewards.character || null
        },
        new_totals: {
          petals: newPetals,
          points: progress.total_points + finalScore,
          coins: newCoins
        }
      }
    };
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Validate screen completion requirements
   */
  validateScreenCompletion(screen, session) {
    switch (screen.type) {
      case 'HIDDEN_OBJECT':
        const requiredItems = screen.required_items || screen.items?.length || 0;
        const collectedCount = session.collected_items.filter(
          item => screen.items?.some(i => i.id === item)
        ).length;

        if (collectedCount < requiredItems) {
          return {
            success: false,
            message: `Need to collect ${requiredItems - collectedCount} more items`,
            statusCode: 400
          };
        }
        break;

      case 'QUIZ':
        const hasAnswered = session.answered_questions.some(
          q => q.screen_id === screen.id
        );
        if (!hasAnswered) {
          return {
            success: false,
            message: 'Must answer the question first',
            statusCode: 400
          };
        }
        break;

      case 'TIMELINE':
        if (!session.timeline_order || session.timeline_order.length === 0) {
          return {
            success: false,
            message: 'Must arrange timeline events first',
            statusCode: 400
          };
        }
        break;

      case 'DIALOGUE':
        if (!screen.skip_allowed && !screen.auto_advance) {
          const screenState = session.screen_states?.[screen.id];
          if (!screenState?.read) {
            return {
              success: false,
              message: 'Must read the dialogue first',
              statusCode: 400
            };
          }
        }
        break;
    }

    return { success: true };
  }

  /**
   * Validate screens structure
   */
  validateScreensStructure(screens) {
    if (!Array.isArray(screens) || screens.length === 0) {
      return {
        success: false,
        message: 'Screens must be a non-empty array',
        statusCode: 400
      };
    }

    const errors = [];
    const screenIds = new Set();

    screens.forEach((screen, index) => {
      if (!screen.id) {
        errors.push(`Screen ${index}: Missing id`);
      } else if (screenIds.has(screen.id)) {
        errors.push(`Screen ${index}: Duplicate id '${screen.id}'`);
      } else {
        screenIds.add(screen.id);
      }

      if (!screen.type) {
        errors.push(`Screen ${index}: Missing type`);
      }
    });

    if (errors.length > 0) {
      return { success: false, message: 'Invalid screens structure', errors };
    }

    return { success: true };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get session context (session + level + current screen)
   */
  async getSessionContext(sessionId, userId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId
    });

    if (!session) return { session: null };

    const level = db.findById('game_levels', session.level_id);
    const currentScreen = level.screens[session.current_screen_index];

    return { session, level, currentScreen };
  }

  /**
   * Enrich screen with metadata
   */
  enrichScreen(screen, session, index, totalScreens) {
    return {
      ...screen,
      index,
      is_first: index === 0,
      is_last: index === totalScreens - 1,
      is_completed: session.completed_screens.includes(screen.id),
      state: session.screen_states?.[screen.id] || {}
    };
  }

  /**
   * Calculate progress
   */
  calculateProgress(session, level) {
    return {
      completed_screens: session.completed_screens.length,
      total_screens: level.screens.length,
      percentage: Math.round((session.completed_screens.length / level.screens.length) * 100)
    };
  }

  /**
   * Calculate time bonus
   */
  calculateTimeBonus(timeSpent, timeLimit) {
    if (!timeLimit) return 0;
    const remaining = timeLimit - timeSpent;
    return remaining > 0 ? Math.floor(remaining / 10) : 0;
  }
}

module.exports = new GameSessionService();