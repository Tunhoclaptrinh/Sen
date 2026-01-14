const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const historyController = require('../controllers/history.controller');

// Public Routes
router.get('/', historyController.getAll);
router.get('/stats/summary', historyController.getStats);
router.get('/:id', historyController.getById);
router.get('/:id/related', historyController.getRelated);

// Protected Routes (Researcher/Admin)
router.post('/',
  protect,
  checkPermission('history_articles', 'create'), // Ensure this permission exists or use a generic one like 'articles'
  historyController.create
);

router.put('/:id',
  protect,
  checkPermission('history_articles', 'update'),
  historyController.update
);

router.delete('/:id',
  protect,
  checkPermission('history_articles', 'delete'),
  historyController.delete
);

module.exports = router;

// Trigger restart for data reload
