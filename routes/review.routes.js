const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const reviewController = require('../controllers/review.controller');

router.get('/', reviewController.getAll);
router.get('/search', reviewController.search);
router.get('/type/:type', reviewController.getByType);
router.get('/:id', reviewController.getById);

router.post('/', protect, reviewController.create);
router.put('/:id', protect, reviewController.update);
router.delete('/:id', protect, reviewController.delete);

module.exports = router;