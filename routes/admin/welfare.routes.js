const express = require('express');
const router = express.Router();
const welfareAdminController = require('../../controllers/welfare_admin.controller');

router.get('/stats', welfareAdminController.getStats);
router.get('/', welfareAdminController.getAll);
router.post('/', welfareAdminController.create);
router.put('/:id', welfareAdminController.update);
router.delete('/:id', welfareAdminController.delete);

module.exports = router;
