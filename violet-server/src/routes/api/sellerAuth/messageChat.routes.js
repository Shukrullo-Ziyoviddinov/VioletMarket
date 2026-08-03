const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerMessageChatController = require("../../../controllers/messageChat/sellerMessageChatController");

const router = express.Router();

router.get(
  "/seller-auth/message-chat/threads",
  sellerAuthMiddleware,
  sellerMessageChatController.listSellerThreads,
);
router.get(
  "/seller-auth/message-chat/threads/:userId/messages",
  sellerAuthMiddleware,
  sellerMessageChatController.getSellerThreadMessages,
);
router.post(
  "/seller-auth/message-chat/threads/:userId/messages",
  sellerAuthMiddleware,
  sellerMessageChatController.sendSellerMessage,
);
router.post(
  "/seller-auth/message-chat/threads/:userId/read",
  sellerAuthMiddleware,
  sellerMessageChatController.markSellerThreadRead,
);
router.patch(
  "/seller-auth/message-chat/threads/:userId/messages/:messageId",
  sellerAuthMiddleware,
  sellerMessageChatController.editSellerMessage,
);
router.delete(
  "/seller-auth/message-chat/threads/:userId",
  sellerAuthMiddleware,
  sellerMessageChatController.deleteSellerThread,
);
router.delete(
  "/seller-auth/message-chat/threads/:userId/messages/:messageId",
  sellerAuthMiddleware,
  sellerMessageChatController.deleteSellerMessage,
);

module.exports = router;
