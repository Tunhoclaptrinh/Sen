const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');
const notificationService = require('./notification.service');

class LearningService extends ReviewableService {
  constructor() {
    super('learning_modules');
  }

  /**
   * Transform data before create
   */
  async beforeCreate(data) {
    // Initial status for review workflow if not provided
    if (!data.status) data.status = 'draft';

    return super.beforeCreate(data);
  }

  async completeModule(moduleId, userId, score, answers) {
    const moduleIdInt = parseInt(moduleId);
    let finalScore = parseInt(score);

    // 1. Get Module Detail using BaseService standard
    const moduleResult = await this.findById(moduleIdInt);
    if (!moduleResult.success) {
      return { success: false, message: 'Module not found', statusCode: 404 };
    }
    const moduleItem = moduleResult.data;

    // 2. Server-side score validation (Weighted Scoring)
    if (answers && moduleItem.quiz && moduleItem.quiz.questions) {
      let totalPoints = 0;
      let earnedPoints = 0;

      moduleItem.quiz.questions.forEach((q, idx) => {
        const questionPoint = q.point || 10;
        totalPoints += questionPoint;

        const qKey = q.id !== undefined ? q.id : idx;

        // Check if answer is correct
        // Note: answers keys might be strings in JSON
        if (answers[qKey] !== undefined && parseInt(answers[qKey]) === q.correctAnswer) {
          earnedPoints += questionPoint;
        }
      });

      if (totalPoints > 0) {
        finalScore = Math.round((earnedPoints / totalPoints) * 100);
      }
    }

    // 3. User Game Progress Logic
    // ... (rest of game logic)
    // Use game_progress
    let gameProgress = await db.findOne('game_progress', { userId: userId });

    if (!gameProgress) {
      const gameService = require('./game.service');
      gameProgress = await gameService.initializeProgress(userId);
    }

    // Check if module is already completed
    const existingCompletionIndex = (gameProgress.completedModules || []).findIndex(m => parseInt(m.moduleId) === moduleIdInt);
    const isAlreadyCompleted = existingCompletionIndex !== -1;

    const completedModule = {
      moduleId: moduleIdInt,
      completedDate: new Date().toISOString(),
      score: finalScore,
      timeSpent: 0
    };

    const passingScore = moduleItem.quiz?.passingScore || 70;

    // Points & Coins logic:
    // Configurable via moduleItem: rewardPoints, rewardCoins, reviewRewardPoints, reviewRewardCoins
    let points = 0;
    let coins = 0;
    if (finalScore >= passingScore) {
      if (!isAlreadyCompleted) {
        points = moduleItem.rewardPoints !== undefined ? moduleItem.rewardPoints : 50;
        coins = moduleItem.rewardCoins !== undefined ? moduleItem.rewardCoins : 0;
      } else {
        points = moduleItem.reviewRewardPoints !== undefined ? moduleItem.reviewRewardPoints : 10;
        coins = moduleItem.reviewRewardCoins !== undefined ? moduleItem.reviewRewardCoins : 0;
      }
    }

    // Level calculation: Every 200 points = 1 level
    const newTotalPoints = (gameProgress.totalPoints || 0) + points;
    const newTotalCoins = (gameProgress.totalCoins || 0) + coins;
    const newLevel = Math.floor(newTotalPoints / 200) + 1;

    // Badge logic
    let newBadges = [...(gameProgress.badges || [])];
    const completedCount = (gameProgress.completedModules || []).length + 1;

    if (completedCount === 1 && !newBadges.includes('newbie')) {
      newBadges.push('newbie'); // Badge: Người Mới Bắt Đầu
    }
    if (finalScore === 100 && !newBadges.includes('perfect_score')) {
      newBadges.push('perfect_score'); // Badge: Điểm Tuyệt Đối
    }

    // Deduplicate and update score
    let newCompletedModules = [...(gameProgress.completedModules || [])];
    if (isAlreadyCompleted) {
      const existingEntries = newCompletedModules.filter(m => parseInt(m.moduleId) === moduleIdInt);
      const maxExistingScore = Math.max(...existingEntries.map(m => m.score || 0));
      const bestScore = Math.max(maxExistingScore, finalScore);

      newCompletedModules = newCompletedModules.filter(m => parseInt(m.moduleId) !== moduleIdInt);
      newCompletedModules.push({
        moduleId: moduleIdInt,
        completedDate: new Date().toISOString(),
        score: bestScore,
        timeSpent: 0
      });
    } else {
      newCompletedModules.push(completedModule);
    }

    // Update Progress
    await db.update('game_progress', gameProgress.id, {
      completedModules: newCompletedModules,
      totalPoints: newTotalPoints,
      totalCoins: newTotalCoins,
      level: Math.max(gameProgress.level, newLevel),
      badges: newBadges
    });

    // Notify User
    if (finalScore >= passingScore) {
      await notificationService.notify(
        userId,
        'Hoàn thành bài học',
        `Chúc mừng! Bạn đã hoàn thành bài học "${moduleItem.title}" với điểm số ${finalScore}% và nhận được ${points} điểm kinh nghiệm.`,
        'learning',
        moduleIdInt
      );
    }

    if (newLevel > gameProgress.level) {
      await notificationService.notify(
        userId,
        'Lên cấp mới!',
        `Chúc mừng! Bạn đã đạt Cấp ${newLevel}. Hãy tiếp tục hành trình khám phá di sản nhé!`,
        'system'
      );
    }

    // Badge notifications
    for (const badge of newBadges) {
      if (!gameProgress.badges?.includes(badge)) {
        await notificationService.notify(
          userId,
          'Nhận huy hiệu mới',
          `Bạn vừa nhận được huy hiệu "${badge === 'newbie' ? 'Người Mới Bắt Đầu' : 'Điểm Tuyệt Đối'}"!`,
          'quest'
        );
      }
    }

    return {
      success: true,
      message: 'Module completed',
      data: {
        moduleTitle: moduleItem.title,
        score: finalScore,
        pointsEarned: points,
        coinsEarned: coins,
        passed: finalScore >= passingScore,
        currentLevel: Math.max(gameProgress.level, newLevel),
        isLevelUp: newLevel > gameProgress.level,
        newLevel: newLevel
      }
    };
  }

  async getLearningPath(userId) {
    let gameProgress = await db.findOne('game_progress', { userId: userId });
    if (!gameProgress) {
      // Just return empty state if no progress yet
      gameProgress = { completedModules: [] };
    }

    const allModules = (await db.findAll('learning_modules'))
      .sort((a, b) => a.order - b.order);

    const allModuleIds = allModules.map(m => m.id);
    const rawCompletedIds = gameProgress?.completedModules?.map(m => m.moduleId) || [];
    // Filter existing modules and deduplicate to prevent > 100% progress
    const completedModuleIds = [...new Set(rawCompletedIds.filter(id => allModuleIds.includes(id)))];

    const path = allModules.map(module => {
      const allCompletedData = gameProgress?.completedModules?.filter(m => m.moduleId === module.id) || [];
      const completedData = allCompletedData.length > 0
        ? allCompletedData.reduce((prev, curr) => ((prev.score || 0) > (curr.score || 0) ? prev : curr))
        : undefined;

      return {
        id: module.id,
        pathId: module.pathId,
        title: module.title,
        description: module.description,
        difficulty: module.difficulty,
        estimatedDuration: module.estimatedDuration,
        contentType: module.contentType,
        contentUrl: module.contentUrl,
        thumbnail: module.thumbnail,
        isCompleted: completedModuleIds.includes(module.id),
        score: completedData?.score,
        passingScore: module.quiz?.passingScore || 70,
        rewardPoints: module.rewardPoints !== undefined ? module.rewardPoints : 50,
        rewardCoins: module.rewardCoins !== undefined ? module.rewardCoins : 0,
        reviewRewardPoints: module.reviewRewardPoints !== undefined ? module.reviewRewardPoints : 10,
        reviewRewardCoins: module.reviewRewardCoins !== undefined ? module.reviewRewardCoins : 0,
        completedAt: completedData?.completedDate
      };
    });

    const totalModules = allModules.length;
    const completedCount = completedModuleIds.length;
    const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    // Find first incomplete module for "Continue Learning"
    const nextModule = path.find(m => !m.isCompleted);

    return {
      success: true,
      data: path,
      progress: {
        completed: completedCount,
        total: totalModules,
        percentage: percentage,
        nextModuleId: nextModule?.id || null, // Renamed nextModuleId for clarity, check usage in FE
        totalTimeSpent: gameProgress?.totalLearningTime || 0
      }
    };
  }

  async getStats() {
    const allModules = await db.findAll('learning_modules');

    const stats = {
      total: allModules.length,
      byDifficulty: {
        easy: allModules.filter(m => m.difficulty === 'easy').length,
        medium: allModules.filter(m => m.difficulty === 'medium').length,
        hard: allModules.filter(m => m.difficulty === 'hard').length
      },
      byType: {
        video: allModules.filter(m => m.contentType === 'video').length,
        article: allModules.filter(m => m.contentType === 'article').length,
        quiz: allModules.filter(m => m.contentType === 'quiz' || (m.quiz && m.quiz.questions)).length
      },
      statusSummary: {
        draft: allModules.filter(m => m.status === 'draft' || !m.status).length,
        pending: allModules.filter(m => m.status === 'pending').length,
        published: allModules.filter(m => m.status === 'published').length
      }
    };

    return {
      success: true,
      data: stats
    };
  }
}

module.exports = new LearningService();
