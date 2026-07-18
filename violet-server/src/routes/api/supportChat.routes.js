const express = require("express");
const { deliveryAuthMiddleware } = require("../../middleware/deliveryAuthMiddleware");
const supportChatCourierController = require("../../controllers/supportChat/supportChatCourierController");
const supportChatAdminController = require("../../controllers/supportChat/supportChatAdminController");

const router = express.Router();

router.get(
  "/delivery/support-chat/messages",
  deliveryAuthMiddleware,
  supportChatCourierController.listMessages,
);
router.post(
  "/delivery/support-chat/messages",
  deliveryAuthMiddleware,
  supportChatCourierController.sendMessage,
);
router.post(
  "/delivery/support-chat/read",
  deliveryAuthMiddleware,
  supportChatCourierController.markRead,
);

router.get("/admin/support-chat/threads", supportChatAdminController.listThreads);
router.get(
  "/admin/support-chat/threads/:deliveryId/messages",
  supportChatAdminController.listMessages,
);
router.post(
  "/admin/support-chat/threads/:deliveryId/messages",
  supportChatAdminController.sendMessage,
);
router.post(
  "/admin/support-chat/threads/:deliveryId/read",
  supportChatAdminController.markRead,
);

module.exports = router;
