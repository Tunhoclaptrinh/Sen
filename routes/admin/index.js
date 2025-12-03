/**
 * routes/admin/index.js
 * Mount all admin routes
 */

const express = require('express');
const router = express.Router();

router.use('/levels', require('./level.routes'));
router.use('/chapters', require('./chapter.routes'));
router.use('/characters', require('./character.routes'));
router.use('/assets', require('./asset.routes'));

module.exports = router;