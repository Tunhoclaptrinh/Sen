const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const gameController = require('../controllers/game.controller');

// All game routes require authentication
router.use(protect);

// ==================== PROGRESS & STATS ====================
router.get('/progress', gameController.getProgress);
router.get('/leaderboard', gameController.getLeaderboard);
router.get('/daily-reward', gameController.getDailyReward);

// ==================== CHAPTERS (SEN FLOWERS) ====================
router.get('/chapters', gameController.getChapters);
router.get('/chapters/:id', gameController.getChapterDetail);
router.post('/chapters/:id/unlock', gameController.unlockChapter);

// ==================== LEVELS (MÀN CHƠI) ====================
router.get('/levels/:chapterId', gameController.getLevels);
router.get('/levels/:id/detail', gameController.getLevelDetail);

// Level Session Management
router.post('/levels/:id/start', gameController.startLevel);
router.post('/levels/:id/collect-clue', gameController.collectClue);
router.post('/levels/:id/complete', gameController.completeLevel);

// ==================== SCREEN NAVIGATION (NEW) ====================
router.post('/sessions/:id/next-screen', gameController.navigateToNextScreen);
router.post('/sessions/:id/submit-answer', gameController.submitAnswer);

// ==================== MUSEUM ====================
router.get('/museum', gameController.getMuseum);
router.post('/museum/toggle', gameController.toggleMuseum);

// ==================== BADGES & ACHIEVEMENTS ====================
router.get('/badges', gameController.getBadges);
router.get('/achievements', gameController.getAchievements);

// ==================== SCAN TO PLAY ====================
router.post('/scan', gameController.scanObject);

// ==================== SHOP & INVENTORY ====================
router.post('/shop/purchase', gameController.purchaseItem);
router.get('/inventory', gameController.getInventory);
router.post('/inventory/use', gameController.useItem);

module.exports = router;