const express = require("express");
const { sellerAuthMiddleware } = require("../../middleware/sellerAuthMiddleware");
const sellerSupportChatSellerController = require("../../controllers/sellerSupportChat/sellerSupportChatSellerController");
const sellerSupportChatAdminController = require("../../controllers/sellerSupportChat/sellerSupportChatAdminController");

const router = express.Router();

router.get(
  "/seller-auth/support-chat/messages",
  sellerAuthMiddleware,
  sellerSupportChatSellerController.listMessages,
);
router.get(
  "/seller-auth/support-chat/unread",
  sellerAuthMiddleware,
  sellerSupportChatSellerController.getUnreadCount,
);
router.post(
  "/seller-auth/support-chat/messages",
  sellerAuthMiddleware,
  sellerSupportChatSellerController.sendMessage,
);
router.post(
  "/seller-auth/support-chat/read",
  sellerAuthMiddleware,
  sellerSupportChatSellerController.markRead,
);

router.get(
  "/admin/seller-support-chat/threads",
  sellerSupportChatAdminController.listThreads,
);
router.get(
  "/admin/seller-support-chat/unread",
  sellerSupportChatAdminController.getUnreadCount,
);
router.get(
  "/admin/seller-support-chat/threads/:sellerId/messages",
  sellerSupportChatAdminController.listMessages,
);
router.post(
  "/admin/seller-support-chat/threads/:sellerId/messages",
  sellerSupportChatAdminController.sendMessage,
);
router.post(
  "/admin/seller-support-chat/threads/:sellerId/read",
  sellerSupportChatAdminController.markRead,
);

module.exports = router;
