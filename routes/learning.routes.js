const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const learningController = require('../controllers/learning.controller');

router.get('/', learningController.getAll);
router.get('/path', protect, learningController.getLearningPath);
router.get('/:id', learningController.getById);

router.post('/', protect, checkPermission('learning_modules', 'create'), learningController.create);
router.post('/:id/complete', protect, learningController.complete);
router.put('/:id', protect, checkPermission('learning_modules', 'update'), learningController.update);
router.delete('/:id', protect, checkPermission('learning_modules', 'delete'), learningController.delete);

module.exports = router;