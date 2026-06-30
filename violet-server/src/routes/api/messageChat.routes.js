const express = require("express");
const messageChatController = require("../../controllers/messageChat/messageChatController");
const { authMiddleware } = require("../../middleware/authMiddleware");
const {
  uploadSingleImageMiddleware,
  uploadImage,
} = require("../../controllers/adminUploadController");
const { asyncHandler } = require("../../utils/asyncHandler");

const router = express.Router();

function imageUploadGuard(req, res, next) {
  uploadSingleImageMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || "Rasm yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

router.get("/message-chat/threads", authMiddleware, messageChatController.listUserThreads);
router.get(
  "/message-chat/threads/:sellerId/messages",
  authMiddleware,
  messageChatController.getUserThreadMessages,
);
router.post(
  "/message-chat/threads/:sellerId/messages",
  authMiddleware,
  messageChatController.sendUserMessage,
);
router.post(
  "/message-chat/threads/:sellerId/read",
  authMiddleware,
  messageChatController.markUserThreadRead,
);
router.patch(
  "/message-chat/threads/:sellerId/messages/:messageId",
  authMiddleware,
  messageChatController.editUserMessage,
);
router.delete(
  "/message-chat/threads/:sellerId",
  authMiddleware,
  messageChatController.deleteUserThread,
);
router.patch(
  "/message-chat/threads/:sellerId/preferences",
  authMiddleware,
  messageChatController.updateUserThreadPreferences,
);
router.delete(
  "/message-chat/threads/:sellerId/messages/:messageId",
  authMiddleware,
  messageChatController.deleteUserMessage,
);
router.post(
  "/message-chat/uploads/image",
  authMiddleware,
  imageUploadGuard,
  asyncHandler((req, res) => uploadImage(req, res)),
);

module.exports = router;
