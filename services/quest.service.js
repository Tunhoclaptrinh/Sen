const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class QuestService extends BaseService {
  constructor() {
    super('game_quests');
  }

  async getActiveQuests(userId) {
    const allQuests = await db.findAll('game_quests');
    const activeQuests = allQuests.filter(q => q.isActive);
    const userQuests = await db.findMany('user_quests', { userId: userId });

    const data = activeQuests.map(quest => {
      const userQuest = userQuests.find(uq => uq.questId == quest.id);
      return {
        ...quest,
        progress: userQuest ? {
          currentValue: userQuest.currentValue,
          isCompleted: userQuest.status === 'completed' || userQuest.status === 'claimed',
          isClaimed: userQuest.status === 'claimed',
          status: userQuest.status,
          startedAt: userQuest.startedAt,
          completedAt: userQuest.completedAt
        } : null
      };
    });

    return {
      success: true,
      data
    };
  }

  async startQuest(questId, userId) {
    questId = parseInt(questId);
    const quest = await db.findById('game_quests', questId);
    if (!quest) {
      return { success: false, message: 'Quest not found', statusCode: 404 };
    }

    const existing = await db.findOne('user_quests', { questId: questId, userId: userId });
    if (existing) {
      return { success: false, message: 'Quest already started', statusCode: 400 };
    }

    const userQuest = await db.create('user_quests', {
      userId: userId,
      questId: questId,
      status: 'in_progress',
      currentValue: 0,
      startedAt: new Date().toISOString()
    });

    return {
      success: true,
      data: userQuest
    };
  }

  async updateQuestProgress(questId, userId, currentValue) {
    questId = parseInt(questId);
    const userQuest = await db.findOne('user_quests', { questId: questId, userId: userId });
    if (!userQuest) {
      return { success: false, message: 'Quest not started', statusCode: 404 };
    }

    if (userQuest.status !== 'in_progress') {
      return { success: false, message: 'Quest already completed/claimed', statusCode: 400 };
    }

    const quest = await db.findById('game_quests', questId);
    if (!quest) return { success: false, message: 'Quest not found', statusCode: 404 };

    const targetValue = quest.requirements[0]?.target || 1;
    const isCompleted = currentValue >= targetValue;

    const updated = await db.update('user_quests', userQuest.id, {
      currentValue: currentValue,
      status: isCompleted ? 'completed' : 'in_progress',
      completedAt: isCompleted ? new Date().toISOString() : null
    });

    return {
      success: true,
      data: updated
    };
  }

  /**
   * Helper to automatically check and advance quests based on user actions
   * @param {number} userId 
   * @param {string} type - 'complete_chapter', 'collect_artifact', etc.
   * @param {number} incrementValue - Usually 1
   */
  async checkAndAdvance(userId, type, incrementValue = 1) {
    try {
      // Find all active quests for this user
      const allQuests = await db.findAll('game_quests');
      const activeQuests = allQuests.filter(q => q.isActive && q.requirements && q.requirements[0]?.type === type);

      const userQuests = await db.findMany('user_quests', { userId: userId, status: 'in_progress' });

      for (const quest of activeQuests) {
        // Check if user has started this quest
        let userQuest = userQuests.find(uq => (uq.questId || uq.quest_id) == quest.id);

        // If not started, auto-start it (Passive Quest Logic)
        if (!userQuest) {
          const startResult = await this.startQuest(quest.id, userId);
          if (startResult.success) {
            userQuest = startResult.data;
            console.log(`[Quest] Auto-started passive quest ${quest.id} for user ${userId}`);
          }
        }

        if (userQuest) {
          const newValue = (userQuest.currentValue || 0) + incrementValue;
          await this.updateQuestProgress(quest.id, userId, newValue);
          console.log(`[Quest] Auto-advanced quest ${quest.id} for user ${userId} to ${newValue}`);
        }
      }
    } catch (error) {
      console.error('[Quest] Auto-advance error:', error);
    }
  }

  async completeQuest(questId, userId) {
    questId = parseInt(questId);
    const userQuest = await db.findOne('user_quests', { questId: questId, userId: userId });
    if (!userQuest) {
      return { success: false, message: 'Quest not started', statusCode: 404 };
    }

    if (userQuest.status === 'claimed') {
      return { success: false, message: 'Quest reward already claimed', statusCode: 400 };
    }

    const updated = await db.update('user_quests', userQuest.id, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    return {
      success: true,
      data: updated
    };
  }

  async claimReward(questId, userId) {
    questId = parseInt(questId);
    const userQuest = await db.findOne('user_quests', { questId: questId, userId: userId });
    if (!userQuest || userQuest.status !== 'completed') {
      return { success: false, message: 'Quest not completed or not found', statusCode: 400 };
    }

    const quest = await db.findById('game_quests', questId);
    if (!quest) return { success: false, message: 'Quest definition not found', statusCode: 404 };

    // Update user_quests status
    await db.update('user_quests', userQuest.id, {
      status: 'claimed',
      claimedAt: new Date().toISOString()
    });

    // Award rewards in game_progress
    let gameProgress = await db.findOne('game_progress', { userId: userId });
    // Auto-init if missing (should not happen for active players but safe to have)
    if (!gameProgress) {
      const gameService = require('./game.service');
      gameProgress = await gameService.initializeProgress(userId);
    }

    const newPoints = (gameProgress.totalPoints || 0) + (quest.rewards.experience || 0);
    const newLevel = Math.floor(newPoints / 1000) + 1;
    const newPetals = (gameProgress.totalSenPetals || 0) + (quest.rewards.petals || 0);
    const newCoins = (gameProgress.coins || 0) + (quest.rewards.coins || 0);
    const newBadges = [...new Set([...(gameProgress.badges || []), ...(quest.rewards.badge ? [quest.rewards.badge] : [])])];


    const updatedProgress = await db.update('game_progress', gameProgress.id, {
      totalPoints: newPoints,
      level: Math.max(gameProgress.level, newLevel), // Keep max to avoid downgrade
      totalSenPetals: newPetals,
      coins: newCoins,
      badges: newBadges,
      completedQuestsCount: (gameProgress.completedQuestsCount || 0) + 1
    });

    return {
      success: true,
      message: 'Reward claimed successfully',
      data: {
        rewards: quest.rewards,
        newProgress: updatedProgress
      }
    };
  }

  async getLeaderboard(limit = 10) {
    // Read from game_progress
    const allProgress = (await db.findAll('game_progress'))
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, limit);

    const leaderboard = await Promise.all(allProgress.map(async (progress, index) => {
      const user = await db.findById('users', progress.userId);
      return {
        rank: index + 1,
        userName: user?.fullName || user?.name || 'Vô danh',
        userAvatar: user?.avatar,
        totalPoints: progress.totalPoints || 0,
        level: progress.level || 1,
        badgesCount: progress.badges?.length || 0,
        completedQuests: progress.completedQuestsCount || 0
      };
    }));

    return {
      success: true,
      data: leaderboard
    };
  }
}

module.exports = new QuestService();
