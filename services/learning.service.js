const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class LearningService extends BaseService {
  constructor() {
    super('learning_modules');
  }

  async completeModule(moduleId, userId, score, answers) {
    const moduleIdInt = parseInt(moduleId);
    let finalScore = parseInt(score);

    const module = await db.findById('learning_modules', moduleIdInt);
    if (!module) {
      return { success: false, message: 'Module not found', statusCode: 404 };
    }

    // Server-side score validation (Weighted Scoring)
    if (answers && module.quiz && module.quiz.questions) {
        let totalPoints = 0;
        let earnedPoints = 0;

        module.quiz.questions.forEach(q => {
            const questionPoint = q.point || 10;
            totalPoints += questionPoint;
            
            // Check if answer is correct
            // Note: answers keys might be strings in JSON
            if (answers[q.id] !== undefined && parseInt(answers[q.id]) === q.correct_answer) {
                earnedPoints += questionPoint;
            }
        });

        if (totalPoints > 0) {
            finalScore = Math.round((earnedPoints / totalPoints) * 100);
        }
    }

    // Use game_progress
    let gameProgress = await db.findOne('game_progress', { user_id: userId });

    if (!gameProgress) {
      const gameService = require('./game.service');
      gameProgress = await gameService.initializeProgress(userId);
    }

    // Check if module is already completed
    const existingCompletionIndex = (gameProgress.completed_modules || []).findIndex(m => parseInt(m.module_id) === moduleIdInt);
    const isAlreadyCompleted = existingCompletionIndex !== -1;

    const completedModule = {
      module_id: moduleIdInt,
      completed_date: new Date().toISOString(),
      score: finalScore,
      time_spent: 0
    };

    const passingScore = module.quiz?.passing_score || 70;

    // Points logic:
    // - 50 points for first time completion (if passed or no quiz)
    // - 0 points for re-completion (even if score improved, to prevent farming)
    let points = 0;
    if (!isAlreadyCompleted && finalScore >= passingScore) {
      points = 50;
    }

    // Level calculation: Every 200 points = 1 level
    const newTotalPoints = (gameProgress.total_points || 0) + points;
    const newLevel = Math.floor(newTotalPoints / 200) + 1;

    // Badge logic
    let newBadges = [...(gameProgress.badges || [])];
    const completedCount = (gameProgress.completed_modules || []).length + 1;

    if (completedCount === 1 && !newBadges.includes('newbie')) {
      newBadges.push('newbie'); // Badge: Người Mới Bắt Đầu
    }
    if (finalScore === 100 && !newBadges.includes('perfect_score')) {
      newBadges.push('perfect_score'); // Badge: Điểm Tuyệt Đối
    }
    if (newLevel > (gameProgress.level || 1)) {
      // Logic for level up badge could go here
    }

    const updated = await db.update('game_progress', gameProgress.id, {
      completed_modules: [...(gameProgress.completed_modules || []), completedModule],
      total_points: newTotalPoints,
      level: Math.max(gameProgress.level, newLevel),
      badges: newBadges
    });

    return {
      success: true,
      message: 'Module completed',
      data: {
        module_title: module.title,
        score: finalScore,
        points_earned: points,
        passed: finalScore >= passingScore,
        current_level: Math.max(gameProgress.level, newLevel),
        is_level_up: newLevel > gameProgress.level,
        new_level: newLevel
      }
    };
  }

  async getLearningPath(userId) {
    let gameProgress = await db.findOne('game_progress', { user_id: userId });
    if (!gameProgress) {
      // Just return empty state if no progress yet
      gameProgress = { completed_modules: [] };
    }

    const allModules = (await db.findAll('learning_modules'))
      .sort((a, b) => a.order - b.order);

    const allModuleIds = allModules.map(m => m.id);
    const rawCompletedIds = gameProgress?.completed_modules?.map(m => m.module_id) || [];
    // Filter existing modules and deduplicate to prevent > 100% progress
    const completedModuleIds = [...new Set(rawCompletedIds.filter(id => allModuleIds.includes(id)))];

    const path = allModules.map(module => {
      const completedData = gameProgress?.completed_modules?.find(m => m.module_id === module.id);

      return {
        id: module.id,
        title: module.title,
        description: module.description, // Added description for UI
        difficulty: module.difficulty,
        estimated_duration: module.estimated_duration,
        content_type: module.content_type, // Expose content_type
        thumbnail: module.thumbnail,
        is_completed: completedModuleIds.includes(module.id),
        score: completedData?.score,
        completed_at: completedData?.completed_date
      };
    });

    const totalModules = allModules.length;
    const completedCount = completedModuleIds.length;
    const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    // Find first incomplete module for "Continue Learning"
    const nextModule = path.find(m => !m.is_completed);

    return {
      success: true,
      data: path,
      progress: {
        completed: completedCount,
        total: totalModules,
        percentage: percentage,
        next_module_id: nextModule?.id || null,
        total_time_spent: gameProgress?.total_learning_time || 0
      }
    };
  }
}

module.exports = new LearningService();