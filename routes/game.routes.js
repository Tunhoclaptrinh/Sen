const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const gameController = require('../controllers/game.controller');

// All game routes require authentication
router.use(protect);

// Progress & Stats
router.get('/progress', gameController.getProgress);
router.get('/leaderboard', gameController.getLeaderboard);
router.get('/daily-reward', gameController.getDailyReward);

// Chapters (Sen Flowers)
router.get('/chapters', gameController.getChapters);
router.get('/chapters/:id', gameController.getChapterDetail);
router.post('/chapters/:id/unlock', gameController.unlockChapter);

// Levels (Màn chơi)
router.get('/levels/:chapterId', gameController.getLevels);
router.get('/levels/:id/detail', gameController.getLevelDetail);
router.post('/levels/:id/start', gameController.startLevel);
router.post('/levels/:id/collect-clue', gameController.collectClue);
router.post('/levels/:id/complete', gameController.completeLevel);

// Museum
router.get('/museum', gameController.getMuseum);
router.post('/museum/toggle', gameController.toggleMuseum);

// Badges & Achievements
router.get('/badges', gameController.getBadges);
router.get('/achievements', gameController.getAchievements);

// Scan to Play
router.post('/scan', gameController.scanObject);

// Shop & Inventory
router.post('/shop/purchase', gameController.purchaseItem);
router.get('/inventory', gameController.getInventory);
router.post('/inventory/use', gameController.useItem);

module.exports = router;