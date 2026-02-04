const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const badgeController = require('../controllers/badge.controller');

// Public read (or authenticated user read)
router.get('/', badgeController.getAll);
router.get('/:id', badgeController.getById);

// Admin only write
router.post('/',
  protect,
  checkPermission('system', 'manage'), // Assuming system manage or game manage permission
  badgeController.create
);

router.put('/:id',
  protect,
  checkPermission('system', 'manage'),
  badgeController.update
);

router.delete('/:id',
  protect,
  checkPermission('system', 'manage'),
  badgeController.delete
);

module.exports = router;
