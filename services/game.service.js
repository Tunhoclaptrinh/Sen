/**
 * Game Service - Business logic cho SEN game
 */

const db = require('../config/database');

class GameService {
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
      coins: 1000, // Tiền game
      unlocked_chapters: [1], // Chapter 1 mở sẵn
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

  /**
   * Lấy danh sách chapters (cánh hoa sen)
   */
  async getChapters(userId) {
    const progress = await this.getProgress(userId);
    const chapters = db.findAll('game_chapters')
      .sort((a, b) => a.order - b.order);

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

    return {
      success: true,
      data: enriched
    };
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
      return {
        success: false,
        message: 'Chapter not found',
        statusCode: 404
      };
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
      return {
        success: false,
        message: 'Chapter not found',
        statusCode: 404
      };
    }

    const progress = db.findOne('game_progress', { user_id: userId });

    if (progress.unlocked_chapters.includes(parseInt(chapterId))) {
      return {
        success: false,
        message: 'Chapter already unlocked',
        statusCode: 400
      };
    }

    if (!this.canUnlockChapter(chapter, progress)) {
      return {
        success: false,
        message: `Need ${chapter.required_petals} sen petals to unlock`,
        statusCode: 400
      };
    }

    // Mở khóa chapter
    const updated = db.update('game_progress', progress.id, {
      unlocked_chapters: [...progress.unlocked_chapters, parseInt(chapterId)],
      current_chapter: parseInt(chapterId)
    });

    return {
      success: true,
      message: 'Chapter unlocked successfully',
      data: {
        chapter_id: parseInt(chapterId),
        chapter_name: chapter.name
      }
    };
  }

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

    return {
      success: true,
      data: enriched
    };
  }

  /**
   * Kiểm tra có thể chơi level không
   */
  canPlayLevel(level, progress) {
    // Level đầu luôn chơi được
    if (level.order === 1) return true;

    // Kiểm tra level trước đã hoàn thành chưa
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
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const progress = await this.getProgress(userId);

    if (!this.canPlayLevel(level, progress.data)) {
      return {
        success: false,
        message: 'Level is locked',
        statusCode: 403
      };
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

  /**
   * Bắt đầu chơi level
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

    // Tạo game session
    const session = db.create('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress',
      collected_clues: [],
      score: 0,
      time_spent: 0,
      started_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Level started',
      data: {
        session_id: session.id,
        level: level
      }
    };
  }

  /**
   * Thu thập manh mối
   */
  async collectClue(levelId, userId, clueId) {
    const level = db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    // Tìm session hiện tại
    const session = db.findOne('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress'
    });

    if (!session) {
      return {
        success: false,
        message: 'No active session found',
        statusCode: 404
      };
    }

    // Kiểm tra clue có trong level không
    const clue = level.clues?.find(c => c.id === clueId);
    if (!clue) {
      return {
        success: false,
        message: 'Invalid clue',
        statusCode: 400
      };
    }

    // Kiểm tra đã collect chưa
    if (session.collected_clues.includes(clueId)) {
      return {
        success: false,
        message: 'Clue already collected',
        statusCode: 400
      };
    }

    // Cập nhật session
    const updated = db.update('game_sessions', session.id, {
      collected_clues: [...session.collected_clues, clueId],
      score: session.score + (clue.points || 10)
    });

    // Kiểm tra đã collect đủ chưa
    const allCollected = updated.collected_clues.length === level.clues.length;

    return {
      success: true,
      message: 'Clue collected',
      data: {
        clue: clue,
        progress: `${updated.collected_clues.length}/${level.clues.length}`,
        all_collected: allCollected,
        current_score: updated.score
      }
    };
  }

  /**
   * Hoàn thành level
   */
  async completeLevel(levelId, userId, { score, timeSpent }) {
    const level = db.findById('game_levels', levelId);
    if (!level) {
      return {
        success: false,
        message: 'Level not found',
        statusCode: 404
      };
    }

    const session = db.findOne('game_sessions', {
      user_id: userId,
      level_id: levelId,
      status: 'in_progress'
    });

    if (!session) {
      return {
        success: false,
        message: 'No active session',
        statusCode: 404
      };
    }

    // Cập nhật session
    db.update('game_sessions', session.id, {
      status: 'completed',
      score: score || session.score,
      time_spent: timeSpent || 0,
      completed_at: new Date().toISOString()
    });

    // Cập nhật progress
    const progress = db.findOne('game_progress', { user_id: userId });

    const newCompleted = progress.completed_levels.includes(levelId)
      ? progress.completed_levels
      : [...progress.completed_levels, levelId];

    const newPetals = progress.total_sen_petals + (level.rewards?.petals || 1);
    const newPoints = progress.total_points + (score || 0);
    const newCoins = progress.coins + (level.rewards?.coins || 50);

    // Thêm character vào collection nếu có
    let newCharacters = [...progress.collected_characters];
    if (level.rewards?.character && !newCharacters.includes(level.rewards.character)) {
      newCharacters.push(level.rewards.character);
    }

    db.update('game_progress', progress.id, {
      completed_levels: newCompleted,
      total_sen_petals: newPetals,
      total_points: newPoints,
      coins: newCoins,
      collected_characters: newCharacters
    });

    return {
      success: true,
      message: 'Level completed',
      data: {
        level_name: level.name,
        score: score || session.score,
        rewards: {
          petals: level.rewards?.petals || 1,
          coins: level.rewards?.coins || 50,
          character: level.rewards?.character || null
        },
        new_totals: {
          petals: newPetals,
          points: newPoints,
          coins: newCoins
        }
      }
    };
  }

  /**
   * Lấy bảo tàng của user
   */
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
    return progress.collected_characters.length * 5; // 5 coins/character/hour
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

  /**
   * Scan object tại di tích
   */
  async scanObject(userId, code, location) {
    // Tìm heritage site hoặc artifact từ code
    const artifact = db.findOne('scan_objects', { code: code.toUpperCase() });
    // XỬ LÝ PHẦN THƯỞNG ĐẶC BIỆT: HIDDEN PETAL
    const objectData = db.findOne('scan_objects', { code: code.toUpperCase() });

    if (!artifact) {
      return {
        success: false,
        message: 'Invalid scan code',
        statusCode: 404
      };
    }

    // Kiểm tra vị trí nếu có
    if (artifact.latitude && location.latitude) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        artifact.latitude,
        artifact.longitude
      );

      if (distance > 0.5) { // 500m
        return {
          success: false,
          message: 'You are too far from the location',
          statusCode: 400
        };
      }
    }

    // Nếu là vật phẩm đặc biệt mở khóa Chapter ẩn
    if (objectData.unlocks_hidden_chapter_id) {
      const progress = db.findOne('game_progress', { user_id: userId });
      const hiddenChapterId = objectData.unlocks_hidden_chapter_id;

      if (!progress.unlocked_chapters.includes(hiddenChapterId)) {
        db.update('game_progress', progress.id, {
          unlocked_chapters: [...progress.unlocked_chapters, hiddenChapterId],
          // Thông báo đặc biệt
          special_event: "HIDDEN_LOTUS_PETAL_REVEALED"
        });
      }
    }

    // Thưởng cho user
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
      data: {
        artifact: artifact,
        rewards: reward
      }
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

  /**
   * Lấy badges
   */
  async getBadges(userId) {
    const progress = await this.getProgress(userId);
    const allBadges = db.findAll('game_badges');

    const enriched = allBadges.map(badge => ({
      ...badge,
      is_unlocked: progress.data.badges.includes(badge.id),
      unlock_date: this.getBadgeUnlockDate(badge.id, userId)
    }));

    return {
      success: true,
      data: enriched
    };
  }

  getBadgeUnlockDate(badgeId, userId) {
    // Implementation
    return null;
  }

  /**
   * Lấy achievements
   */
  async getAchievements(userId) {
    const progress = await this.getProgress(userId);
    const allAchievements = db.findAll('game_achievements');

    const enriched = allAchievements.map(achievement => ({
      ...achievement,
      is_completed: progress.data.achievements.includes(achievement.id),
      progress: this.calculateAchievementProgress(achievement, progress.data)
    }));

    return {
      success: true,
      data: enriched
    };
  }

  calculateAchievementProgress(achievement, progress) {
    // Implementation based on achievement type
    return 0;
  }

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

    return {
      success: true,
      data: leaderboard
    };
  }

  /**
   * Phần thưởng hàng ngày
   */
  async getDailyReward(userId) {
    const progress = db.findOne('game_progress', { user_id: userId });
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = new Date(progress.last_login).toISOString().split('T')[0];

    if (today === lastLogin) {
      return {
        success: false,
        message: 'Daily reward already claimed',
        statusCode: 400
      };
    }

    const reward = {
      coins: 50,
      petals: 1
    };

    db.update('game_progress', progress.id, {
      coins: progress.coins + reward.coins,
      total_sen_petals: progress.total_sen_petals + reward.petals,
      streak_days: lastLogin === this.getYesterday() ? progress.streak_days + 1 : 1,
      last_login: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Daily reward claimed',
      data: reward
    };
  }

  getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Mua item trong shop
   */
  async purchaseItem(userId, itemId, quantity) {
    const item = db.findById('shop_items', itemId);
    if (!item) {
      return {
        success: false,
        message: 'Item not found',
        statusCode: 404
      };
    }

    const progress = db.findOne('game_progress', { user_id: userId });
    const totalCost = item.price * quantity;

    if (progress.coins < totalCost) {
      return {
        success: false,
        message: 'Not enough coins',
        statusCode: 400
      };
    }

    // Trừ tiền
    db.update('game_progress', progress.id, {
      coins: progress.coins - totalCost
    });

    // Thêm vào inventory
    const inventory = db.findOne('user_inventory', { user_id: userId }) ||
      db.create('user_inventory', { user_id: userId, items: [] });

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

    db.update('user_inventory', inventory.id, {
      items: inventory.items
    });

    return {
      success: true,
      message: 'Purchase successful',
      data: {
        item: item,
        quantity: quantity,
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
      return {
        success: true,
        data: { items: [] }
      };
    }

    const enriched = inventory.items.map(item => {
      const itemData = db.findById('shop_items', item.item_id);
      return {
        ...item,
        ...itemData
      };
    });

    return {
      success: true,
      data: {
        items: enriched
      }
    };
  }

  /**
   * Sử dụng item
   */
  async useItem(userId, itemId, targetId) {
    const inventory = db.findOne('user_inventory', { user_id: userId });

    if (!inventory) {
      return {
        success: false,
        message: 'No inventory found',
        statusCode: 404
      };
    }

    const item = inventory.items.find(i => i.item_id === itemId);
    if (!item || item.quantity <= 0) {
      return {
        success: false,
        message: 'Item not found or quantity is 0',
        statusCode: 400
      };
    }

    // Logic sử dụng item (tuỳ loại item)
    const itemData = db.findById('shop_items', itemId);

    // Giảm quantity
    item.quantity -= 1;
    db.update('user_inventory', inventory.id, {
      items: inventory.items
    });

    return {
      success: true,
      message: 'Item used successfully',
      data: {
        item: itemData,
        effect: 'Applied successfully'
      }
    };
  }
}

module.exports = new GameService();