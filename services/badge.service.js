const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');

class BadgeService extends ReviewableService {
  constructor() {
    super('game_badges');
  }

  /**
   * Check and unlock badges for a user based on an action
   * @param {number} userId 
   * @param {string} type - 'level_reached', 'quests_completed', 'artifacts_scanned', 'days_logged'
   * @param {number} currentValue 
   */
  async checkAndUnlock(userId, type, currentValue) {
    // 1. Get all active badges of this type
    const possibleBadges = await db.findMany('game_badges', {
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
      if (currentBadges.some(b => {
        if (b && typeof b === 'object' && b.id) return b.id === badge.id;
        return false; // Ignore legacy strings for now as they don't match new numeric IDs
      })) continue;

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

          // Log transaction
          await db.create('transactions', {
            userId,
            type: 'earn',
            source: 'badge_reward',
            sourceId: badge.id,
            amount: badge.rewardCoins,
            currency: 'coins',
            description: `Thưởng huy hiệu: ${badge.name}`,
            createdAt: new Date().toISOString()
          });
        }
        if (badge.rewardPetals) {
          progress.totalSenPetals = (progress.totalSenPetals || 0) + badge.rewardPetals;
          rewards.petals = badge.rewardPetals;

          // Log transaction
          await db.create('transactions', {
            userId,
            type: 'earn',
            source: 'badge_reward',
            sourceId: badge.id,
            amount: badge.rewardPetals,
            currency: 'petals',
            description: `Thưởng huy hiệu: ${badge.name}`,
            createdAt: new Date().toISOString()
          });
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
      if (p.badges) {
        totalAwarded += p.badges.filter(b => b && typeof b === 'object' && b.id).length;
      }
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
