const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class QuestService extends BaseService {
  constructor() {
    super('game_quests');
  }

  async getActiveQuests(userId) {
    const allQuests = await db.findAll('game_quests');
    const activeQuests = allQuests.filter(q => q.is_active);
    const userQuests = await db.findMany('user_quests', { user_id: userId });

    const data = activeQuests.map(quest => {
      const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
      return {
        ...quest,
        progress: userQuest ? {
          current_value: userQuest.current_value,
          is_completed: userQuest.status === 'completed' || userQuest.status === 'claimed',
          is_claimed: userQuest.status === 'claimed',
          status: userQuest.status,
          started_at: userQuest.started_at,
          completed_at: userQuest.completed_at
        } : null
      };
    });

    return {
      success: true,
      data
    };
  }

  async startQuest(questId, userId) {
    const quest = await db.findById('game_quests', questId);
    if (!quest) {
      return { success: false, message: 'Quest not found', statusCode: 404 };
    }

    const existing = await db.findOne('user_quests', { quest_id: questId, user_id: userId });
    if (existing) {
      return { success: false, message: 'Quest already started', statusCode: 400 };
    }

    const userQuest = await db.create('user_quests', {
      user_id: userId,
      quest_id: questId,
      status: 'in_progress',
      current_value: 0,
      started_at: new Date().toISOString()
    });

    return {
      success: true,
      data: userQuest
    };
  }

  async updateQuestProgress(questId, userId, currentValue) {
    const userQuest = await db.findOne('user_quests', { quest_id: questId, user_id: userId });
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
      current_value: currentValue,
      status: isCompleted ? 'completed' : 'in_progress',
      completed_at: isCompleted ? new Date().toISOString() : null
    });

    return {
      success: true,
      data: updated
    };
  }

  async completeQuest(questId, userId) {
    const userQuest = await db.findOne('user_quests', { quest_id: questId, user_id: userId });
    if (!userQuest) {
      return { success: false, message: 'Quest not started', statusCode: 404 };
    }

    if (userQuest.status === 'claimed') {
      return { success: false, message: 'Quest reward already claimed', statusCode: 400 };
    }

    const updated = await db.update('user_quests', userQuest.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    return {
      success: true,
      data: updated
    };
  }

  async claimReward(questId, userId) {
    const userQuest = await db.findOne('user_quests', { quest_id: questId, user_id: userId });
    if (!userQuest || userQuest.status !== 'completed') {
      return { success: false, message: 'Quest not completed or not found', statusCode: 400 };
    }

    const quest = await db.findById('game_quests', questId);
    if (!quest) return { success: false, message: 'Quest definition not found', statusCode: 404 };

    // Update user_quests status
    await db.update('user_quests', userQuest.id, {
      status: 'claimed',
      claimed_at: new Date().toISOString()
    });

    // Award rewards in user_progress
    let userProgress = await db.findOne('user_progress', { user_id: userId });
    if (!userProgress) {
      userProgress = await db.create('user_progress', {
        user_id: userId,
        total_points: 0,
        level: 1,
        badges: [],
        petals: 0,
        completed_quests_count: 0
      });
    }

    const newPoints = (userProgress.total_points || 0) + (quest.rewards.experience || 0);
    const newLevel = Math.floor(newPoints / 1000) + 1;
    const newPetals = (userProgress.petals || 0) + (quest.rewards.petals || 0);
    const newBadges = [...new Set([...(userProgress.badges || []), ...(quest.rewards.badge ? [quest.rewards.badge] : [])])];

    const updatedProgress = await db.update('user_progress', userProgress.id, {
      total_points: newPoints,
      level: newLevel,
      petals: newPetals,
      badges: newBadges,
      completed_quests_count: (userProgress.completed_quests_count || 0) + 1
    });

    return {
      success: true,
      message: 'Reward claimed successfully',
      data: {
        rewards: quest.rewards,
        new_progress: updatedProgress
      }
    };
  }

  async getLeaderboard(limit = 10) {
    const allProgress = (await db.findAll('user_progress'))
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .slice(0, limit);

    const leaderboard = await Promise.all(allProgress.map(async (progress, index) => {
      const user = await db.findById('users', progress.user_id);
      return {
        rank: index + 1,
        user_name: user?.fullName || user?.name || 'Vô danh',
        user_avatar: user?.avatar,
        total_points: progress.total_points || 0,
        level: progress.level || 1,
        badges_count: progress.badges?.length || 0,
        completed_quests: progress.completed_quests_count || 0
      };
    }));

    return {
      success: true,
      data: leaderboard
    };
  }
}

module.exports = new QuestService();
