const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { checkPermission } = require("../../middleware/rbac.middleware");
const chapterCMSController = require("../../controllers/chapter_cms.controller");
const levelCMSController = require("../../controllers/level_cms.controller"); // Assuming this controller exists and is needed

// Bảo vệ tất cả routes, chỉ Admin hoặc Researcher có quyền mới được truy cập
router.use(protect, checkPermission('game_content', 'read'));

// Chapter routes
router.get("/", chapterCMSController.getAll);
router.get("/:id", chapterCMSController.getById);
router.post("/", checkPermission('game_content', 'create'), chapterCMSController.create);
router.put("/:id", checkPermission('game_content', 'update'), chapterCMSController.update);
router.delete("/:id", checkPermission('game_content', 'delete'), chapterCMSController.delete);

// Chapter Review workflow
router.patch("/:id/submit", checkPermission('game_content', 'update'), chapterCMSController.submitReview);
router.patch("/:id/approve", checkPermission('game_content', 'approve'), chapterCMSController.approveReview);
router.patch("/:id/reject", checkPermission('game_content', 'approve'), chapterCMSController.rejectReview);
router.patch("/:id/revert", checkPermission('game_content', 'update'), chapterCMSController.revertToDraft);

module.exports = router;
