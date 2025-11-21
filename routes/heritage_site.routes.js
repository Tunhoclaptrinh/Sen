const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const heritageSiteController = require('../controllers/heritage_site.controller');

router.get('/', heritageSiteController.getAll);
router.get('/search', heritageSiteController.search);
router.get('/nearby', heritageSiteController.getNearby);
router.get('/:id', heritageSiteController.getById);
router.get('/:id/artifacts', heritageSiteController.getArtifacts);
router.get('/:id/timeline', heritageSiteController.getTimeline);

router.post('/', protect, heritageSiteController.create);
router.put('/:id', protect, heritageSiteController.update);
router.delete('/:id', protect, heritageSiteController.delete);

module.exports = router;