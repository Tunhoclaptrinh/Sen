const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { checkPermission } = require("../../middleware/rbac.middleware");
const chapterCMSController = require("../../controllers/chapter_cms.controller");

// Bảo vệ tất cả routes, chỉ Admin hoặc Researcher có quyền mới được truy cập
router.use(protect, checkPermission('game_content', 'read'));

router.get("/", chapterCMSController.getAll);
router.get("/:id", chapterCMSController.getById);
router.post("/", checkPermission('game_content', 'create'), chapterCMSController.create);
router.put("/:id", checkPermission('game_content', 'update'), chapterCMSController.update);
router.delete("/:id", checkPermission('game_content', 'delete'), chapterCMSController.delete);

module.exports = router;
