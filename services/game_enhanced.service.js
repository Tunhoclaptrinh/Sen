/**
 * Enhanced Game Service - Xử lý screen-based gameplay
 * Hỗ trợ: Navigation giữa screens, State management, Progress tracking
 */

const db = require('../config/database');

class EnhancedGameService {

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Bắt đầu level - Tạo session với screen tracking
   */
  async startLevel(levelId, userId) {
    const level = db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    // Check if level is unlocked
    const progress = db.findOne('game_progress', { user_id: userId });
    if (!this.canPlayLevel(level, progress)) {
      return {
        success: false,
        message: 'Level is locked',
        statusCode: 403
      };
    }

    // Create game session
    const session = db.create('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress',
      current_screen_id: level.screens[0]?.id || 'screen_01',
      current_screen_index: 0,
      collected_items: [],
      answered_questions: [],
      score: 0,
      total_screens: level.screens?.length || 0,
      completed_screens: [],
      time_spent: 0,
      hints_used: 0,
      started_at: new Date().toISOString()
    });

    // Get first screen data
    const firstScreen = level.screens[0];

    return {
      success: true,
      message: 'Level started',
      data: {
        session_id: session.id,
        level: {
          id: level.id,
          name: level.name,
          description: level.description,
          total_screens: level.screens?.length || 0,
          ai_character: level.ai_character_id
            ? db.findById('game_characters', level.ai_character_id)
            : null
        },
        current_screen: {
          ...firstScreen,
          index: 0,
          is_first: true,
          is_last: false
        }
      }
    };
  }

  /**
   * Navigate to next screen
   */
  async navigateToNextScreen(sessionId, userId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId,
      status: 'in_progress'
    });

    if (!session) {
      return {
        success: false,
        message: 'Session not found or already completed',
        statusCode: 404
      };
    }

    const level = db.findById('game_levels', session.level_id);
    const currentScreen = level.screens[session.current_screen_index];

    // Check if can proceed (đã hoàn thành yêu cầu của screen hiện tại chưa)
    const canProceed = this.validateScreenCompletion(currentScreen, session);
    if (!canProceed.success) {
      return canProceed;
    }

    // Tìm next screen
    let nextScreenIndex = session.current_screen_index + 1;

    // Check if has custom next_screen_id
    if (currentScreen.next_screen_id) {
      nextScreenIndex = level.screens.findIndex(s => s.id === currentScreen.next_screen_id);
    }

    // Check if finished
    if (nextScreenIndex >= level.screens.length) {
      return await this.completeLevel(sessionId, userId);
    }

    const nextScreen = level.screens[nextScreenIndex];

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      current_screen_id: nextScreen.id,
      current_screen_index: nextScreenIndex,
      completed_screens: [...session.completed_screens, currentScreen.id]
    });

    return {
      success: true,
      message: 'Navigated to next screen',
      data: {
        session_id: session.id,
        current_screen: {
          ...nextScreen,
          index: nextScreenIndex,
          is_first: nextScreenIndex === 0,
          is_last: nextScreenIndex === level.screens.length - 1
        },
        progress: {
          completed_screens: updatedSession.completed_screens.length,
          total_screens: level.screens.length,
          percentage: Math.round((updatedSession.completed_screens.length / level.screens.length) * 100)
        }
      }
    };
  }

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

      case 'DIALOGUE':
        // Dialogue screens can be skipped or auto-advanced
        if (!screen.skip_allowed && !screen.auto_advance) {
          // Check if user has read (implement read tracking if needed)
        }
        break;
    }

    return { success: true };
  }

  // ==================== SCREEN ACTIONS ====================

  /**
   * Collect item trong Hidden Object screen
   */
  async collectItem(sessionId, userId, itemId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId,
      status: 'in_progress'
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

    // Validate screen type
    if (currentScreen.type !== 'HIDDEN_OBJECT') {
      return {
        success: false,
        message: 'Current screen is not a hidden object game',
        statusCode: 400
      };
    }

    // Find item
    const item = currentScreen.items?.find(i => i.id === itemId);
    if (!item) {
      return {
        success: false,
        message: 'Item not found',
        statusCode: 404
      };
    }

    // Check if already collected
    if (session.collected_items.includes(itemId)) {
      return {
        success: false,
        message: 'Item already collected',
        statusCode: 400
      };
    }

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      collected_items: [...session.collected_items, itemId],
      score: session.score + (item.points || 10)
    });

    // Check if all items collected
    const requiredItems = currentScreen.required_items || currentScreen.items.length;
    const allCollected = updatedSession.collected_items.length >= requiredItems;

    return {
      success: true,
      message: 'Item collected',
      data: {
        item: item,
        points_earned: item.points || 10,
        total_score: updatedSession.score,
        progress: {
          collected: updatedSession.collected_items.length,
          required: requiredItems,
          all_collected: allCollected
        },
        points_earned: item.points,
        // Trigger AI chủ động nói chuyện khi nhặt được đồ
        ai_reaction_prompt: `Người chơi vừa tìm thấy ${item.name}. Hãy giải thích ngắn gọn về ý nghĩa của nó bằng giọng điệu của bạn.`
      }
    };
  }

  /**
   * Submit answer cho Quiz screen
   */
  async submitAnswer(sessionId, userId, answerId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId,
      status: 'in_progress'
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

    // Validate screen type
    if (currentScreen.type !== 'QUIZ') {
      return {
        success: false,
        message: 'Current screen is not a quiz',
        statusCode: 400
      };
    }

    // Check if already answered
    const hasAnswered = session.answered_questions.some(
      q => q.screen_id === currentScreen.id
    );

    if (hasAnswered) {
      return {
        success: false,
        message: 'Already answered this question',
        statusCode: 400
      };
    }

    // Find answer
    const selectedOption = currentScreen.options?.find(o => o.text === answerId);
    if (!selectedOption) {
      return {
        success: false,
        message: 'Invalid answer',
        statusCode: 400
      };
    }

    const isCorrect = selectedOption.is_correct;
    const pointsEarned = isCorrect ? (currentScreen.reward?.points || 20) : 0;

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      answered_questions: [
        ...session.answered_questions,
        {
          screen_id: currentScreen.id,
          answer: answerId,
          is_correct: isCorrect,
          points: pointsEarned
        }
      ],
      score: session.score + pointsEarned
    });

    return {
      success: true,
      message: isCorrect ? 'Correct answer!' : 'Wrong answer',
      data: {
        is_correct: isCorrect,
        points_earned: pointsEarned,
        total_score: updatedSession.score,
        correct_answer: isCorrect ? null : currentScreen.options.find(o => o.is_correct)?.text
      }
    };
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
      return {
        success: false,
        message: 'Session not found',
        statusCode: 404
      };
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

    // Update progress
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
        rewards: {
          petals: rewards.petals || 1,
          coins: rewards.coins || 50,
          character: rewards.character || null
        },
        new_totals: {
          petals: newPetals,
          points: progress.total_points + finalScore,
          coins: newCoins
        },
        unlocked_next_level: this.checkNextLevelUnlocked(level.id)
      }
    };
  }

  // ==================== HELPERS ====================

  canPlayLevel(level, progress) {
    if (level.order === 1) return true;
    if (level.required_level) {
      return progress.completed_levels.includes(level.required_level);
    }
    return true;
  }

  calculateTimeBonus(timeSpent, timeLimit) {
    if (!timeLimit) return 0;
    const remainingTime = timeLimit - timeSpent;
    if (remainingTime > 0) {
      return Math.floor(remainingTime / 10); // 1 point per 10 seconds saved
    }
    return 0;
  }

  checkNextLevelUnlocked(currentLevelId) {
    const currentLevel = db.findById('game_levels', currentLevelId);
    const nextLevel = db.findOne('game_levels', {
      chapter_id: currentLevel.chapter_id,
      order: currentLevel.order + 1
    });
    return nextLevel !== null;
  }
}

module.exports = new EnhancedGameService();