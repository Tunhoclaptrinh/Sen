const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const exhibitionController = require('../controllers/exhibition.controller');

// Public (protected for RBAC filtering)
router.get('/', optionalProtect, exhibitionController.getAll);
router.get('/active', optionalProtect, exhibitionController.getActive);
router.get('/stats/summary', exhibitionController.getStats);
router.get('/:id', optionalProtect, exhibitionController.getById);

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

// Review routes
router.patch('/:id/submit',
  protect,
  checkPermission('exhibitions', 'update'),
  exhibitionController.submitReview
);

router.patch('/:id/approve',
  protect,
  checkPermission('exhibitions', 'publish'),
  exhibitionController.approveReview
);

router.patch('/:id/reject',
  protect,
  checkPermission('exhibitions', 'publish'),
  exhibitionController.rejectReview
);

module.exports = router;