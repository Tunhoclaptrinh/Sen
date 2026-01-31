const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const exhibitionController = require('../controllers/exhibition.controller');

// Public (protected for RBAC filtering)
router.get('/', protect, exhibitionController.getAll);
router.get('/active', protect, exhibitionController.getActive);
router.get('/:id', protect, exhibitionController.getById);

// Protected
router.post('/',
  protect,
  checkPermission('exhibitions', 'create'),
  exhibitionController.create
);

router.put('/:id',
  protect,
  checkPermission('exhibitions', 'update'),
  exhibitionController.update
);

router.delete('/:id',
  protect,
  checkPermission('exhibitions', 'delete'),
  exhibitionController.delete
);

module.exports = router;