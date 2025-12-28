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
// router.use('/heritage-sites', require('./heritage_site_cms.routes'));
// router.use('/artifacts', require('./artifact_cms.routes'));
// router.use('/categories', require('./category_cms.routes'));
// router.use('/users', require('./user_cms.routes'));
// router.use('/stats', require('./stats.routes'));

module.exports = router;