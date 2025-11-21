const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const collectionController = require('../controllers/collection.controller');

router.get('/', protect, collectionController.getAll);
router.get('/:id', protect, collectionController.getById);

router.post('/', protect, collectionController.create);
router.put('/:id', protect, collectionController.update);
router.delete('/:id', protect, collectionController.delete);

router.post('/:id/artifacts/:artifactId', protect, collectionController.addArtifact);
router.delete('/:id/artifacts/:artifactId', protect, collectionController.removeArtifact);

module.exports = router;