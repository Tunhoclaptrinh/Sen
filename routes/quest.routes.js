const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const questController = require('../controllers/quest.controller');

router.get('/', questController.getAll);
router.get('/active', protect, questController.getActive);
router.get('/available', protect, questController.getActive); // Keep for compatibility
router.get('/leaderboard', questController.getLeaderboard);
router.get('/:id', questController.getById);

router.post('/', protect, questController.create);
router.post('/:id/start', protect, questController.start);
router.post('/:id/progress', protect, questController.updateProgress);
router.post('/:id/complete', protect, questController.complete);
router.post('/:id/claim', protect, questController.claimReward);
router.put('/:id', protect, questController.update);
router.delete('/:id', protect, questController.delete);

module.exports = router;
