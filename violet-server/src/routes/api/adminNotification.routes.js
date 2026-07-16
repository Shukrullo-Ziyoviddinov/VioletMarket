const express = require("express");
const controller = require("../../controllers/adminNotificationController");

const router = express.Router();

router.get("/admin/notifications/unread-count", controller.getUnreadCount);
router.get("/admin/notifications", controller.listNotifications);
router.patch("/admin/notifications/:notificationId/read", controller.markNotificationRead);
router.post("/admin/notifications/read-all", controller.markAllNotificationsRead);

module.exports = router;
