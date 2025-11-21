const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const exhibitionController = require('../controllers/exhibition.controller');

router.get('/', exhibitionController.getAll);
router.get('/active', exhibitionController.getActive);
router.get('/:id', exhibitionController.getById);

router.post('/', protect, authorize('admin'), exhibitionController.create);
router.put('/:id', protect, authorize('admin'), exhibitionController.update);
router.delete('/:id', protect, authorize('admin'), exhibitionController.delete);

module.exports = router;
