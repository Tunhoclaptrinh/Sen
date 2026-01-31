const express = require('express');
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { checkPermission } = require("../../middleware/rbac.middleware");
const characterCMSController = require("../../controllers/character_cms.controller");

// Bảo vệ route, yêu cầu quyền quản lý nội dung game
router.use(protect, checkPermission('game_content', 'read'));

router.get("/", characterCMSController.getAll);
router.get("/:id", characterCMSController.getById);
router.post("/", checkPermission('game_content', 'create'), characterCMSController.create);
router.put("/:id", checkPermission('game_content', 'update'), characterCMSController.update);
router.delete("/:id", checkPermission('game_content', 'delete'), characterCMSController.delete);

module.exports = router;
