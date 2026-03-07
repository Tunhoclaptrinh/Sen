/**
 * Unified Game Service
 */

const db = require('../config/database');
const { calculateDistance } = require('../utils/helpers');
const badgeService = require('./badge.service');
const questService = require('./quest.service');
const notificationService = require('./notification.service');

class GameService {
  constructor() {
    // Khởi tạo Set để track sessions đang được xử lý
    this.activeLocks = new Set();

    // Bắt đầu background cleanup job
    this.startSessionCleanup();
  }

  // ==================== INITIALIZATION ====================

  /**
   * Khởi tạo game progress cho user mới
   */
  async initializeProgress(userId) {
    const numericUserId = Number(userId);
    const existing = await db.findOne('game_progress', { userId: numericUserId });
    if (existing) return existing;

    return await db.create('game_progress', {
      userId: numericUserId,
      currentChapter: 1,
      totalSenPetals: 0,
      totalPoints: 0,
      level: 1,
      coins: 1000,
      unlockedChapters: [1],
      completedLevels: [],
      collectedCharacters: [],
      badges: [],
      achievements: [],
      museumOpen: false,
      museumIncome: 0,
      streakDays: 0,
      lastRewardClaim: null,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completedModules: [],
      completedQuestsCount: 0,
      unlockedThemes: ['default'],
      activeTheme: 'default',
      unlockedAvatars: [],
      activeAvatar: null,
      hintCharges: 0,
      shieldCharges: 0
    });
  }

  // ==================== SESSION TIMEOUT CLEANUP ====================

  /**
   * Bắt đầu background job để cleanup sessions timeout
   */
  startSessionCleanup() {
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run every 1 hour

    console.log('🧹 Session cleanup job started (runs every hour)');

    // Run ngay lần đầu
    this.cleanupExpiredSessions(SESSION_TIMEOUT).catch(err =>
      console.error('❌ Initial session cleanup error:', err)
    );

    // Sau đó chạy định kỳ
    setInterval(() => {
      this.cleanupExpiredSessions(SESSION_TIMEOUT).catch(err =>
        console.error('❌ Scheduled session cleanup error:', err)
      );
    }, CLEANUP_INTERVAL);
  }

  /**
   * Cleanup các sessions đã expired
   */
  async cleanupExpiredSessions(timeout) {
    try {
      const now = Date.now();
      const allSessions = await db.findAll('game_sessions');

      let expiredCount = 0;

      for (const session of allSessions) {
        // Chỉ cleanup sessions đang in_progress
        if (session.status !== 'in_progress') continue;

        const startTime = new Date(session.startedAt).getTime();
        const lastActivity = session.lastActivity
          ? new Date(session.lastActivity).getTime()
          : startTime;

        // Check theo lastActivity (quan trọng hơn startedAt)
        if (now - lastActivity > timeout) {
          await db.update('game_sessions', session.id, {
            status: 'expired',
            expiredAt: new Date().toISOString(),
            expiredReason: 'Session timeout (24 hours inactive)'
          });
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} expired sessions`);
      }
    } catch (error) {
      console.error('❌ Session cleanup error:', error);
    }
  }

  /**
   * Get active session với timeout check
   */
  async getActiveSession(levelId, userId) {
    const session = await db.findOne('game_sessions', {
      levelId: levelId,
      userId: userId,
      status: 'in_progress'
    });

    if (!session) return null;

    // Check timeout
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
    const lastActivity = new Date(session.lastActivity || session.startedAt).getTime();
    const now = Date.now();

    if (now - lastActivity > SESSION_TIMEOUT) {
      // Auto-expire
      await db.update('game_sessions', session.id, {
        status: 'expired',
        expiredAt: new Date().toISOString(),
        expiredReason: 'Session timeout'
      });
      return null;
    }

    return session;
  }



  /**
   * Tính toán hạng dựa trên điểm số
   */
  calculateRank(points) {
    const ranks = [
      { name: 'Tập Sự', minPoints: 0, nextRankPoints: 500, icon: '🏆' },
      { name: 'Khám Phá', minPoints: 500, nextRankPoints: 1500, icon: '🏆' },
      { name: 'Chinh Phục', minPoints: 1500, nextRankPoints: 3000, icon: '🏆' },
      { name: 'Đại Sứ', minPoints: 3000, nextRankPoints: Infinity, icon: '🏆' }
    ];

    const currentRank = [...ranks].reverse().find(r => points >= r.minPoints) || ranks[0];
    const nextRank = ranks[ranks.indexOf(currentRank) + 1] || null;

    let progressPercent = 0;
    if (nextRank) {
      const range = nextRank.minPoints - currentRank.minPoints;
      const earnedInRange = points - currentRank.minPoints;
      progressPercent = Math.min(Math.round((earnedInRange / range) * 100), 100);
    } else {
      progressPercent = 100;
    }

    return {
      currentRank: currentRank.name,
      rankIcon: currentRank.icon,
      nextRankName: nextRank ? nextRank.name : null,
      pointsToNextRank: nextRank ? nextRank.minPoints - points : 0,
      progressPercent
    };
  }

  // ==================== PROGRESS & STATS ====================

  /**
  * Lấy tiến độ game của user
  */
  async getProgress(userId) {
    // For guest users, return default progress without creating DB record
    if (!userId) {
      const allChapters = await db.findAll('game_chapters');
      const totalChapters = allChapters.length;

      const allLevels = await db.findAll('game_levels');
      const totalLevels = allLevels.length;

      const rankInfo = this.calculateRank(0);

      const guestProgress = {
        userId: null,
        level: 1,
        totalPoints: 0,
        completedLevels: [],
        totalSenPetals: 0,
        unlockedChapters: [],
        finishedChapters: [],
        collectedCharacters: [],
        coins: 0,
        badges: [],
        isGuest: true
      };

      return {
        success: true,
        data: {
          ...guestProgress,
          ...rankInfo,
          stats: {
            completionRate: 0,
            chaptersUnlocked: 0,
            totalChapters: totalChapters,
            charactersCollected: 0,
            totalBadges: 0
          }
        }
      };
    }

    const numericUserId = Number(userId);
    let progress = await db.findOne('game_progress', { userId: numericUserId });
    if (!progress) {
      progress = await this.initializeProgress(userId);
    }

    // Tính toán thống kê - using countDocuments via findMany/findAll if direct count not available
    const allChapters = await db.findAll('game_chapters');
    const totalChapters = allChapters.length;

    const allLevels = await db.findAll('game_levels');
    const totalLevels = allLevels.length;

    const rankInfo = this.calculateRank(progress.totalPoints || 0);

    return {
      success: true,
      data: {
        ...progress,
        ...rankInfo,
        stats: {
          completionRate: totalLevels > 0 ? Math.round((progress.completedLevels.length / totalLevels) * 100) : 0,
          chaptersUnlocked: progress.unlockedChapters.length,
          totalChapters: totalChapters,
          charactersCollected: progress.collectedCharacters.length,
          totalBadges: (progress.badges || []).filter(b => b && typeof b === 'object' && b.id).length
        }
      }
    };
  }

  /**
   * Nhận thưởng hàng ngày
   */
  async getDailyReward(userId) {
    const progress = await db.findOne('game_progress', { userId: userId });
    if (!progress) {
      return { success: false, message: 'User progress not found', statusCode: 404 };
    }

    const lastClaim = progress.lastRewardClaim ? new Date(progress.lastRewardClaim) : null;
    const now = new Date();

    // Check if already claimed today (reset at midnight)
    if (lastClaim &&
      lastClaim.getFullYear() === now.getFullYear() &&
      lastClaim.getMonth() === now.getMonth() &&
      lastClaim.getDate() === now.getDate()) {
      return { success: false, message: 'Bạn đã nhận thưởng hôm nay rồi!', statusCode: 400 };
    }

    // Calculate rewards
    const coinsReward = 200;
    const petalsReward = 10;

    // Update streak (if claim yesterday, increment; if not, reset to 1)
    let newStreak = 1;
    if (lastClaim) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastClaim.getFullYear() === yesterday.getFullYear() &&
        lastClaim.getMonth() === yesterday.getMonth() &&
        lastClaim.getDate() === yesterday.getDate()) {
        newStreak = (progress.streakDays || 0) + 1;
      }
    }

    const updatedProgress = await db.update('game_progress', progress.id, {
      coins: (progress.coins || 0) + coinsReward,
      totalSenPetals: (progress.totalSenPetals || 0) + petalsReward,
      streakDays: newStreak,
      lastRewardClaim: now.toISOString(),
      lastLogin: now.toISOString()
    });

    // Create transaction record
    await db.create('transactions', {
      userId: userId,
      amount: coinsReward,
      currency: 'coins',
      type: 'credit',
      source: 'daily_reward',
      description: 'Thưởng điểm danh hàng ngày',
      createdAt: now.toISOString()
    });

    await db.create('transactions', {
      userId: userId,
      amount: petalsReward,
      currency: 'petals',
      type: 'credit',
      source: 'daily_reward',
      description: 'Thưởng điểm danh hàng ngày',
      createdAt: now.toISOString()
    });

    return {
      success: true,
      message: 'Điểm danh thành công!',
      data: {
        coins: coinsReward,
        petals: petalsReward,
        streakDays: newStreak,
        totalCoins: updatedProgress.coins,
        totalPetals: updatedProgress.totalSenPetals
      }
    };
  }

  // ==================== CHAPTERS ====================

  /**
 * Lấy danh sách chapters (cánh hoa sen)
 */
  /**
   * Lấy danh sách chapters (cánh hoa sen)
   */
  async getChapters(userId) {
    const numericUserId = Number(userId);
    const progress = await this.getProgress(numericUserId);
    const chaptersData = await db.findAll('game_chapters');
    // Filter active chapters
    const activeChapters = chaptersData.filter(c => c.isActive !== false);
    const chapters = activeChapters.sort((a, b) => a.order - b.order);

    // const enriched = await Promise.all(chapters.map(async (chapter, index) => {
    const enriched = await Promise.all(chapters.map(async (chapter) => {
      // RESPECT DB OVERRIDE (For testing/seeding)
      const chapterIdInt = Number(chapter.id);
      let isUnlocked = (progress.data.unlockedChapters || []).includes(chapterIdInt) || ['blooming', 'full'].includes(chapter.petalState);
      let isFinished = (progress.data.finishedChapters || []).includes(chapterIdInt) || chapter.petalState === 'full';

      const levels = await db.findMany('game_levels', { chapterId: chapter.id });
      const completedCount = levels.filter(l =>
        progress.data.completedLevels.includes(l.id)
      ).length;

      // Prerequisite check: only enforce explicit requiredChapterId.
      let canUnlock = false;
      if (!isUnlocked) {
        const prerequisiteId = chapter.requiredChapterId;
        const hasPrerequisite = prerequisiteId !== undefined && prerequisiteId !== null;
        const prerequisiteMet = !hasPrerequisite || (progress.data.unlockedChapters || []).includes(Number(prerequisiteId));

        if (prerequisiteMet) {
          if (Number(chapter.requiredPetals) === 0) {
            isUnlocked = true;
          } else {
            canUnlock = true;
          }
        }
      }

      // Dynamic Petal State Calculation
      let calculatedPetalState = 'locked';
      if (isFinished) {
        calculatedPetalState = 'full';
      } else if (isUnlocked) {
        calculatedPetalState = 'blooming';
      } else if (canUnlock) {
        calculatedPetalState = 'closed';
      }

      return {
        id: chapter.id,
        name: chapter.name || "",
        description: chapter.description || "",
        theme: chapter.theme || "Không có",
        order: chapter.order,
        color: chapter.color || "#D35400",
        image: chapter.image || "",
        layerIndex: chapter.layerIndex || 1,
        petalState: calculatedPetalState,
        petalImageClosed: chapter.petalImageClosed || "",
        petalImageBloom: chapter.petalImageBloom || "",
        petalImageFull: chapter.petalImageFull || "",
        requiredPetals: chapter.requiredPetals || 0,
        requiredChapterId: chapter.requiredChapterId ?? null,
        isUnlocked: isUnlocked,
        isFinished: isFinished,
        totalLevels: levels.length,
        completedLevels: completedCount,
        completionRate: levels.length > 0
          ? Math.round((completedCount / levels.length) * 100)
          : 0,
        canUnlock: canUnlock
      };
    }));

    return { success: true, data: enriched };
  }

  /**
   * Chi tiết một chapter
   */
  /**
   * Chi tiết một chapter
   */
  async getChapterDetail(chapterId, userId) {
    const chapter = await db.findById('game_chapters', chapterId);
    if (!chapter) {
      return { success: false, message: 'Chapter not found', statusCode: 404 };
    }

    const progress = await this.getProgress(userId);
    const levels = await db.findMany('game_levels', { chapterId: parseInt(chapterId) });
    // Sort levels
    levels.sort((a, b) => a.order - b.order);

    const enrichedLevels = await Promise.all(levels.map(async (level) => ({
      ...level,
      isCompleted: progress.data.completedLevels.includes(level.id),
      isLocked: !this.canPlayLevel(level, progress.data, levels),
      playerBestScore: await this.getBestScore(level.id, userId)
    })));

    // Prerequisite Check for petalState
    let isUnlocked = (progress.data.unlockedChapters || []).includes(Number(chapter.id));
    const isFinished = (progress.data.finishedChapters || []).includes(Number(chapter.id));

    if (!isUnlocked && !isFinished) {
      const prerequisiteId = chapter.requiredChapterId;
      const hasPrerequisite = prerequisiteId !== undefined && prerequisiteId !== null;
      const prerequisiteMet = !hasPrerequisite || (progress.data.unlockedChapters || []).includes(Number(prerequisiteId));

      if (prerequisiteMet && Number(chapter.requiredPetals) === 0) {
        isUnlocked = true;
      }
    }

    return {
      success: true,
      data: {
        ...chapter,
        levels: enrichedLevels,
        isUnlocked: isUnlocked,
        isFinished: isFinished,
        petalState: isFinished ? 'full' : isUnlocked ? 'blooming' : 'locked'
      }
    };
  }

  /**
   * Mở khóa chapter
   */
  async unlockChapter(chapterId, userId) {
    const numericChapterId = Number(chapterId);
    const numericUserId = Number(userId);
    const chapter = await db.findById('game_chapters', numericChapterId);
    if (!chapter) {
      return { success: false, message: 'Chapter not found', statusCode: 404 };
    }

    const progress = await db.findOne('game_progress', { userId: numericUserId });

    // 1. Check if already unlocked
    if ((progress.unlockedChapters || []).includes(numericChapterId)) {
      return { success: false, message: 'Chapter already unlocked', statusCode: 400 };
    }

    // 2. Prerequisite Check (explicit requiredChapterId only)
    const prerequisiteId = chapter.requiredChapterId;
    if (prerequisiteId !== undefined && prerequisiteId !== null) {
      if (!(progress.unlockedChapters || []).includes(Number(prerequisiteId))) {
        const prereqChapterDetail = await db.findById('game_chapters', prerequisiteId);
        const nameLabel = prereqChapterDetail ? prereqChapterDetail.name : `ID: ${prerequisiteId}`;
        return {
          success: false,
          message: `Bạn cần hoàn thành chương "${nameLabel}" trước!`,
          statusCode: 403
        };
      }
    }

    // 3. Currency Check (Sen Petals)
    if (progress.totalSenPetals < chapter.requiredPetals) {
      return {
        success: false,
        message: `Need ${chapter.requiredPetals} Sen Petals to unlock`,
        statusCode: 400
      };
    }

    // 4. Deduct Petals and Unlock
    const newPetalsCount = progress.totalSenPetals - chapter.requiredPetals;

    await db.update('game_progress', progress.id, {
      unlockedChapters: [...(progress.unlockedChapters || []), numericChapterId],
      currentChapter: numericChapterId,
      totalSenPetals: newPetalsCount
    });

    const result = {
      success: true,
      message: 'Chapter unlocked successfully',
      data: {
        chapterId: parseInt(chapterId),
        chapterName: chapter.name,
        petalsSpent: chapter.requiredPetals,
        petalsRemaining: newPetalsCount
      }
    };

    // TRIGGER NOTIFICATION
    try {
      await notificationService.notify(
        userId,
        'Mở khóa chương mới! 🌸',
        `Chúc mừng! Bạn đã mở khóa chương "${chapter.name}". Hãy bắt đầu khám phá ngay!`,
        'learning',
        chapterId
      );
    } catch (e) {
      console.error('Notification failed', e);
    }

    return result;
  }

  // ==================== LEVELS ====================

  /**
   * Lấy danh sách levels với bộ lọc (heritage, artifact, history)
   */
  async getAllLevels(query = {}) {
    try {
      const { relatedHeritageIds, relatedArtifactIds, relatedHistoryIds, limit } = query;
      let levels = await db.findAll('game_levels');

      if (relatedHeritageIds) {
        levels = levels.filter(l =>
          l.heritageSiteId === parseInt(relatedHeritageIds) ||
          (Array.isArray(l.relatedHeritageIds) && l.relatedHeritageIds.includes(parseInt(relatedHeritageIds)))
        );
      }

      if (relatedArtifactIds) {
        levels = levels.filter(l =>
          (Array.isArray(l.artifactIds) && l.artifactIds.includes(parseInt(relatedArtifactIds))) ||
          (Array.isArray(l.relatedArtifactIds) && l.relatedArtifactIds.includes(parseInt(relatedArtifactIds)))
        );
      }

      if (relatedHistoryIds) {
        levels = levels.filter(l =>
          Array.isArray(l.relatedHistoryIds) && l.relatedHistoryIds.includes(parseInt(relatedHistoryIds))
        );
      }

      if (limit) {
        levels = levels.slice(0, parseInt(limit));
      }

      return { success: true, data: levels };
    } catch (error) {
      console.error('[GameService:getAllLevels] Error:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách levels trong chapter
   */
  async getLevels(chapterId, userId) {
    const progress = await this.getProgress(userId);
    const levels = await db.findMany('game_levels', { chapterId: parseInt(chapterId) });
    const levelReviewHistory = progress.data.levelReviewHistory || [];
    // Sort levels
    levels.sort((a, b) => a.order - b.order);

    const enriched = levels.map(level => {
      const isCompleted = progress.data.completedLevels.includes(level.id);
      const reviewEntry = levelReviewHistory.find(h => parseInt(h.levelId) === parseInt(level.id));
      const rawReviewCount = reviewEntry?.count || 0;
      const maxReviewRewards = level.maxReviewRewards !== undefined ? level.maxReviewRewards : 3;
      const reviewCount = isCompleted
        ? Math.min(maxReviewRewards, Math.max(0, rawReviewCount - 1))
        : 0;

      return {
        id: level.id,
        chapterId: level.chapterId,
        name: level.name,
        description: level.description,
        type: level.type,
        difficulty: level.difficulty,
        order: level.order,
        image: level.image,
        thumbnail: level.thumbnail,
        backgroundImage: level.backgroundImage,
        isCompleted: isCompleted,
        isLocked: !this.canPlayLevel(level, progress.data, levels),
        rewards: level.rewards,
        requiredLevel: level.requiredLevel,
        reviewCount: reviewCount,
        maxReviewRewards: maxReviewRewards
      };
    });

    return { success: true, data: enriched };
  }

  /**
   * Kiểm tra có thể chơi level không
   */
  canPlayLevel(level, progress, chapterLevels = []) {
    // Level 1 always playable if chapter is unlocked
    if (level.order === 1) return true;

    // Explicit requirement
    if (level.requiredLevel) {
      return progress.completedLevels.includes(level.requiredLevel);
    }

    // Implicit requirement: Previous level in same chapter must be completed
    if (chapterLevels.length > 0) {
      const prevLevel = chapterLevels.find(l => l.order === level.order - 1);
      if (prevLevel) {
        return progress.completedLevels.includes(prevLevel.id);
      }
    }

    // Fallback for cases without chapterLevels or if previous level missing in config
    return true;
  }

  /**
   * Lấy best score của level
   */
  async getBestScore(levelId, userId) {
    const sessions = await db.findMany('game_sessions', {
      levelId: levelId,
      userId: userId,
      status: 'completed'
    });

    if (sessions.length === 0) return null;

    return Math.max(...sessions.map(s => s.score || 0));
  }

  /**
   * Chi tiết level (màn chơi)
   */
  async getLevelDetail(levelId, userId) {
    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return { success: false, message: 'Level not found', statusCode: 404 };
    }

    const progress = await this.getProgress(userId);

    if (!this.canPlayLevel(level, progress.data)) {
      return { success: false, message: 'Level is locked', statusCode: 403 };
    }

    const playCountData = await db.findMany('game_sessions', {
      levelId: level.id,
      userId: userId
    });

    return {
      success: true,
      data: {
        ...level,
        isCompleted: progress.data.completedLevels.includes(level.id),
        bestScore: await this.getBestScore(level.id, userId),
        playCount: playCountData.length
      }
    };
  }

  // ==================== SCREEN-BASED GAMEPLAY ====================

  /**
 * Bắt đầu chơi level
 */
  async startLevel(levelId, userId) {

    console.log(`[GameService] Starting level ${levelId} for user ${userId}`);

    const isGuest = !userId; // Guest user if no userId

    // Close ALL existing in_progress sessions for this level/user (not just expired ones)
    const existingSessions = await db.findMany('game_sessions', {
      levelId: levelId,
      userId: userId,
      status: 'in_progress'
    });

    if (existingSessions.length > 0) {
      console.log(`[GameService] Closing ${existingSessions.length} existing in_progress sessions`);
    }

    for (const session of existingSessions) {
      await db.update('game_sessions', session.id, {
        status: 'abandoned',
        expiredAt: new Date().toISOString(),
        expiredReason: 'New session started'
      });
    }

    const level = await db.findById('game_levels', levelId);
    if (!level) {
      return { success: false, message: 'Level not found', statusCode: 404 };
    }

    // For guests, skip permission/progress checks
    if (!isGuest) {
      const progress = await db.findOne('game_progress', { userId: userId });
      const chapterLevels = await db.findMany('game_levels', { chapterId: level.chapterId });

      if (!this.canPlayLevel(level, progress, chapterLevels)) {
        return { success: false, message: 'Level is locked', statusCode: 403 };
      }
    }

    // Validate screens structure
    if (!level.screens || level.screens.length === 0) {
      return { success: false, message: 'Level has no screens configured', statusCode: 500 };
    }

    const validation = this.validateScreensStructure(level.screens);
    if (!validation.success) {
      return validation;
    }

    const session = await db.create('game_sessions', {
      userId: userId,
      levelId: levelId,
      status: 'in_progress',
      isGuest: isGuest,  // Mark as guest session
      currentScreenId: level.screens[0].id,
      currentScreenIndex: 0,
      collectedItems: [],
      answeredQuestions: [],
      timelineOrder: [],
      score: 0,
      totalScreens: level.screens.length,
      completedScreens: [],
      screenStates: {},
      timeSpent: 0,
      hintsUsed: 0,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });

    const firstScreen = this.enrichScreen(level.screens[0], session, 0, level.screens.length, level);

    // Fetch AI character if exists
    let aiCharacter = null;
    if (level.aiCharacterId) {
      aiCharacter = await db.findById('game_characters', level.aiCharacterId);
    }

    return {
      success: true,
      message: 'Level started',
      data: {
        sessionId: session.id,
        level: {
          id: level.id,
          chapterId: level.chapterId,
          name: level.name,
          description: level.description,
          thumbnail: level.thumbnail,
          backgroundMusic: level.backgroundMusic,
          totalScreens: level.screens.length,
          aiCharacter: aiCharacter
        },
        currentScreen: firstScreen
      }
    };
  }

  /**
 * Thu thập manh mối
 */
  async collectClue(levelId, userId, clueId) {
    const session = await this.getActiveSession(levelId, userId);

    if (!session) {
      return { success: false, message: 'No active session or session expired', statusCode: 404 };
    }

    const level = await db.findById('game_levels', levelId);
    const currentScreen = level.screens[session.currentScreenIndex];

    if (currentScreen.type !== 'HIDDEN_OBJECT') {
      return { success: false, message: 'Not a hidden object screen', statusCode: 400 };
    }

    // Find item in screen.items OR level.clues (support both data structures)
    let item = currentScreen.items?.find(i => i.id === clueId);
    if (!item && level.clues) {
      item = level.clues.find(i => i.id === clueId);
    }

    if (!item) {
      return { success: false, message: 'Item not found', statusCode: 404 };
    }

    if (session.collectedItems.includes(clueId)) {
      return { success: false, message: 'Item already collected', statusCode: 400 };
    }

    const updatedSession = await db.update('game_sessions', session.id, {
      collectedItems: [...session.collectedItems, clueId],
      score: session.score + (item.points || 10),
      lastActivity: new Date().toISOString() // UPDATE LAST ACTIVITY
    });

    // Calculate required items from screen.items or level.clues
    const allItems = currentScreen.items || level.clues || [];
    const requiredItems = currentScreen.requiredItems || allItems.length;
    const allCollected = updatedSession.collectedItems.length >= requiredItems;

    // TRIGGER QUEST UPDATE
    try {
      const questService = require('./quest.service');
      await questService.checkAndAdvance(userId, 'collect_artifact', 1);
    } catch (e) {
      console.error('Quest trigger failed', e);
    }

    // TRIGGER MUSEUM ARTIFACT UNLOCK
    if (item.artifactId) {
      try {
        const existingScan = await db.findOne('scan_history', {
          userId: userId,
          objectId: item.artifactId
        });

        if (!existingScan) {
          await db.create('scan_history', {
            userId: userId,
            objectId: item.artifactId,
            type: 'collect_artifact',
            scannedAt: new Date().toISOString(),
            scanCode: 'HO_REWARD_' + item.id
          });
          console.log(`[GameService] Added artifact ${item.artifactId} to museum for user ${userId}`);

          // TRIGGER NOTIFICATION
          try {
            await notificationService.notify(
              userId,
              'Tìm thấy hiện vật mới! 🏺',
              `Bạn vừa tìm thấy "${item.name}"! Hiện vật này đã được thêm vào bảo tàng của bạn.`,
              'artifact',
              item.artifactId
            );
          } catch (e) {
            console.error('Notification failed', e);
          }
        }
      } catch (e) {
        console.error('Museum artifact unlock failed', e);
      }
    }

    // TRIGGER BADGE CHECK (Artifacts Scanned)
    let newBadges = [];
    try {
      const scanHistory = await db.findMany('scan_history', { userId: userId });
      const badgeResult = await badgeService.checkAndUnlock(userId, 'artifacts_scanned', scanHistory.length);
      newBadges = badgeResult;
    } catch (e) {
      console.error('Badge check failed', e);
    }

    // TRIGGER BADGE CHECK (Clues Collected)
    try {
      const allSessions = await db.findMany('game_sessions', { userId: userId });
      const totalClues = allSessions.reduce((sum, s) => sum + (s.collectedItems || []).length, 0);
      const cluesBadge = await badgeService.checkAndUnlock(userId, 'clues_collected', totalClues);
      if (cluesBadge && cluesBadge.length > 0) {
        newBadges = [...newBadges, ...cluesBadge];
      }
    } catch (e) {
      console.error('Clues badge check failed', e);
    }

    return {
      success: true,
      message: 'Item collected',
      data: {
        item: {
          id: item.id,
          name: item.name,
          factPopup: item.factPopup || item.content || item.description || ''
        },
        pointsEarned: item.points || 10,
        totalScore: updatedSession.score,
        progress: {
          collected: updatedSession.collectedItems.length,
          required: requiredItems,
          allCollected: allCollected
        },
        newBadges // Return new badges
      }
    };
  }

  /**
   * Submit answer for QUIZ screen
   */
  async submitAnswer(sessionId, userId, answerId) {
    const lockKey = `session_${sessionId}`;
    if (this.activeLocks.has(lockKey)) {
      console.warn(`[GameService] Concurrent request blocked for session ${sessionId}`);
      return { success: false, message: 'Request in progress', statusCode: 409 };
    }
    this.activeLocks.add(lockKey);

    try {
      const session = await db.findOne('game_sessions', {
        id: parseInt(sessionId),
        userId: userId,
        status: 'in_progress'
      });

      if (!session) {
        return { success: false, message: 'Session not found', statusCode: 404 };
      }

      // Check timeout
      const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const lastActivity = new Date(session.lastActivity || session.startedAt).getTime();
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        await db.update('game_sessions', session.id, {
          status: 'expired',
          expiredAt: new Date().toISOString()
        });
        return { success: false, message: 'Session expired', statusCode: 404 };
      }

      const level = await db.findById('game_levels', session.levelId);
      const currentScreen = level.screens[session.currentScreenIndex];

      if (currentScreen.type !== 'QUIZ') {
        return { success: false, message: 'Current screen is not a quiz', statusCode: 400 };
      }

      const hasAnswered = session.answeredQuestions.some(
        q => q.screenId === currentScreen.id
      );

      if (hasAnswered) {
        return { success: false, message: 'Already answered this question', statusCode: 400 };
      }

      let isCorrect = false;
      let pointsEarned = 0;
      let explanation = null;
      let correctAnswerText = null;

      if (Array.isArray(answerId)) {
        // Validate array answer
        const correctOptions = currentScreen.options?.filter(o => o.isCorrect) || [];
        const correctTexts = correctOptions.map(o => o.text);

        // Exact match of correct options
        if (answerId.length === correctTexts.length && answerId.every(ans => correctTexts.includes(ans))) {
          isCorrect = true;
          pointsEarned = currentScreen.reward?.points || currentScreen.points || 20;
          explanation = correctOptions.find(o => o.explanation)?.explanation || null;
        } else {
          isCorrect = false;
          correctAnswerText = correctTexts; // Trả về mảng để frontend tuỳ ý xử lý
        }
      } else {
        // Single answer
        const selectedOption = currentScreen.options?.find(o => o.text === answerId);
        if (!selectedOption) {
          return { success: false, message: 'Invalid answer', statusCode: 400 };
        }

        isCorrect = selectedOption.isCorrect;
        pointsEarned = isCorrect ? (currentScreen.reward?.points || currentScreen.points || 20) : 0;
        explanation = selectedOption.explanation;
        correctAnswerText = isCorrect ? null : currentScreen.options?.find(o => o.isCorrect)?.text;
      }

      const updatedSession = await db.update('game_sessions', sessionId, {
        answeredQuestions: [
          ...session.answeredQuestions,
          {
            screenId: currentScreen.id,
            answer: answerId,
            isCorrect: isCorrect,
            points: pointsEarned,
            answeredAt: new Date().toISOString()
          }
        ],
        score: session.score + pointsEarned,
        lastActivity: new Date().toISOString() // UPDATE LAST ACTIVITY
      });

      // TRIGGER QUEST CHECK (Quiz Success)
      if (isCorrect && userId) { // Skip for guests
        try {
          const questService = require('./quest.service');
          // Trigger 'perfect_quiz' if the user answers correctly. 
          // Ideally we check if they got ALL questions right in a row, but for now, 
          // given the simple mechanic (1 question per screen?), we verify if this success counts.
          // If the quest requires 1 'perfect_quiz', and they passed a quiz screen, we trigger it.
          await questService.checkAndAdvance(userId, 'perfect_quiz', 1);
        } catch (e) {
          console.error('Quest trigger failed', e);
        }
      }

      // TRIGGER BADGE CHECK (Quizzes Completed - Approximate as correct answers)
      let newBadges = [];
      if (isCorrect) {
        try {
          const allSessions = await db.findMany('game_sessions', { userId: userId });
          let correctCount = 0;
          allSessions.forEach(s => {
            if (s.answeredQuestions) {
              correctCount += s.answeredQuestions.filter(q => q.isCorrect).length;
            }
          });
          // Add current one if not yet saved/reflected (it is saved above)
          // Actually it is saved in updatedSession, but we iterate all sessions.
          // Simplified: just query DB.
          const badgeResult = await badgeService.checkAndUnlock(userId, 'perfect_quiz', correctCount);
          // Reuse 'perfect_quiz' for 'Correct Answers' count condition for now.
          newBadges = badgeResult;
        } catch (e) { console.error('Badge check failed', e); }
      }

      return {
        success: true,
        message: isCorrect ? 'Correct answer!' : 'Wrong answer',
        data: {
          isCorrect: isCorrect,
          pointsEarned: pointsEarned,
          totalScore: updatedSession.score,
          explanation: explanation,
          correctAnswer: correctAnswerText,
          newBadges
        }
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  async submitTimelineOrder(sessionId, userId, eventOrder) {
    const lockKey = `session_${sessionId}`;
    if (this.activeLocks.has(lockKey)) {
      return { success: false, message: 'Request in progress', statusCode: 409 };
    }
    this.activeLocks.add(lockKey);

    try {
      const session = await db.findOne('game_sessions', {
        id: parseInt(sessionId),
        userId: userId,
        status: 'in_progress'
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
          statusCode: 404
        };
      }

      // CHECK SESSION TIMEOUT
      const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const lastActivity = new Date(session.lastActivity || session.startedAt).getTime();
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        await db.update('game_sessions', session.id, {
          status: 'expired',
          expiredAt: new Date().toISOString()
        });
        return {
          success: false,
          message: 'Session expired',
          statusCode: 404
        };
      }

      const level = await db.findById('game_levels', session.levelId);
      const currentScreen = level.screens[session.currentScreenIndex];

      // CHECK SCREEN TYPE
      if (currentScreen.type !== 'TIMELINE') {
        return {
          success: false,
          message: 'Current screen is not a timeline',
          statusCode: 400
        };
      }

      // GET CORRECT ORDER
      const correctOrder = currentScreen.events
        .sort((a, b) => a.year - b.year)
        .map(e => e.id);

      // VALIDATE ARRAY LENGTH
      if (eventOrder.length !== correctOrder.length) {
        return {
          success: false,
          message: `Timeline must have exactly ${correctOrder.length} events`,
          statusCode: 400,
          data: { required: correctOrder.length, received: eventOrder.length }
        };
      }

      // VALIDATE EVENT IDs
      const validEventIds = new Set(correctOrder);
      const hasInvalidIds = eventOrder.some(id => !validEventIds.has(id));

      if (hasInvalidIds) {
        return {
          success: false,
          message: 'Invalid event IDs in timeline order',
          statusCode: 400
        };
      }

      // CHECK CORRECT ORDER
      const isCorrect = JSON.stringify(eventOrder) === JSON.stringify(correctOrder);

      // SAVE ORDER (even if wrong for retry)
      await db.update('game_sessions', session.id, {
        timelineOrder: eventOrder,
        lastActivity: new Date().toISOString()
      });

      if (!isCorrect) {
        return {
          success: false,
          message: 'Timeline order is incorrect. Please try again.',
          statusCode: 400,
          data: {
            isCorrect: false,
            hint: 'Check the years of each event carefully'
            // ❌ DON'T reveal correctOrder in production
          }
        };
      }

      // ADD POINTS IF CORRECT
      const pointsEarned = currentScreen.reward?.points || currentScreen.points || 20;
      await db.update('game_sessions', session.id, {
        score: session.score + pointsEarned
      });

      return {
        success: true,
        message: 'Timeline order is correct!',
        data: {
          isCorrect: true,
          pointsEarned,
          totalScore: session.score + pointsEarned
        }
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  /**
   * Navigate to next screen in level
   */

  async navigateToNextScreen(sessionId, userId) {
    const lockKey = `session_${sessionId}`;
    if (this.activeLocks.has(lockKey)) {
      return { success: false, message: 'Request in progress', statusCode: 409 };
    }
    this.activeLocks.add(lockKey);

    try {
      const session = await db.findOne('game_sessions', {
        id: parseInt(sessionId),
        userId: userId,
        status: 'in_progress'
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
          statusCode: 404
        };
      }

      // CHECK SESSION TIMEOUT
      const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const lastActivity = new Date(session.lastActivity || session.startedAt).getTime();
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        await db.update('game_sessions', session.id, {
          status: 'expired',
          expiredAt: new Date().toISOString()
        });
        return {
          success: false,
          message: 'Session expired',
          statusCode: 404
        };
      }

      const level = await db.findById('game_levels', session.levelId);
      const currentScreen = level.screens[session.currentScreenIndex];

      // Validate screen completion - Check if can proceed (completed current screen requirements)
      const canProceed = this.validateScreenCompletion(currentScreen, session, level);
      if (!canProceed.success) {
        return canProceed;
      }

      // Find next screen
      let nextScreenIndex = session.currentScreenIndex + 1;

      // Check if has custom nextScreenId
      if (currentScreen.nextScreenId) {
        nextScreenIndex = level.screens.findIndex(s => s.id === currentScreen.nextScreenId);
        if (nextScreenIndex === -1) {
          return {
            success: false,
            message: 'Invalid next_screen_id configuration',
            statusCode: 500
          };
        }
      }

      // ⚡ Calculate points for completing the CURRENT screen (e.g. passive screens like Video/Image)
      // Only if points are defined and NOT already awarded (like Quiz/HiddenObject/Timeline which use submit endpoints)
      let pointsToAdd = 0;
      if (['DIALOGUE', 'VIDEO', 'IMAGE_VIEWER'].includes(currentScreen.type)) {
        // Default 10 points for watching/reading if not specified
        pointsToAdd = currentScreen.reward?.points || currentScreen.points || 10;

        // Prevent farming: Check if screen already in completedScreens
        if (session.completedScreens.includes(currentScreen.id)) {
          pointsToAdd = 0;
        }
      }

      // Check if level finished
      if (nextScreenIndex >= level.screens.length) {
        // ⚡ Update session with final points BEFORE finishing
        // Ensure we add the current screen to completed_screens too
        await db.update('game_sessions', session.id, {
          score: session.score + pointsToAdd,
          completedScreens: [...session.completedScreens, currentScreen.id],
          lastActivity: new Date().toISOString()
        });

        // Auto complete level
        return {
          success: true,
          message: 'Level completed. Please call completeLevel endpoint.',
          data: {
            levelFinished: true,
            finalScore: session.score + pointsToAdd,
            pointsEarned: pointsToAdd
          }
        };
      }

      const nextScreen = level.screens[nextScreenIndex];

      // Update session - reset collectedItems for new screen
      const updatedSession = await db.update('game_sessions', session.id, {
        currentScreenId: nextScreen.id,
        currentScreenIndex: nextScreenIndex,
        completedScreens: [...session.completedScreens, currentScreen.id],
        score: session.score + pointsToAdd,
        collectedItems: [], // Reset for new screen
        lastActivity: new Date().toISOString() // ⚡ UPDATE LAST ACTIVITY
      });

      return {
        success: true,
        message: 'Navigated to next screen',
        data: {
          sessionId: session.id,
          currentScreen: this.enrichScreen(
            nextScreen,
            updatedSession,
            nextScreenIndex,
            level.screens.length,
            level
          ),
          progress: {
            completedScreens: updatedSession.completedScreens.length,
            totalScreens: level.screens.length,
            percentage: Math.round(
              (updatedSession.completedScreens.length / level.screens.length) * 100
            )
          },
          pointsEarned: pointsToAdd
        }
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  /**
   * Validate if current screen is completed
   */
  validateScreenCompletion(screen, session, level = null) {
    switch (screen.type) {
      case 'HIDDEN_OBJECT':
        const items = screen.items || level?.clues || [];
        const requiredItems = screen.requiredItems || items.length || 0;
        const collectedCount = session.collectedItems.filter(
          item => items.some(i => i.id === item)
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
        const hasAnswered = session.answeredQuestions.some(
          q => q.screenId === screen.id
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
        // Auto-complete when viewed (no validation needed)
        break;

      case 'TIMELINE':

        const userOrder = session.timelineOrder;

        if (!userOrder || userOrder.length === 0) {
          return {
            success: false,
            message: 'Must submit timeline order first',
            statusCode: 400,
            data: {
              hint: 'Use POST /sessions/:id/submit-timeline to arrange events'
            }
          };
        }

        // Get events from screen.events or level.clues
        const timelineEvents = screen.events || (level?.clues || []).map(clue => {
          const yearMatch = clue.name?.match(/(\d{4})/);
          return {
            id: clue.id,
            year: yearMatch ? parseInt(yearMatch[1]) : 0
          };
        });

        // CHECK IF ORDER IS CORRECT (already validated in submit)
        const correctOrder = [...timelineEvents]
          .sort((a, b) => a.year - b.year)
          .map(e => e.id);

        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

        if (!isCorrect) {
          return {
            success: false,
            message: 'Timeline order is incorrect. Please try again.',
            statusCode: 400,
            data: {
              userOrder,
              correctOrder, // Show for debugging (remove in production)
              hint: 'Check the years of each event carefully'
            }
          };
        }
        break;

      case 'VIDEO':
      case 'IMAGE_VIEWER':
        // ✅ These screens auto-complete when viewed
        break;
    }

    return { success: true };
  }

  async completeLevel(levelId, userId, { score, timeSpent } = {}) {
    const lockKey = `complete_${userId}_${levelId}`;
    if (this.activeLocks.has(lockKey)) {
      return { success: false, message: 'Request in progress', statusCode: 409 };
    }
    this.activeLocks.add(lockKey);

    const isGuest = !userId; // Guest user if no userId
    let newBadges = []; // Moved outside to avoid scoping error
    let rewardsData = null;
    let newTotals = null;

    try {
      const session = await db.findOne('game_sessions', {
        levelId: levelId,
        userId: userId,
        status: 'in_progress'
      });

      if (!session) {
        return { success: false, message: 'No active session', statusCode: 404 };
      }

      const level = await db.findById('game_levels', levelId);

      // ✅ SHARED SCORE CALCULATION
      const timeBonus = this.calculateTimeBonus(timeSpent || session.timeSpent, level.timeLimit);
      const hintPenalty = session.hintsUsed * 5;
      const finalScore = Math.max(0, session.score + timeBonus - hintPenalty);

      // Calculate passing threshold based on percentage
      const maxPotentialScore = this.calculateMaxPotentialScore(level);
      const passingThreshold = Math.ceil((maxPotentialScore * (level.passingScore || 70)) / 100);
      const passed = finalScore >= passingThreshold;

      // ✅ UPDATE SESSION STATUS
      await db.update('game_sessions', session.id, {
        status: 'completed',
        score: finalScore,
        completedAt: new Date().toISOString()
      });

      if (!passed) {
        return {
          success: true,
          message: 'Level completed but not passed',
          data: {
            passed: false,
            score: finalScore,
            breakdown: {
              baseScore: session.score,
              timeBonus: timeBonus,
              hintPenalty: hintPenalty
            },
            requiredScore: passingThreshold,
            maxPotentialScore: maxPotentialScore,
            passingPercentage: level.passingScore || 70,
            canRetry: true
          }
        };
      }

      // ✅ For guests, return success without saving progress
      if (isGuest) {
        return {
          success: true,
          message: 'Level completed (guest)',
          data: {
            passed: true,
            score: finalScore,
            breakdown: {
              baseScore: session.score,
              timeBonus: timeBonus,
              hintPenalty: hintPenalty
            },
            requiredScore: passingThreshold,
            maxPotentialScore: maxPotentialScore,
            passingPercentage: level.passingScore || 70,
            isGuest: true
          }
        };
      }

      // ✅ For authenticated users, continue with progress updates
      const progress = await db.findOne('game_progress', { userId: userId });
      let nextLevelId = null;
      try {
        const allLevels = await db.findAll('game_levels');
        const currentLevel = allLevels.find(l => l.id === parseInt(levelId));

        if (currentLevel) {
          const sameChapterLevels = allLevels.filter(l => l.chapterId === currentLevel.chapterId)
            .sort((a, b) => a.order - b.order);
          const currentIndex = sameChapterLevels.findIndex(l => l.id === parseInt(levelId));

          if (currentIndex !== -1 && currentIndex < sameChapterLevels.length - 1) {
            nextLevelId = sameChapterLevels[currentIndex + 1].id;
          } else {
            // Check next chapter
            const allChapters = await db.findAll('game_chapters');
            allChapters.sort((a, b) => a.order - b.order);
            const currentChapterIndex = allChapters.findIndex(c => c.id === currentLevel.chapterId);

            if (currentChapterIndex !== -1 && currentChapterIndex < allChapters.length - 1) {
              const nextChapter = allChapters[currentChapterIndex + 1];
              const nextChapterLevels = allLevels.filter(l => l.chapterId === nextChapter.id)
                .sort((a, b) => a.order - b.order);
              if (nextChapterLevels.length > 0) {
                nextLevelId = nextChapterLevels[0].id;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error calculating next level:', err);
      }

      // ✅ CALCULATE REWARDS & UPDATE PROGRESS
      const alreadyCompleted = progress.completedLevels.includes(parseInt(levelId));
      const levelRewards = level.rewards || {};

      // Review logic: Track count and respect max rewards
      const levelReviewHistory = progress.levelReviewHistory || [];
      const reviewEntry = levelReviewHistory.find(h => parseInt(h.levelId) === parseInt(levelId));
      const currentReviewCount = reviewEntry?.count || 0;
      const maxReviewRewards = level.maxReviewRewards !== undefined ? level.maxReviewRewards : 3;

      let earnedPetals = 0;
      let earnedCoins = 0;
      let earnedPoints = finalScore;
      let character = null;

      if (!alreadyCompleted) {
        earnedPetals = levelRewards.petals || 1;
        earnedCoins = levelRewards.coins || 50;
        character = levelRewards.character || null;
      } else if (currentReviewCount < maxReviewRewards) {
        // Review Rewards: Use config or fallback to 10%
        earnedPetals = levelRewards.reviewPetals !== undefined ? levelRewards.reviewPetals : 0;
        earnedCoins = levelRewards.reviewCoins !== undefined ? levelRewards.reviewCoins : 10;
        earnedPoints = levelRewards.reviewPoints !== undefined ? levelRewards.reviewPoints : Math.round(finalScore * 0.1);
      } else {
        // Limit reached: No rewards
        earnedPetals = 0;
        earnedCoins = 0;
        earnedPoints = 0;
      }

      // Update basic progress stats
      const newTotalPointsRequested = (progress.totalPoints || 0) + earnedPoints;
      const newTotalCoinsRequested = (progress.coins || 0) + earnedCoins;
      const newTotalPetalsRequested = (progress.totalSenPetals || 0) + earnedPetals;
      const newTotalLearningTime = (progress.totalLearningTime || 0) + (timeSpent || session?.timeSpent || 0);

      let newCompleted = [...progress.completedLevels];
      let newCharacters = [...progress.collectedCharacters];
      let finishedChapters = [...(progress.finishedChapters || [])];
      let newCompletedModules = [...(progress.completedModules || [])];

      if (!alreadyCompleted) {
        newCompleted.push(parseInt(levelId));
        if (character && !newCharacters.includes(character)) {
          newCharacters.push(character);
        }

        // Chapter Finish Check
        const chapterLevels = await db.findMany('game_levels', { chapterId: level.chapterId });
        const allCompleted = chapterLevels.every(l => newCompleted.includes(l.id));
        if (allCompleted && !finishedChapters.includes(level.chapterId)) {
          finishedChapters.push(level.chapterId);
        }

        // Sync with Learning Module
        if (level.learningModuleId) {
          const moduleId = parseInt(level.learningModuleId);
          if (!newCompletedModules.some(m => parseInt(m.moduleId) === moduleId)) {
            newCompletedModules.push({
              moduleId: moduleId,
              completedDate: new Date().toISOString(),
              score: finalScore,
              timeSpent: timeSpent || session.timeSpent || 0
            });
          }
        }
      }

      const updatedLevelReviewHistory = (() => {
        const history = [...(progress.levelReviewHistory || [])];
        const idx = history.findIndex(h => parseInt(h.levelId) === parseInt(levelId));
        if (idx !== -1) {
          history[idx] = { ...history[idx], count: (history[idx].count || 0) + 1, lastAttempt: new Date().toISOString() };
        } else {
          history.push({ levelId: parseInt(levelId), count: 1, lastAttempt: new Date().toISOString() });
        }
        return history;
      })();

      // 💾 PERSIST PROGRESS updates
      await db.update('game_progress', progress.id, {
        completedLevels: newCompleted,
        completedModules: newCompletedModules,
        totalSenPetals: newTotalPetalsRequested,
        totalPoints: newTotalPointsRequested,
        coins: newTotalCoinsRequested,
        collectedCharacters: newCharacters,
        finishedChapters: finishedChapters,
        totalLearningTime: newTotalLearningTime,
        levelReviewHistory: updatedLevelReviewHistory
      });

      const updatedReviewEntry = updatedLevelReviewHistory.find(h => parseInt(h.levelId) === parseInt(levelId));
      const reviewCountForDisplay = alreadyCompleted
        ? Math.min(maxReviewRewards, Math.max(1, (updatedReviewEntry?.count || 0) - 1))
        : 0;

      // TRIGGER BADGE CHECK & LEVEL UP
      const calculatedLevel = Math.floor(newTotalPointsRequested / 1000) + 1;
      if (calculatedLevel > progress.level) {
        await db.update('game_progress', progress.id, { level: calculatedLevel });
        try {
          const badgeResult = await badgeService.checkAndUnlock(userId, 'level_reached', calculatedLevel);
          newBadges = badgeResult;
        } catch (e) { console.error('Badge check failed', e); }

        // Character check (only on Level Up for performance or logic consistency)
        try {
          const charCount = newCharacters.length;
          const charBadge = await badgeService.checkAndUnlock(userId, 'characters_collected', charCount);
          if (charBadge && charBadge.length > 0) {
            newBadges = [...(newBadges || []), ...charBadge];
          }
        } catch (e) { console.error('Character badge check failed', e); }
      }

      rewardsData = {
        petals: earnedPetals,
        coins: earnedCoins,
        trophies: earnedPoints,
        points: earnedPoints,
        character: character,
        isReview: alreadyCompleted
      };

      newTotals = {
        petals: newTotalPetalsRequested,
        points: newTotalPointsRequested,
        coins: newTotalCoinsRequested
      };

      // Rank & Notifications
      const oldRankInfo = this.calculateRank(progress.totalPoints || 0);
      const newRankInfo = this.calculateRank(newTotalPointsRequested);

      if (newRankInfo.currentRank !== oldRankInfo.currentRank) {
        try {
          await notificationService.notify(
            userId, 'Danh hiệu mới! 🏆',
            `Chúc mừng! Bạn đã đạt được danh hiệu mới: "${newRankInfo.currentRank}"!`,
            'system'
          );
        } catch (e) { console.error('Rank notification failed', e); }
      }

      try {
        await notificationService.notify(
          userId, alreadyCompleted ? 'Ôn tập hoàn tất! 📚' : 'Hoàn thành màn chơi! ✨',
          alreadyCompleted
            ? `Bạn vừa ôn tập lại màn "${level.name}". Nhận thêm ${earnedCoins} xu và ${earnedPoints} cúp!`
            : `Chúc mừng! Bạn đã vượt qua màn chơi "${level.name}" với ${earnedPoints} cúp!`,
          'learning', level.id
        );
      } catch (e) { console.error('Level notification failed', e); }


      // TRIGGER QUESTS
      try {
        const questService = require('./quest.service');

        // 1. Trigger Level Complete Quest
        await questService.checkAndAdvance(userId, 'complete_level', 1);

        // 2. Trigger Chapter Complete Quest
        const chapterLevels = await db.findMany('game_levels', { chapterId: level.chapterId });

        let effectiveCompletedIds = [];
        const currentProgress = await db.findOne('game_progress', { userId: userId });
        effectiveCompletedIds = currentProgress?.completedLevels || [];

        const isChapterDone = chapterLevels.every(l => effectiveCompletedIds.includes(l.id));

        if (isChapterDone) {
          console.log(`[GameService] Chapter ${level.chapterId} complete for user ${userId}. Triggering quest.`);
          await questService.checkAndAdvance(userId, 'complete_chapter', 1);

          // TRIGGER NOTIFICATION
          try {
            const chapter = await db.findById('game_chapters', level.chapterId);
            await notificationService.notify(
              userId,
              'Chương hoàn tất! 🌸',
              `Tuyệt vời! Bạn đã hoàn thành toàn bộ chương "${chapter?.name || ''}"!`,
              'learning',
              level.chapterId
            );
          } catch (e) { console.error('Chapter completion notification failed', e); }

          // TRIGGER BADGE CHECK (Chapter Completed)
          try {
            // Count total finished chapters
            const finalProgress = await db.findOne('game_progress', { userId: userId });
            const finishedCount = finalProgress.finishedChapters ? finalProgress.finishedChapters.length : 0;
            const chapterBadges = await badgeService.checkAndUnlock(userId, 'chapter_completed', finishedCount);

            // Add to newBadges if any
            if (chapterBadges && chapterBadges.length > 0) {
              if (!Array.isArray(newBadges)) newBadges = [];
              newBadges.push(...chapterBadges);
            }
          } catch (e) { console.error('Chapter badge check failed', e); }
        }
      } catch (e) {
        console.error('Quest trigger failed', e);
      }

      return {
        success: true,
        message: alreadyCompleted ? 'Level completed (Revision mode)' : 'Level completed successfully!',
        data: {
          passed: true,
          score: finalScore,
          breakdown: {
            baseScore: session.score,
            timeBonus: timeBonus,
            hintPenalty: hintPenalty
          },
          requiredScore: passingThreshold,
          maxPotentialScore: maxPotentialScore,
          passingPercentage: level.passingScore || 70,
          nextLevelId: nextLevelId,
          rewards: rewardsData, // null if revision
          newTotals: newTotals, // null if revision
          reviewProgress: alreadyCompleted
            ? {
              current: reviewCountForDisplay,
              total: maxReviewRewards
            }
            : null,
          isCompleted: alreadyCompleted,
          newBadges: newBadges || []
        }
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  calculateTimeBonus(timeSpent, timeLimit) {
    if (!timeLimit || timeSpent >= timeLimit) return 0;
    // Thưởng 1 điểm cho mỗi 10 giây còn dư
    return Math.floor((timeLimit - timeSpent) / 10);
  }

  /**
   * Calculate the maximum possible score for a level based on its screens
   * @param {Object} level 
   * @returns {number}
   */
  calculateMaxPotentialScore(level) {
    if (!level || !level.screens || !Array.isArray(level.screens)) return 0;

    return level.screens.reduce((total, screen) => {
      let screenPoints = screen.reward?.points || screen.points;

      // If points not explicitly defined, use defaults based on type
      if (screenPoints === undefined || screenPoints === null) {
        switch (screen.type) {
          case 'QUIZ':
            screenPoints = 20;
            break;
          case 'TIMELINE':
            screenPoints = 20;
            break;
          case 'HIDDEN_OBJECT':
            // HIDDEN_OBJECT awards points per item
            const itemCount = screen.items?.length || 0;
            const requiredCount = screen.requiredItems || itemCount;
            // Assuming 10 points per required item as a default if not specified
            screenPoints = requiredCount * 10;
            break;
          case 'DIALOGUE':
          case 'VIDEO':
          case 'IMAGE_VIEWER':
            screenPoints = 10;
            break;
          default:
            screenPoints = 0;
        }
      } else if (screen.type === 'HIDDEN_OBJECT' && !screen.reward?.points && !screen.points) {
        // If items have individual points but screen doesn't have a total "reward.points"
        const totalItemsPoints = (screen.items || []).reduce((sum, item) => sum + (item.points || 10), 0);
        screenPoints = totalItemsPoints;
      }

      return total + screenPoints;
    }, 0);
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

  enrichScreen(screen, session, index, totalScreens, level = null) {
    const enriched = {
      ...screen,
      index,
      isFirst: index === 0,
      isLast: index === totalScreens - 1,
      isCompleted: session.completedScreens.includes(screen.id),
      state: session.screenStates?.[screen.id] || {}
    };

    // For HIDDEN_OBJECT screens, merge level.clues into items if items is empty
    if (screen.type === 'HIDDEN_OBJECT' && level) {
      if (!enriched.items || enriched.items.length === 0) {
        // Use level.clues as items
        enriched.items = (level.clues || []).map(clue => ({
          id: clue.id,
          name: clue.name,
          x: clue.coordinates?.x ?? 50,
          y: clue.coordinates?.y ?? 50,
          factPopup: clue.content || clue.description || 'Thông tin thú vị!',
          points: clue.points || 10
        }));
        enriched.requiredItems = enriched.items.length;
      }
    }

    // For TIMELINE screens, merge level.clues into events if events is empty
    if (screen.type === 'TIMELINE' && level) {
      if (!enriched.events || enriched.events.length === 0) {
        // Use level.clues as events, extract year from name (e.g., "Năm 1802")
        enriched.events = (level.clues || []).map(clue => {
          const yearMatch = clue.name?.match(/(\d{4})/);
          return {
            id: clue.id,
            title: clue.content || clue.name,
            year: yearMatch ? parseInt(yearMatch[1]) : 0,
            description: clue.hint || ''
          };
        });
        // correctOrder is sorted by year
        enriched.correctOrder = [...enriched.events]
          .sort((a, b) => a.year - b.year)
          .map(e => e.id);
      }
    }

    // Calculate potential score for this screen
    let potentialScore = 0;
    switch (screen.type) {
      case 'HIDDEN_OBJECT':
        const items = enriched.items || [];
        potentialScore = items.reduce((sum, item) => sum + (item.points || 10), 0);
        break;
      case 'QUIZ':
      case 'TIMELINE':
        potentialScore = screen.reward?.points || screen.points || 20;
        break;
      case 'DIALOGUE':
      case 'VIDEO':
      case 'IMAGE_VIEWER':
        potentialScore = screen.reward?.points || screen.points || 10;
        break;
      default:
        potentialScore = 0;
    }

    return { ...enriched, potentialScore: potentialScore };;
  }

  // ==================== MUSEUM ====================

  async getMuseum(userId) {
    const progress = await this.getProgress(userId);

    // ✅ Trigger Quest Progression for visiting museum
    try {
      console.log(`[DEBUG] Triggering visit_museum quest for user: ${userId}`);
      const questResult = await questService.checkAndAdvance(userId, 'visit_museum');
      console.log(`[DEBUG] Quest progression result:`, JSON.stringify(questResult));
    } catch (e) {
      console.error("Error advancing museum quest:", e);
    }

    // Fetch Artifacts from Scan History
    let artifacts = [];
    try {
      const scanHistory = await db.findAll('scan_history');
      const userScans = scanHistory.filter(h => h.userId === parseInt(userId));
      const allArtifacts = await db.findAll('artifacts');

      artifacts = userScans.map(scan => {
        const artifact = allArtifacts.find(a => a.id === scan.objectId);
        if (!artifact) return null;
        return {
          artifactId: artifact.id,
          name: artifact.name,
          image: artifact.image,
          description: artifact.description,
          acquiredAt: scan.scannedAt,
          type: artifact.artifactType
        };
      }).filter(a => a !== null);
    } catch (e) {
      console.error("Error fetching museum artifacts:", e);
    }

    const lastCollection = progress.data.lastMuseumCollection || progress.data.createdAt;

    // Tính thu nhập tích lũy (bao gồm cả Artifacts)
    const incomeInfo = this.calculatePendingIncome(progress.data, lastCollection, artifacts.length);

    return {
      success: true,
      data: {
        isOpen: progress.data.museumOpen,
        incomePerHour: incomeInfo.rate,
        totalIncomeGenerated: progress.data.museumIncome || 0,
        pendingIncome: incomeInfo.pending,
        hoursAccumulated: incomeInfo.hoursAccumulated,
        capped: incomeInfo.capped || false,
        characters: progress.data.collectedCharacters,
        artifacts: artifacts,
        visitorCount: (progress.data.collectedCharacters.length * 50) + (artifacts.length * 20), // More visitors!
        canCollect: incomeInfo.pending > 0,
        nextCollectionIn: this.getNextCollectionTime(incomeInfo.rate),

        // ✅ WARNING MESSAGE
        ...(incomeInfo.capped && {
          capNotice: `Income capped at ${incomeInfo.pending} coins. Please collect regularly to maximize earnings!`
        })
      }
    };
  }

  /**
   * Tính toán thu nhập đang chờ
   */
  calculatePendingIncome(progressData, lastCollectionTime, artifactCount = 0) {
    if (!progressData.museumOpen) {
      return { rate: 0, pending: 0, hoursAccumulated: 0, capped: false };
    }

    const charCount = progressData.collectedCharacters.length;
    if (charCount === 0 && artifactCount === 0) {
      return { rate: 0, pending: 0, hoursAccumulated: 0, capped: false };
    }

    // FORMULA: 10 coins/char/hour + 5 coins/artifact/hour
    const ratePerHour = (charCount * 10) + (artifactCount * 5);

    const now = new Date();
    const last = new Date(lastCollectionTime);
    const diffHours = Math.abs(now - last) / 36e5;

    // Cap hours to 24 (encourage daily login)
    const cappedHours = Math.min(diffHours, 24);

    // ✅ ADD HARD CAP FOR PENDING INCOME
    const MAX_PENDING_INCOME = 10000; // Increased cap
    const rawPending = Math.floor(ratePerHour * cappedHours);
    const pending = Math.min(rawPending, MAX_PENDING_INCOME);

    // ✅ LOG WARNING IF HIT CAP
    const hitCap = rawPending > MAX_PENDING_INCOME;
    if (hitCap) {
      console.log(`⚠️ User ${progressData.userId} hit max pending income cap (${rawPending} → ${MAX_PENDING_INCOME})`);
    }

    return {
      rate: ratePerHour,
      pending: pending,
      hoursAccumulated: cappedHours.toFixed(1),
      capped: hitCap,
      wouldBeWithoutCap: hitCap ? rawPending : null
    };
  }

  /**
   * Mở/đóng bảo tàng
   */
  async toggleMuseum(userId, isOpen) {
    const progress = await db.findOne('game_progress', { userId: userId });

    await db.update('game_progress', progress.id, {
      museumOpen: isOpen
    });

    return {
      success: true,
      message: `Museum ${isOpen ? 'opened' : 'closed'}`,
      data: {
        isOpen: isOpen,
        incomePerHour: this.calculateMuseumIncome(progress)
      }
    };
  }

  /**
   * Thu hoạch tiền từ bảo tàng (WITH LOCK MECHANISM)
   */
  async collectMuseumIncome(userId) {
    // === STEP 1: CHECK LOCK ===
    const lockKey = `museum_collect_${userId}`;

    // Nếu đang có request collect khác, reject ngay
    if (this.activeLocks.has(lockKey)) {
      return {
        success: false,
        message: 'Income collection already in progress. Please wait.',
        statusCode: 429 // Too Many Requests
      };
    }

    // === STEP 2: ACQUIRE LOCK ===
    this.activeLocks.add(lockKey);
    console.log(`🔒 Lock acquired for user ${userId} museum collection`);

    try {
      // === STEP 3: BUSINESS LOGIC (TRONG TRY BLOCK) ===

      const progress = await db.findOne('game_progress', { userId: userId });

      if (!progress) {
        return {
          success: false,
          message: 'User progress not found',
          statusCode: 404
        };
      }

      if (!progress.museumOpen) {
        return {
          success: false,
          message: 'Museum is closed',
          statusCode: 400
        };
      }

      const lastCollection = progress.lastMuseumCollection || progress.createdAt;

      // Fetch artifact count for calculation
      let artifactCount = 0;
      try {
        const scanHistory = await db.findAll('scan_history');
        artifactCount = scanHistory.filter(h => h.userId === parseInt(userId)).length;
      } catch (e) {
        console.error("Error counting artifacts for collection:", e);
      }

      const incomeInfo = this.calculatePendingIncome(progress, lastCollection, artifactCount);

      if (incomeInfo.pending <= 0) {
        return {
          success: false,
          message: 'No income to collect yet',
          statusCode: 400
        };
      }

      // === CRITICAL SECTION: UPDATE DB ===
      const newCoins = (progress.coins || 0) + incomeInfo.pending;
      const newTotalMuseumIncome = (progress.museumIncome || 0) + incomeInfo.pending;

      // Single atomic update để tránh partial updates
      const updatedProgress = await db.update('game_progress', progress.id, {
        coins: newCoins,
        museumIncome: newTotalMuseumIncome,
        lastMuseumCollection: new Date().toISOString()
      });

      console.log(`✅ User ${userId} collected ${incomeInfo.pending} coins from museum`);

      return {
        success: true,
        message: `Collected ${incomeInfo.pending} coins from Museum!`,
        data: {
          collected: incomeInfo.pending,
          totalCoins: newCoins,
          totalMuseumIncome: newTotalMuseumIncome,
          nextCollectionIn: this.getNextCollectionTime(incomeInfo.rate)
        }
      };

    } catch (error) {
      // === STEP 4: ERROR HANDLING ===
      console.error(`❌ Museum collection error for user ${userId}:`, error);

      return {
        success: false,
        message: 'Failed to collect income. Please try again.',
        statusCode: 500
      };

    } finally {
      // === STEP 5: RELEASE LOCK (ALWAYS) ===
      this.activeLocks.delete(lockKey);
      console.log(`🔓 Lock released for user ${userId} museum collection`);
    }
  }



  /**
   * Helper: Tính thời gian có thể collect tiếp theo
   */
  getNextCollectionTime(ratePerHour) {
    if (ratePerHour === 0) return 'Museum has no income';

    const minutesToNextCoin = Math.ceil(60 / ratePerHour);
    return `${minutesToNextCoin} minutes`;
  }


  // ==================== SCAN ====================



  /**
   * Scan object tại di tích
   */
  async scanObject(userId, code, location) {
    const artifact = await db.findOne('scan_objects', { code: code.toUpperCase() });

    if (!artifact) {
      return { success: false, message: 'Invalid scan code', statusCode: 404 };
    }

    // ✅ CHECK DUPLICATE SCAN - Prevent farming
    const existingScan = await db.findOne('scan_history', {
      userId: userId,
      objectId: artifact.id
    });

    if (existingScan) {
      return {
        success: false,
        message: 'You have already scanned this object',
        statusCode: 400,
        data: {
          scannedAt: existingScan.scannedAt,
          artifact: artifact
        }
      };
    }

    // Kiểm tra vị trí nếu có
    if (artifact.latitude && location.latitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        artifact.latitude,
        artifact.longitude
      );

      if (distance > 0.5) {
        return { success: false, message: 'You are too far from the location', statusCode: 400 };
      }
    }

    const progress = await db.findOne('game_progress', { userId: userId });

    const reward = {
      coins: artifact.rewardCoins || 100,
      petals: artifact.rewardPetals || 1,
      character: artifact.rewardCharacter || null
    };

    let newCharacters = [...progress.collectedCharacters];
    if (reward.character && !newCharacters.includes(reward.character)) {
      newCharacters.push(reward.character);
    }

    await db.update('game_progress', progress.id, {
      coins: progress.coins + reward.coins,
      totalSenPetals: progress.totalSenPetals + reward.petals,
      collectedCharacters: newCharacters
    });

    // TRIGGER BADGE CHECK (Characters Collected)
    let newBadges = [];
    try {
      const charCount = newCharacters.length;
      const charBadge = await badgeService.checkAndUnlock(userId, 'characters_collected', charCount);
      newBadges = charBadge;
    } catch (e) { console.error('Character badge check failed', e); }

    // Lưu scan history 
    const historyEntry = await db.create('scan_history', {
      userId: userId,
      objectId: artifact.id,
      location: location,
      type: 'collect_artifact', // Ensure type is explicitly set
      scannedAt: new Date().toISOString(),
      scanCode: code
    });

    // Logging Transactions for summary/stats
    await db.create('transactions', {
      userId: userId,
      type: 'earn',
      source: 'artifact_scan',
      sourceId: artifact.id,
      amount: reward.coins,
      currency: 'coins',
      description: `Thưởng Thu thập hiện vật: ${artifact.name}`,
      createdAt: new Date().toISOString()
    });

    if (reward.petals > 0) {
      await db.create('transactions', {
        userId: userId,
        type: 'earn',
        source: 'artifact_scan',
        sourceId: artifact.id,
        amount: reward.petals,
        currency: 'petals',
        description: `Thưởng Thu thập hiện vật: ${artifact.name}`,
        createdAt: new Date().toISOString()
      });
    }

    // ✅ TRIGGER QUEST PROGRESS
    try {
      await questService.checkAndAdvance(userId, 'collect_artifact', 1);
    } catch (e) { console.error('Quest advance failed', e); }

    return {
      success: true,
      message: 'Scan successful!',
      data: { artifact, rewards: reward, newBadges }
    };
  }


  // ==================== BADGES & ACHIEVEMENTS ====================

  /**
   * Lấy badges
   */
  async getBadges(userId) {
    // 1. Get current progress
    let progress = await this.getProgress(userId);
    const progressData = progress.data;

    // 2. Auto-Heal: Check specific badge types that are easy to calculate
    try {
      // A. Chapters Completed
      const finishedCount = progressData.finishedChapters ? progressData.finishedChapters.length : 0;
      await badgeService.checkAndUnlock(userId, 'chapter_completed', finishedCount);

      // B. Characters Collected
      const charCount = progressData.collectedCharacters ? progressData.collectedCharacters.length : 0;
      await badgeService.checkAndUnlock(userId, 'characters_collected', charCount);

      // C. Level Reached
      const currentLevel = progressData.level || 1;
      await badgeService.checkAndUnlock(userId, 'level_reached', currentLevel);

      // Note: 'clues_collected' and 'perfect_quiz' are too expensive to calculate here
      // without aggregate queries, so we rely on their specific triggers.

    } catch (e) {
      console.error('Auto-heal badges failed', e);
    }

    // 3. Re-fetch progress to get updated badges list
    progress = await this.getProgress(userId);
    const allBadges = await db.findAll('game_badges');

    // 4. Enrich
    const userBadges = progress.data.badges || [];
    // note: progress.data.badges might be array of strings (ids) or objects? 
    // In BadgeService.js: progress.badges = [...(progress.badges || []), newBadgeEntry];
    // where newBadgeEntry is { id, name, ... }.
    // So it is an array of OBJECTS.
    // But checkAndUnlock logic: if (currentBadges.some(b => b.id === badge.id))

    // Check db.json content: "badges": ["quiz_master"] -> It was STRINGS in my previous view of db.json!
    // Wait, let's check BadgeService.js again.
    // line 33: if (currentBadges.some(b => b.id === badge.id))
    // If db.json has strings, this check check will FAIL (undefined === badge.id).
    // AND the push: progress.badges = [... [], newBadgeEntry object].
    // So it will become mixed [ "quiz_master", { id: 1, ... } ].

    // I NEED TO FIX BADGESERVICE TO HANDLE BOTH or MIGRATE DB.
    // If db.json has strings, I should probably convert them or handle them.
    // 'quiz_master' seems like a legacy string ID. The new system uses numeric IDs and objects.

    // Let's stick to the Auto-Healing logic first.

    const enriched = allBadges.map(badge => {
      const isUnlocked = userBadges.some(b => {
        if (typeof b === 'string') return false; // Ignore legacy strings, rely on auto-heal to add objects
        return b && b.id === badge.id;
      });
      return {
        ...badge,
        isUnlocked: isUnlocked
      };
    });

    return { success: true, data: enriched };
  }

  async getAchievements(userId) {
    const progress = await this.getProgress(userId);
    const allAchievements = await db.findAll('game_achievements');

    const enriched = allAchievements.map(achievement => ({
      ...achievement,
      isCompleted: progress.data.achievements.includes(achievement.id)
    }));

    return { success: true, data: enriched };
  }

  // ==================== LEADERBOARD ====================

  /**
 * Bảng xếp hạng
 */
  async getLeaderboard(type = 'points', limit = 20) {
    let sortField = 'totalPoints';
    if (type === 'level') sortField = 'level';
    if (type === 'checkins') sortField = 'checkinCount';

    // Optimized: Use findAllAdvanced directly with sort
    const result = await db.findAllAdvanced('game_progress', {
      sort: sortField,
      order: 'desc',
      limit: limit,
      page: 1
    });

    const leaderboard = await Promise.all(result.data.map(async (prog, index) => {
      const user = await db.findById('users', prog.userId);
      return {
        rank: index + 1,
        userId: prog.userId,
        userName: user?.name || 'Unknown',
        userAvatar: user?.avatar,
        totalPoints: prog.totalPoints,
        level: prog.level,
        checkinCount: prog.checkinCount || 0,
        senPetals: prog.totalSenPetals,
        charactersCount: prog.collectedCharacters?.length || 0
      };
    }));

    return { success: true, data: leaderboard };
  }

  /**
   * Check-in tại địa điểm (QR Code)
   */
  async checkIn(userId, locationId) {
    // 1. Validate location
    const location = await db.findById('heritage_sites', locationId);
    if (!location) {
      return { success: false, message: 'Location not found', statusCode: 404 };
    }

    // 2. Check cooldown (e.g., 1 hour)
    const lastCheckin = await db.findOne('scan_history', {
      userId: userId,
      objectId: locationId,
      type: 'checkin'
    });

    if (lastCheckin) {
      const lastTime = new Date(lastCheckin.scannedAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastTime) / (1000 * 60);
      if (diffMinutes < 60) {
        return { success: false, message: 'Bạn đã check-in gần đây, hãy quay lại sau!', statusCode: 400 };
      }
    }

    // 3. Record Check-in
    const timestamp = new Date().toISOString();
    await db.create('scan_history', {
      userId: userId,
      objectId: locationId,
      type: 'checkin',
      scannedAt: timestamp,
      scanCode: `CHECKIN_${locationId}`
    });

    // 4. Update Progress & Rewards
    const progress = await db.findOne('game_progress', { userId: userId });
    // Initialize if needed
    if (!progress) await this.initializeProgress(userId);

    const points = 50; // Points/Coins per check-in
    await db.update('game_progress', progress.id, {
      totalPoints: (progress.totalPoints || 0) + points,
      coins: (progress.coins || 0) + points,
      checkinCount: (progress.checkinCount || 0) + 1,
      lastActivity: new Date().toISOString()
    });

    // ✅ TRIGGER QUEST PROGRESS
    try {
      await questService.checkAndAdvance(userId, 'checkin_location', 1);
    } catch (e) { console.error('Quest advance failed', e); }

    // 5. Trigger Notification and Log Transaction
    await db.create('transactions', {
      userId: userId,
      type: 'earn',
      source: 'checkin',
      sourceId: locationId,
      amount: points,
      currency: 'coins',
      description: `Thưởng Ghi danh: ${location.name}`,
      createdAt: timestamp
    });

    try {
      const notificationService = require('./notification.service');
      await notificationService.notify(
        userId,
        'Check-in thành công! 📍',
        `Bạn đã check-in tại "${location.name}" và nhận được ${points} điểm!`,
        'social', // Using social or reward icon
        locationId
      );
    } catch (e) { console.error('Notify checkin failed', e); }

    return {
      success: true,
      message: 'Check-in thành công!',
      data: {
        pointsEarned: points,
        locationName: location.name,
        totalCheckins: (progress.checkinCount || 0) + 1
      }
    };
  }

  /**
   * Reset điểm người chơi (Admin Action)
   */
  async resetUserScore(userId) {
    const progress = await db.findOne('game_progress', { userId: userId });

    if (!progress) {
      return { success: false, message: 'User progress not found', statusCode: 404 };
    }

    await db.update('game_progress', progress.id, {
      totalPoints: 0,
      completedLevels: [], // Optional: Reset progress too? No, just score as requested "Reset Điểm"
      // If we only reset points, we keep levels unlocked. 
      // But totalPoints is usually cumulative. 
      // Let's stick to strict "Reset Score" (totalPoints = 0).
    });

    return {
      success: true,
      message: 'Successfully reset user score to 0',
      data: { userId, totalPoints: 0 }
    };
  }

  /**
   * Nhận thưởng hàng ngày (Consolidated Version)
   */
  async getDailyReward(userId) {
    let progress = await db.findOne('game_progress', { userId: userId });
    if (!progress) {
      progress = await this.initializeProgress(userId);
    }

    const now = new Date();
    // Using simple YYYY-MM-DD from local time for comparison
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    const lastClaimDate = progress.lastRewardClaim ? new Date(progress.lastRewardClaim) : null;
    const lastClaim = lastClaimDate
      ? `${lastClaimDate.getFullYear()}-${lastClaimDate.getMonth() + 1}-${lastClaimDate.getDate()}`
      : null;

    if (lastClaim === today) {
      return {
        success: false,
        message: 'Bạn đã nhận thưởng hôm nay rồi!',
        statusCode: 400,
        data: {
          streakDays: progress.streakDays || 1,
          claimedToday: true
        }
      };
    }

    // Calculate Streak
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${yesterdayDate.getMonth() + 1}-${yesterdayDate.getDate()}`;

    let streak = (progress.streakDays || 0);
    if (lastClaim === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }

    // Rewards based on streak (Day 7 gives bonus)
    const dayInCycle = ((streak - 1) % 7) + 1;
    const coinsReward = 100 + (dayInCycle * 20) + (dayInCycle === 7 ? 500 : 0);
    const petalsReward = dayInCycle === 7 ? 5 : 1;

    const updatedData = {
      coins: (progress.coins || 0) + coinsReward,
      totalSenPetals: (progress.totalSenPetals || 0) + petalsReward,
      streakDays: streak,
      lastRewardClaim: now.toISOString(),
      pcoin: (progress.pcoin || 0) + (dayInCycle === 7 ? 10 : 0)
    };

    await db.update('game_progress', progress.id, updatedData);

    return {
      success: true,
      message: `Nhận thưởng thành công! Day ${dayInCycle} của chuỗi.`,
      data: {
        coinsReward,
        petalsReward,
        streakDays: streak,
        dayInCycle,
        rewards: [
          { type: 'coins', amount: coinsReward },
          { type: 'petals', amount: petalsReward }
        ]
      }
    };
  }

  // ==================== SHOP & INVENTORY ====================

  /**
   * Mua item trong shop
   */
  async purchaseItem(userId, itemId, quantity) {
    const item = await db.findById('shop_items', itemId);
    if (!item) {
      return { success: false, message: 'Item not found', statusCode: 404 };
    }

    const progress = await db.findOne('game_progress', { userId: userId });
    const totalCost = item.price * quantity;

    if (progress.coins < totalCost) {
      return { success: false, message: 'Not enough coins', statusCode: 400 };
    }

    // ✅ TRANSACTION SAFETY: Backup state for rollback
    const originalCoins = progress.coins;
    let inventoryBackup = null;

    try {
      // Step 1: Deduct coins
      await db.update('game_progress', progress.id, {
        coins: progress.coins - totalCost
      });

      // Step 2: Update inventory
      let inventory = await db.findOne('user_inventory', { userId: userId });
      if (!inventory) {
        inventory = await db.create('user_inventory', { userId: userId, items: [] });
      }

      // Backup inventory state
      inventoryBackup = { ...inventory, items: [...inventory.items] };

      const existingItem = inventory.items.find(i => i.itemId === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        inventory.items.push({
          itemId: itemId,
          quantity: quantity,
          acquiredAt: new Date().toISOString()
        });
      }

      await db.update('user_inventory', inventory.id, { items: inventory.items });

      // ✅ SUCCESS
      return {
        success: true,
        message: 'Purchase successful',
        data: {
          item,
          quantity,
          totalCost: totalCost,
          remainingCoins: progress.coins - totalCost
        }
      };

    } catch (error) {
      // ✅ ROLLBACK on error
      console.error('❌ Purchase failed, rolling back:', error);

      // Restore coins
      await db.update('game_progress', progress.id, {
        coins: originalCoins
      });

      // Restore inventory if it was modified
      if (inventoryBackup) {
        await db.update('user_inventory', inventoryBackup.id, {
          items: inventoryBackup.items
        });
      }

      return {
        success: false,
        message: 'Purchase failed. Your coins have been refunded.',
        statusCode: 500
      };
    }
  }

  /**
   * Lấy inventory
   */
  async getInventory(userId) {
    const inventory = await db.findOne('user_inventory', { userId: userId });

    if (!inventory) {
      return { success: true, data: { items: [] } };
    }

    const enriched = await Promise.all(inventory.items.map(async (item) => {
      const itemData = await db.findById('shop_items', item.itemId);
      return { ...item, ...itemData };
    }));

    return { success: true, data: { items: enriched } };
  }

  /**
   * Sử dụng item
   */
  async useItem(userId, itemId, targetId) {
    const inventory = await db.findOne('user_inventory', { userId: userId });
    if (!inventory) {
      return { success: false, message: 'No inventory found', statusCode: 404 };
    }

    const item = inventory.items.find(i => i.itemId === itemId);
    if (!item || item.quantity <= 0) {
      return { success: false, message: 'Item not found or quantity is 0', statusCode: 400 };
    }

    const itemData = await db.findById('shop_items', itemId);
    const progress = await db.findOne('game_progress', { userId: userId });

    let effect = 'Applied successfully';
    const updates = {};

    // Specific category handling
    switch (itemData.type) {
      case 'consumable_hint':
        updates.hintCharges = (progress.hintCharges || 0) + 1;
        effect = 'Đã thêm 1 lượt gợi ý vào tài khoản.';
        break;
      case 'consumable_shield':
        updates.shieldCharges = (progress.shieldCharges || 0) + 1;
        effect = 'Đã kích hoạt bảo vệ cho màn chơi tiếp theo.';
        break;
      case 'permanent_theme':
        const themes = progress.unlockedThemes || ['default'];
        if (!themes.includes(itemData.effect || itemData.name)) {
          themes.push(itemData.effect || itemData.name);
        }
        updates.activeTheme = itemData.effect || itemData.name;
        updates.unlockedThemes = themes;
        effect = `Đã áp dụng giao diện ${itemData.name}.`;
        break;
      case 'permanent_avatar':
        const avatars = progress.unlockedAvatars || [];
        if (!avatars.includes(itemData.image)) {
          avatars.push(itemData.image);
        }
        updates.activeAvatar = itemData.image;
        updates.unlockedAvatars = avatars;
        effect = 'Đã thay đổi ảnh đại diện mới.';
        break;
      default:
        // Generic consumption for other types
        effect = `Sử dụng ${itemData.name} thành công.`;
    }

    // Update Progress if there are specific effect updates
    if (Object.keys(updates).length > 0) {
      await db.update('game_progress', progress.id, updates);
    }

    // Deduct quantity
    item.quantity -= 1;
    await db.update('user_inventory', inventory.id, { items: inventory.items });

    return {
      success: true,
      message: 'Sử dụng vật phẩm thành công',
      data: { item: itemData, effect: effect }
    };
  }

  /**
   * Lấy lịch sử quét và check-in của người dùng
   */
  async getScanHistory(userId) {
    const history = await db.findMany('scan_history', { userId: userId });

    // Sort by date desc
    history.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

    const enriched = await Promise.all(history.map(async (item) => {
      // --- ENRICH MISSING FIELDS ---
      // Legacy records may be missing 'type' and 'scanCode' if migrated before schema included them.
      // Infer them from scan_objects using objectId.
      if (!item.type || !item.scanCode) {
        const scanObj = await db.findById('scan_objects', item.objectId);
        if (scanObj) {
          if (!item.type) {
            item.type = scanObj.type === 'heritage_site' ? 'checkin' : 'collect_artifact';
          }
          if (!item.scanCode) {
            item.scanCode = scanObj.code;
          }
        }
      }

      // --- NAME LOOKUP ---
      let objectData = null;
      if (item.type === 'checkin') {
        objectData = await db.findById('heritage_sites', item.objectId);
      } else if (item.type === 'collect_artifact') {
        objectData = await db.findById('artifacts', item.objectId);
        if (!objectData) {
          const scanObj = await db.findById('scan_objects', item.objectId);
          if (scanObj) {
            let realImage = scanObj.image;
            if (!realImage && scanObj.referenceId) {
              if (scanObj.type === 'heritage_site') {
                const site = await db.findById('heritage_sites', scanObj.referenceId);
                realImage = site?.mainImage || site?.image || site?.thumbnail;
              } else {
                const art = await db.findById('artifacts', scanObj.referenceId);
                realImage = art?.mainImage || art?.image;
              }
            }
            objectData = { name: scanObj.name || scanObj.title, image: realImage };
          }
        }
      }

      // Final fallback: if still no data, try scan_objects for any type (including legacy/missing types)
      if (!objectData) {
        const scanObj = await db.findById('scan_objects', item.objectId);
        if (scanObj) {
          let realImage = scanObj.image;
          if (!realImage && scanObj.referenceId) {
            if (scanObj.type === 'heritage_site') {
              const site = await db.findById('heritage_sites', scanObj.referenceId);
              realImage = site?.mainImage || site?.image || site?.thumbnail;
            } else {
              const art = await db.findById('artifacts', scanObj.referenceId);
              realImage = art?.mainImage || art?.image;
            }
          }
          objectData = { name: scanObj.name || scanObj.title, image: realImage };
        }
      }

      // Find rewards for this scan matched by sourceId
      // Try objectId directly first, then fall back to scan_objects.referenceId
      let itemRewards = await db.findMany('transactions', {
        userId: userId,
        source: item.type === 'checkin' ? 'checkin' : 'artifact_scan',
        sourceId: item.objectId
      });
      // If no match, try looking up via scan_object's referenceId
      if (itemRewards.length === 0) {
        const scanObjForReward = await db.findById('scan_objects', item.objectId);
        if (scanObjForReward?.referenceId) {
          itemRewards = await db.findMany('transactions', {
            userId: userId,
            source: item.type === 'checkin' ? 'checkin' : 'artifact_scan',
            sourceId: scanObjForReward.referenceId
          });
        }
      }



      return {
        ...item,
        objectName: objectData?.name || 'Unknown',
        objectImage: objectData?.image || (item.type === 'checkin' ? '/images/site-placeholder.jpg' : '/images/artifact-placeholder.jpg'),
        rewards: Object.entries(
          itemRewards.reduce((acc, r) => {
            acc[r.currency] = (acc[r.currency] || 0) + r.amount;
            return acc;
          }, {})
        ).map(([currency, amount]) => ({ currency, amount }))
      };
    }));

    // Calculate statistics
    const stats = {
      totalCheckins: history.filter(h => h.type === 'checkin').length,
      totalArtifacts: history.filter(h => h.type === 'collect_artifact').length,
      uniqueSites: new Set(history.filter(h => h.type === 'checkin').map(h => h.objectId)).size,
      totalCoinsEarned: enriched.reduce((sum, item) =>
        sum + item.rewards.filter(r => r.currency === 'coins').reduce((s, r) => s + r.amount, 0), 0),
      totalPetalsEarned: enriched.reduce((sum, item) =>
        sum + item.rewards.filter(r => r.currency === 'petals').reduce((s, r) => s + r.amount, 0), 0)
    };

    return {
      success: true,
      data: {
        history: enriched,
        stats
      }
    };
  }
}

module.exports = new GameService();