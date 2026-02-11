const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');

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

      moduleItem.quiz.questions.forEach(q => {
        const questionPoint = q.point || 10;
        totalPoints += questionPoint;

        // Check if answer is correct
        // Note: answers keys might be strings in JSON
        if (answers[q.id] !== undefined && parseInt(answers[q.id]) === q.correctAnswer) {
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

    // Points logic:
    // - 50 points for first time completion (if passed or no quiz)
    // - 0 points for re-completion (even if score improved, to prevent farming)
    let points = 0;
    if (!isAlreadyCompleted && finalScore >= passingScore) {
      points = 50;
    }

    // Level calculation: Every 200 points = 1 level
    const newTotalPoints = (gameProgress.totalPoints || 0) + points;
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

    // Update Progress
    await db.update('game_progress', gameProgress.id, {
      completedModules: [...(gameProgress.completedModules || []), completedModule],
      totalPoints: newTotalPoints,
      level: Math.max(gameProgress.level, newLevel),
      badges: newBadges
    });

    return {
      success: true,
      message: 'Module completed',
      data: {
        moduleTitle: moduleItem.title,
        score: finalScore,
        pointsEarned: points,
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
      const completedData = gameProgress?.completedModules?.find(m => m.moduleId === module.id);

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
}

module.exports = new LearningService();
