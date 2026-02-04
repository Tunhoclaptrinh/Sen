const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');

class BadgeService extends ReviewableService {
  constructor() {
    super('badges');
  }

  /**
   * Check and unlock badges for a user based on an action
   * @param {number} userId 
   * @param {string} type - 'level_reached', 'quests_completed', 'artifacts_scanned', 'days_logged'
   * @param {number} currentValue 
   */
  async checkAndUnlock(userId, type, currentValue) {
    // 1. Get all active badges of this type
    const possibleBadges = await db.findMany('badges', {
      isActive: true,
      conditionType: type
    });

    if (possibleBadges.length === 0) return [];

    // 2. Get user progress
    const progress = await db.findOne('game_progress', { userId: userId });
    if (!progress) return [];

    const unlockedBadges = [];
    const currentBadges = progress.badges || [];

    for (const badge of possibleBadges) {
      // Check if already owned
      if (currentBadges.some(b => b.id === badge.id)) continue;

      // Check condition
      if (currentValue >= badge.conditionValue) {
        // UNLOCK!
        const newBadgeEntry = {
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date().toISOString()
        };

        // Grant Rewards
        const rewards = {};
        if (badge.rewardCoins) {
          progress.coins = (progress.coins || 0) + badge.rewardCoins;
          rewards.coins = badge.rewardCoins;
        }
        if (badge.rewardPetals) {
          progress.totalSenPetals = (progress.totalSenPetals || 0) + badge.rewardPetals;
          rewards.petals = badge.rewardPetals;
        }

        // Update Progress
        progress.badges = [...(progress.badges || []), newBadgeEntry];

        unlockedBadges.push({
          badge,
          rewards
        });
      }
    }

    if (unlockedBadges.length > 0) {
      await db.update('game_progress', progress.id, progress);
    }

    return unlockedBadges;
  }

  async getStats() {
    const allBadges = await db.findAll('badges');
    const allProgress = await db.findAll('game_progress');

    let totalAwarded = 0;
    allProgress.forEach(p => {
      if (p.badges) totalAwarded += p.badges.length;
    });

    return {
      success: true,
      data: {
        total: allBadges.length,
        awarded: totalAwarded,
        active: allBadges.filter(b => b.isActive).length
      }
    };
  }
}

module.exports = new BadgeService();
