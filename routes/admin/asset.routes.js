const express = require('express');
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { checkPermission } = require("../../middleware/rbac.middleware");
const assetCMSController = require("../../controllers/asset_cms.controller");

router.use(protect, checkPermission('game_content', 'read'));

router.get("/", assetCMSController.getAll);
router.get("/:id", assetCMSController.getById);
router.post("/", checkPermission('game_content', 'create'), assetCMSController.create);
router.put("/:id", checkPermission('game_content', 'update'), assetCMSController.update);
router.delete("/:id", checkPermission('game_content', 'delete'), assetCMSController.delete);

module.exports = router;