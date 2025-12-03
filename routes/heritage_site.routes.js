const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware'); // Import RBAC mới
const heritageSiteController = require('../controllers/heritage_site.controller');

// Public routes (Ai cũng xem được)
router.get('/', heritageSiteController.getAll);
router.get('/search', heritageSiteController.search);
router.get('/nearby', heritageSiteController.getNearby);
router.get('/:id', heritageSiteController.getById);
router.get('/:id/artifacts', heritageSiteController.getArtifacts);
router.get('/:id/timeline', heritageSiteController.getTimeline);

// Chỉ Admin hoặc Researcher mới được tạo/sửa
router.post('/',
  protect,
  checkPermission('heritage_sites', 'create'),
  heritageSiteController.create
);

router.put('/:id',
  protect,
  checkPermission('heritage_sites', 'update'),
  heritageSiteController.update
);

// Chỉ Admin mới được xóa
router.delete('/:id',
  protect,
  checkPermission('heritage_sites', 'delete'),
  heritageSiteController.delete
);

module.exports = router;