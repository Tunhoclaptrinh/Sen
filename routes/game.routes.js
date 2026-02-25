const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const gameController = require('../controllers/game.controller');

// ==================== PUBLIC ENDPOINTS (NO AUTH) ====================
// Leaderboard - Public for Landing Page (Top 5)
router.get('/leaderboard', gameController.getLeaderboard);

// List/Filter levels
router.get('/', gameController.getAll);

// ==================== OPTIONAL AUTH - Allow guests but also support authenticated users ====================
router.use(optionalProtect);

// Badges - For authenticated user
router.get('/badges', gameController.getBadges);

// ==================== MIDDLEWARE for Game Play ====================
// Allow guest play: For guests, just continue; for authenticated users, check permission
const allowGamePlay = (req, res, next) => {
  if (req.user) {
    // User is authenticated, check permission
    return checkPermission('game_play', 'play')(req, res, next);
  }
  // No user = guest, allow to play
  next();
};

// Require authenticated user and permission
const requireGamePlay = checkPermission('game_play', 'play');

// Require authenticated user only
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

router.get('/progress', requireAuth, gameController.getProgress);
router.post('/leaderboard/reset', requireAuth, checkPermission('game_content', 'update'), gameController.resetUserScore);
router.get('/daily-reward', requireAuth, checkPermission('game_play', 'earn_rewards'), gameController.getDailyReward);

// ==================== CHAPTERS (SEN FLOWERS) ====================
router.get('/chapters', gameController.getChapters);
router.get('/chapters/:id', gameController.getChapterDetail);
router.post('/chapters/:id/unlock', gameController.unlockChapter);

// ==================== LEVELS (MÀN CHƠI) ====================
router.get('/levels/:chapterId', gameController.getLevels);
router.get('/levels/:id/detail', gameController.getLevelDetail);

// Level Session Management
router.post('/levels/:id/start', allowGamePlay, gameController.startLevel);
router.post('/levels/:id/collect-clue', allowGamePlay, gameController.collectClue);
router.post('/levels/:id/complete', allowGamePlay, gameController.completeLevel);

// ==================== SCREEN NAVIGATION (NEW) ====================
router.post('/sessions/:id/next-screen', allowGamePlay, gameController.navigateToNextScreen);
router.post('/sessions/:id/submit-answer', allowGamePlay, gameController.submitAnswer);
router.post('/sessions/:sessionId/submit-timeline',
  allowGamePlay,
  gameController.submitTimelineOrder
);

// ==================== MUSEUM ====================
router.get('/museum', requireAuth, gameController.getMuseum);
router.post('/museum/toggle', requireAuth, gameController.toggleMuseum);
router.post('/museum/collect', requireAuth, checkPermission('game_play', 'earn_rewards'), gameController.collectMuseumIncome);

// ==================== BADGES & ACHIEVEMENTS ====================
router.get('/achievements', gameController.getAchievements);

// ==================== SCAN TO PLAY ====================
router.post('/scan', requireAuth, checkPermission('game_play', 'scan_qr'), gameController.scanObject);
router.post('/checkin', requireAuth, checkPermission('game_play', 'scan_qr'), gameController.checkIn);

// ==================== SHOP & INVENTORY ====================
router.post('/shop/purchase', requireAuth, checkPermission('shop', 'purchase'), gameController.purchaseItem);
router.get('/inventory', requireAuth, gameController.getInventory);
router.post('/inventory/use', requireAuth, checkPermission('shop', 'use_item'), gameController.useItem);

module.exports = router;