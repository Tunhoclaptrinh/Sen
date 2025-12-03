/**
 * Unified Game Service - FIXED VERSION
 * Sửa lỗi duplicate methods, thêm missing implementations
 */

const db = require('../config/database');

class GameService {

  // ==================== INITIALIZATION ====================

  /**
   * Khởi tạo game progress cho user mới
   */
  async initializeProgress(userId) {
    const existing = db.findOne('game_progress', { user_id: userId });
    if (existing) return existing;

    return db.create('game_progress', {
      user_id: userId,
      current_chapter: 1,
      total_sen_petals: 0,
      total_points: 0,
      level: 1,
      coins: 1000,
      unlocked_chapters: [1],
      completed_levels: [],
      collected_characters: [],
      badges: [],
      achievements: [],
      museum_open: false,
      museum_income: 0,
      streak_days: 0,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  }

  // ==================== PROGRESS & STATS ====================

  /**
 * Lấy tiến độ game của user
 */
  async getProgress(userId) {
    let progress = db.findOne('game_progress', { user_id: userId });
    if (!progress) {
      progress = await this.initializeProgress(userId);
    }

    // Tính toán thống kê
    const totalChapters = db.findAll('game_chapters').length;
    const totalLevels = db.findAll('game_levels').length;

    return {
      success: true,
      data: {
        ...progress,
        stats: {
          completion_rate: Math.round((progress.completed_levels.length / totalLevels) * 100),
          chapters_unlocked: progress.unlocked_chapters.length,
          total_chapters: totalChapters,
          characters_collected: progress.collected_characters.length,
          total_badges: progress.badges.length
        }
      }
    };
  }

  // ==================== CHAPTERS ====================

  /**
 * Lấy danh sách chapters (cánh hoa sen)
 */
  async getChapters(userId) {
    const progress = await this.getProgress(userId);
    const chapters = db.findAll('game_chapters').sort((a, b) => a.order - b.order);

    const enriched = chapters.map(chapter => {
      const isUnlocked = progress.data.unlocked_chapters.includes(chapter.id);
      const levels = db.findMany('game_levels', { chapter_id: chapter.id });
      const completedCount = levels.filter(l =>
        progress.data.completed_levels.includes(l.id)
      ).length;

      return {
        ...chapter,
        is_unlocked: isUnlocked,
        total_levels: levels.length,
        completed_levels: completedCount,
        completion_rate: levels.length > 0
          ? Math.round((completedCount / levels.length) * 100)
          : 0,
        can_unlock: this.canUnlockChapter(chapter, progress.data)
      };
    });

    return { success: true, data: enriched };
  }

  /**
   * Kiểm tra có thể mở khóa chapter không
   */
  canUnlockChapter(chapter, progress) {
    if (chapter.required_petals === 0) return true;
    return progress.total_sen_petals >= chapter.required_petals;
  }

  /**
   * Chi tiết một chapter
   */
  async getChapterDetail(chapterId, userId) {
    const chapter = db.findById('game_chapters', chapterId);
    if (!chapter) {
      return { success: false, message: 'Chapter not found', statusCode: 404 };
    }

    const progress = await this.getProgress(userId);
    const levels = db.findMany('game_levels', { chapter_id: parseInt(chapterId) })
      .sort((a, b) => a.order - b.order);

    const enrichedLevels = levels.map(level => ({
      ...level,
      is_completed: progress.data.completed_levels.includes(level.id),
      is_locked: !this.canPlayLevel(level, progress.data),
      player_best_score: this.getBestScore(level.id, userId)
    }));

    return {
      success: true,
      data: {
        ...chapter,
        levels: enrichedLevels,
        is_unlocked: progress.data.unlocked_chapters.includes(chapter.id)
      }
    };
  }

  /**
   * Mở khóa chapter
   */
  async unlockChapter(chapterId, userId) {
    const chapter = db.findById('game_chapters', chapterId);
    if (!chapter) {
      return { success: false, message: 'Chapter not found', statusCode: 404 };
    }

    const progress = db.findOne('game_progress', { user_id: userId });

    if (progress.unlocked_chapters.includes(parseInt(chapterId))) {
      return { success: false, message: 'Chapter already unlocked', statusCode: 400 };
    }

    if (!this.canUnlockChapter(chapter, progress)) {
      return {
        success: false,
        message: `Need ${chapter.required_petals} sen petals to unlock`,
        statusCode: 400
      };
    }

    // Mở khóa chapter
    db.update('game_progress', progress.id, {
      unlocked_chapters: [...progress.unlocked_chapters, parseInt(chapterId)],
      current_chapter: parseInt(chapterId)
    });

    return {
      success: true,
      message: 'Chapter unlocked successfully',
      data: { chapter_id: parseInt(chapterId), chapter_name: chapter.name }
    };
  }

  // ==================== LEVELS ====================

  /**
 * Lấy danh sách levels trong chapter
 */
  async getLevels(chapterId, userId) {
    const progress = await this.getProgress(userId);
    const levels = db.findMany('game_levels', { chapter_id: parseInt(chapterId) })
      .sort((a, b) => a.order - b.order);

    const enriched = levels.map(level => ({
      id: level.id,
      name: level.name,
      type: level.type,
      difficulty: level.difficulty,
      order: level.order,
      thumbnail: level.thumbnail,
      is_completed: progress.data.completed_levels.includes(level.id),
      is_locked: !this.canPlayLevel(level, progress.data),
      rewards: level.rewards,
      required_level: level.required_level
    }));

    return { success: true, data: enriched };
  }

  /**
   * Kiểm tra có thể chơi level không
   */
  canPlayLevel(level, progress) {
    // Level đầu luôn chơi được
    if (level.order === 1) return true;
    if (level.required_level) {
      return progress.completed_levels.includes(level.required_level);
    }

    return true;
  }

  /**
   * Lấy best score của level
   */
  getBestScore(levelId, userId) {
    const sessions = db.findMany('game_sessions', {
      level_id: levelId,
      user_id: userId,
      status: 'completed'
    });

    if (sessions.length === 0) return null;

    return Math.max(...sessions.map(s => s.score || 0));
  }

  /**
   * Chi tiết level (màn chơi)
   */
  async getLevelDetail(levelId, userId) {
    const level = db.findById('game_levels', levelId);
    if (!level) {
      return { success: false, message: 'Level not found', statusCode: 404 };
    }

    const progress = await this.getProgress(userId);

    if (!this.canPlayLevel(level, progress.data)) {
      return { success: false, message: 'Level is locked', statusCode: 403 };
    }

    return {
      success: true,
      data: {
        ...level,
        is_completed: progress.data.completed_levels.includes(level.id),
        best_score: this.getBestScore(level.id, userId),
        play_count: db.findMany('game_sessions', {
          level_id: level.id,
          user_id: userId
        }).length
      }
    };
  }

  // ==================== SCREEN-BASED GAMEPLAY ====================

  /**
 * Bắt đầu chơi level
 */
  async startLevel(levelId, userId) {
    const level = db.findById('game_levels', levelId);
    if (!level) {
      return { success: false, message: 'Level not found', statusCode: 404 };
    }

    const progress = db.findOne('game_progress', { user_id: userId });
    if (!this.canPlayLevel(level, progress)) {
      return { success: false, message: 'Level is locked', statusCode: 403 };
    }

    // Validate screens structure
    if (!level.screens || level.screens.length === 0) {
      return { success: false, message: 'Level has no screens configured', statusCode: 500 };
    }

    const validation = this.validateScreensStructure(level.screens);
    if (!validation.success) {
      return validation;
    }

    const session = db.create('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress',
      current_screen_id: level.screens[0].id,
      current_screen_index: 0,
      collected_items: [],
      answered_questions: [],
      timeline_order: [],
      score: 0,
      total_screens: level.screens.length,
      completed_screens: [],
      screen_states: {},
      time_spent: 0,
      hints_used: 0,
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    });

    const firstScreen = this.enrichScreen(level.screens[0], session, 0, level.screens.length);

    return {
      success: true,
      message: 'Level started',
      data: {
        session_id: session.id,
        level: {
          id: level.id,
          name: level.name,
          description: level.description,
          total_screens: level.screens.length,
          ai_character: level.ai_character_id
            ? db.findById('game_characters', level.ai_character_id)
            : null
        },
        current_screen: firstScreen
      }
    };
  }

  /**
 * Thu thập manh mối
 */
  async collectClue(levelId, userId, clueId) {
    const session = db.findOne('game_sessions', {
      level_id: levelId,
      user_id: userId,
      status: 'in_progress'
    });

    if (!session) {
      return { success: false, message: 'No active session', statusCode: 404 };
    }

    const level = db.findById('game_levels', levelId);
    const currentScreen = level.screens[session.current_screen_index];

    if (currentScreen.type !== 'HIDDEN_OBJECT') {
      return { success: false, message: 'Not a hidden object screen', statusCode: 400 };
    }

    const item = currentScreen.items?.find(i => i.id === clueId);
    if (!item) {
      return { success: false, message: 'Item not found', statusCode: 404 };
    }

    if (session.collected_items.includes(clueId)) {
      return { success: false, message: 'Item already collected', statusCode: 400 };
    }

    const updatedSession = db.update('game_sessions', session.id, {
      collected_items: [...session.collected_items, clueId],
      score: session.score + (item.points || 10),
      last_activity: new Date().toISOString()
    });

    const requiredItems = currentScreen.required_items || currentScreen.items.length;
    const allCollected = updatedSession.collected_items.length >= requiredItems;

    return {
      success: true,
      message: 'Item collected',
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
   * Submit answer for QUIZ screen
   */
  async submitAnswer(sessionId, userId, answerId) {
    const session = db.findOne('game_sessions', {
      id: parseInt(sessionId),
      user_id: userId,
      status: 'in_progress'
    });

    if (!session) {
      return { success: false, message: 'Session not found', statusCode: 404 };
    }

    const level = db.findById('game_levels', session.level_id);
    const currentScreen = level.screens[session.current_screen_index];

    if (currentScreen.type !== 'QUIZ') {
      return { success: false, message: 'Current screen is not a quiz', statusCode: 400 };
    }

    // Check if already answered
    const hasAnswered = session.answered_questions.some(
      q => q.screen_id === currentScreen.id
    );

    if (hasAnswered) {
      return { success: false, message: 'Already answered this question', statusCode: 400 };
    }

    // Find answer
    const selectedOption = currentScreen.options?.find(o => o.text === answerId);
    if (!selectedOption) {
      return { success: false, message: 'Invalid answer', statusCode: 400 };
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
          points: pointsEarned,
          answered_at: new Date().toISOString()
        }
      ],
      score: session.score + pointsEarned,
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      message: isCorrect ? 'Correct answer!' : 'Wrong answer',
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
   * Navigate to next screen in level
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

    // Check if can proceed (completed current screen requirements)
    const canProceed = this.validateScreenCompletion(currentScreen, session);
    if (!canProceed.success) {
      return canProceed;
    }

    // Find next screen
    let nextScreenIndex = session.current_screen_index + 1;

    // Check if has custom next_screen_id
    if (currentScreen.next_screen_id) {
      nextScreenIndex = level.screens.findIndex(s => s.id === currentScreen.next_screen_id);
      if (nextScreenIndex === -1) {
        return {
          success: false,
          message: 'Invalid next_screen_id configuration',
          statusCode: 500
        };
      }
    }

    // Check if finished
    if (nextScreenIndex >= level.screens.length) {
      // Auto complete level
      return {
        success: false,
        message: 'Level completed. Please call completeLevel endpoint.',
        statusCode: 400,
        data: {
          level_finished: true,
          final_score: session.score
        }
      };
    }

    const nextScreen = level.screens[nextScreenIndex];

    // Update session
    const updatedSession = db.update('game_sessions', sessionId, {
      current_screen_id: nextScreen.id,
      current_screen_index: nextScreenIndex,
      completed_screens: [...session.completed_screens, currentScreen.id],
      last_activity: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Navigated to next screen',
      data: {
        session_id: session.id,
        current_screen: this.enrichScreen(nextScreen, updatedSession, nextScreenIndex, level.screens.length),
        progress: {
          completed_screens: updatedSession.completed_screens.length,
          total_screens: level.screens.length,
          percentage: Math.round((updatedSession.completed_screens.length / level.screens.length) * 100)
        }
      }
    };
  }

  /**
   * Validate if current screen is completed
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

      case 'TIMELINE':
        const hasOrdered = session.timeline_order && session.timeline_order.length > 0;
        if (!hasOrdered) {
          return {
            success: false,
            message: 'Must arrange timeline events first',
            statusCode: 400
          };
        }
        break;
    }

    return { success: true };
  }

  async completeLevel(levelId, userId, { score, timeSpent } = {}) {
    const session = db.findOne('game_sessions', {
      level_id: levelId,
      user_id: userId,
      status: 'in_progress'
    });

    if (!session) {
      return { success: false, message: 'No active session', statusCode: 404 };
    }

    const level = db.findById('game_levels', levelId);

    const timeBonus = this.calculateTimeBonus(timeSpent || session.time_spent, level.time_limit);
    const hintPenalty = session.hints_used * 5;
    const finalScore = Math.max(0, (score || session.score) + timeBonus - hintPenalty);
    const passed = finalScore >= (level.passing_score || 70);

    // Cập nhật session
    db.update('game_sessions', session.id, {
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
    const newCompleted = progress.completed_levels.includes(levelId)
      ? progress.completed_levels
      : [...progress.completed_levels, levelId];

    const rewards = level.rewards || {};
    const newPetals = progress.total_sen_petals + (rewards.petals || 1);
    const newCoins = progress.coins + (rewards.coins || 50);

    // Thêm character vào collection nếu có
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
        }
      }
    };
  }

  calculateTimeBonus(timeSpent, timeLimit) {
    if (!timeLimit) return 0;
    const remaining = timeLimit - timeSpent;
    return remaining > 0 ? Math.floor(remaining / 10) : 0;
  }

  // ==================== VALIDATION ====================

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

  // ==================== MUSEUM ====================

  async getMuseum(userId) {
    const progress = await this.getProgress(userId);

    return {
      success: true,
      data: {
        is_open: progress.data.museum_open,
        income_per_hour: this.calculateMuseumIncome(progress.data),
        total_income: progress.data.museum_income,
        characters: progress.data.collected_characters,
        visitor_count: progress.data.collected_characters.length * 10
      }
    };
  }

  /**
   * Tính thu nhập bảo tàng
   */
  calculateMuseumIncome(progress) {
    return progress.collected_characters.length * 5;
  }

  /**
   * Mở/đóng bảo tàng
   */
  async toggleMuseum(userId, isOpen) {
    const progress = db.findOne('game_progress', { user_id: userId });

    db.update('game_progress', progress.id, {
      museum_open: isOpen
    });

    return {
      success: true,
      message: `Museum ${isOpen ? 'opened' : 'closed'}`,
      data: {
        is_open: isOpen,
        income_per_hour: this.calculateMuseumIncome(progress)
      }
    };
  }

  // ==================== SCAN ====================


  /**
   * Scan object tại di tích
   */
  async scanObject(userId, code, location) {
    const artifact = db.findOne('scan_objects', { code: code.toUpperCase() });

    if (!artifact) {
      return { success: false, message: 'Invalid scan code', statusCode: 404 };
    }

    // Kiểm tra vị trí nếu có
    if (artifact.latitude && location.latitude) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        artifact.latitude,
        artifact.longitude
      );

      if (distance > 0.5) {
        return { success: false, message: 'You are too far from the location', statusCode: 400 };
      }
    }

    const progress = db.findOne('game_progress', { user_id: userId });

    const reward = {
      coins: artifact.reward_coins || 100,
      petals: artifact.reward_petals || 1,
      character: artifact.reward_character || null
    };

    let newCharacters = [...progress.collected_characters];
    if (reward.character && !newCharacters.includes(reward.character)) {
      newCharacters.push(reward.character);
    }

    db.update('game_progress', progress.id, {
      coins: progress.coins + reward.coins,
      total_sen_petals: progress.total_sen_petals + reward.petals,
      collected_characters: newCharacters
    });

    // Lưu scan history
    db.create('scan_history', {
      user_id: userId,
      object_id: artifact.id,
      location: location,
      scanned_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Scan successful!',
      data: { artifact, rewards: reward }
    };
  }

  /**
   * Tính khoảng cách GPS
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ==================== BADGES & ACHIEVEMENTS ====================

  /**
   * Lấy badges
   */
  async getBadges(userId) {
    const progress = await this.getProgress(userId);
    const allBadges = db.findAll('game_badges');

    const enriched = allBadges.map(badge => ({
      ...badge,
      is_unlocked: progress.data.badges.includes(badge.id)
    }));

    return { success: true, data: enriched };
  }

  async getAchievements(userId) {
    const progress = await this.getProgress(userId);
    const allAchievements = db.findAll('game_achievements');

    const enriched = allAchievements.map(achievement => ({
      ...achievement,
      is_completed: progress.data.achievements.includes(achievement.id)
    }));

    return { success: true, data: enriched };
  }

  // ==================== LEADERBOARD ====================

  /**
 * Bảng xếp hạng
 */
  async getLeaderboard(type = 'global', limit = 20) {
    const allProgress = db.findAll('game_progress')
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

    const leaderboard = allProgress.map((prog, index) => {
      const user = db.findById('users', prog.user_id);
      return {
        rank: index + 1,
        user_id: prog.user_id,
        user_name: user?.name || 'Unknown',
        user_avatar: user?.avatar,
        total_points: prog.total_points,
        level: prog.level,
        sen_petals: prog.total_sen_petals,
        characters_count: prog.collected_characters.length
      };
    });

    return { success: true, data: leaderboard };
  }

  /**
   * Phần thưởng hàng ngày
   */
  async getDailyReward(userId) {
    const progress = db.findOne('game_progress', { user_id: userId });
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = new Date(progress.last_login).toISOString().split('T')[0];

    if (today === lastLogin) {
      return { success: false, message: 'Daily reward already claimed', statusCode: 400 };
    }

    const reward = { coins: 50, petals: 1 };

    db.update('game_progress', progress.id, {
      coins: progress.coins + reward.coins,
      total_sen_petals: progress.total_sen_petals + reward.petals,
      last_login: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Daily reward claimed',
      data: reward
    };
  }

  // ==================== SHOP & INVENTORY ====================

  /**
   * Mua item trong shop
   */
  async purchaseItem(userId, itemId, quantity) {
    const item = db.findById('shop_items', itemId);
    if (!item) {
      return { success: false, message: 'Item not found', statusCode: 404 };
    }

    const progress = db.findOne('game_progress', { user_id: userId });
    const totalCost = item.price * quantity;

    if (progress.coins < totalCost) {
      return { success: false, message: 'Not enough coins', statusCode: 400 };
    }

    // Trừ tiền
    db.update('game_progress', progress.id, {
      coins: progress.coins - totalCost
    });

    let inventory = db.findOne('user_inventory', { user_id: userId });
    if (!inventory) {
      inventory = db.create('user_inventory', { user_id: userId, items: [] });
    }

    const existingItem = inventory.items.find(i => i.item_id === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      inventory.items.push({
        item_id: itemId,
        quantity: quantity,
        acquired_at: new Date().toISOString()
      });
    }

    db.update('user_inventory', inventory.id, { items: inventory.items });

    return {
      success: true,
      message: 'Purchase successful',
      data: {
        item,
        quantity,
        total_cost: totalCost,
        remaining_coins: progress.coins - totalCost
      }
    };
  }

  /**
   * Lấy inventory
   */
  async getInventory(userId) {
    const inventory = db.findOne('user_inventory', { user_id: userId });

    if (!inventory) {
      return { success: true, data: { items: [] } };
    }

    const enriched = inventory.items.map(item => {
      const itemData = db.findById('shop_items', item.item_id);
      return { ...item, ...itemData };
    });

    return { success: true, data: { items: enriched } };
  }

  /**
   * Sử dụng item
   */
  async useItem(userId, itemId, targetId) {
    const inventory = db.findOne('user_inventory', { user_id: userId });

    if (!inventory) {
      return { success: false, message: 'No inventory found', statusCode: 404 };
    }

    const item = inventory.items.find(i => i.item_id === itemId);
    if (!item || item.quantity <= 0) {
      return { success: false, message: 'Item not found or quantity is 0', statusCode: 400 };
    }

    const itemData = db.findById('shop_items', itemId);

    item.quantity -= 1;
    db.update('user_inventory', inventory.id, { items: inventory.items });

    return {
      success: true,
      message: 'Item used successfully',
      data: { item: itemData, effect: 'Applied successfully' }
    };
  }
}

module.exports = new GameService();