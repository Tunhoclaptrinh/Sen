const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const learningController = require('../controllers/learning.controller');

// Public routes protected to ensure user context is available for RBAC
router.get('/', optionalProtect, learningController.getAll);
router.get('/path', protect, learningController.getLearningPath);
router.get('/:id', protect, learningController.getById);

router.post('/', protect, checkPermission('learning_modules', 'create'), learningController.create);
router.post('/:id/complete', protect, learningController.complete);
router.put('/:id', protect, checkPermission('learning_modules', 'update'), learningController.update);
router.delete('/:id', protect, checkPermission('learning_modules', 'delete'), learningController.delete);

// Review Routes
router.patch('/:id/submit', protect, checkPermission('learning_modules', 'update'), learningController.submitReview);
router.patch('/:id/approve', protect, checkPermission('learning_modules', 'publish'), learningController.approveReview);
router.patch('/:id/reject', protect, checkPermission('learning_modules', 'publish'), learningController.rejectReview);

module.exports = router;