const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');
const collectionController = require('../controllers/collection.controller');

router.use(protect);

// Check quyền 'user_data' (read_own, update_own...)
router.get('/', checkPermission('user_data', 'read_own'), collectionController.getAll);
router.post('/', checkPermission('user_data', 'update_own'), collectionController.create);

// Các route có ID cần Controller kiểm tra ownership hoặc middleware checkOwnership
router.get('/:id', checkPermission('user_data', 'read_own'), collectionController.getById);
router.put('/:id', checkPermission('user_data', 'update_own'), collectionController.update);
router.delete('/:id', checkPermission('user_data', 'delete_own'), collectionController.delete);

// Thêm/Xóa Artifact vào Collection
router.post('/:id/items', checkPermission('user_data', 'update_own'), collectionController.addItem);
router.delete('/:id/items/:itemId', checkPermission('user_data', 'update_own'), collectionController.removeItem);

module.exports = router;