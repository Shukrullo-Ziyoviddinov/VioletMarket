const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerNotificationController = require("../../../controllers/sellerNotificationController");

const router = express.Router();

router.get(
  "/seller-auth/notifications/unread-count",
  sellerAuthMiddleware,
  sellerNotificationController.getUnreadCount,
);
router.get(
  "/seller-auth/notifications",
  sellerAuthMiddleware,
  sellerNotificationController.listNotifications,
);
router.patch(
  "/seller-auth/notifications/:notificationId/read",
  sellerAuthMiddleware,
  sellerNotificationController.markNotificationRead,
);
router.post(
  "/seller-auth/notifications/read-all",
  sellerAuthMiddleware,
  sellerNotificationController.markAllNotificationsRead,
);

module.exports = router;
