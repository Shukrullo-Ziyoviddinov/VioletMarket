const messageChatService = require("../../services/messageChat/messageChatService");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  emitMessageChatMessage,
  emitMessageChatThreadsUpdated,
  emitMessageChatRead,
  emitMessageChatMessageDeleted,
  emitMessageChatMessageUpdated,
  emitMessageChatThreadDeleted,
} = require("../../socket/messageChatSocketEmitter");
const {
  notifySellerChatMessageReceived,
} = require("../../services/sellerNotifications/sellerNotificationService");

const listUserThreads = asyncHandler(async (req, res) => {
  const data = await messageChatService.listUserThreads(req.userId);
  res.json({ ok: true, ...data });
});

const getUserThreadMessages = asyncHandler(async (req, res) => {
  const data = await messageChatService.getThreadMessagesForUser(
    req.userId,
    req.params.sellerId,
  );
  res.json({ ok: true, ...data });
});

const sendUserMessage = asyncHandler(async (req, res) => {
  const sellerId = String(req.params.sellerId || "").trim();
  const data = await messageChatService.sendUserMessage(
    req.userId,
    sellerId,
    req.body || {},
  );

  emitMessageChatMessage({
    userId: String(req.userId),
    sellerId,
    message: data.socketMessage,
  });
  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId,
  });

  await notifySellerChatMessageReceived({
    sellerId,
    userId: req.userId,
    messageType: data.message?.type || req.body?.type,
    content: data.message?.content ?? req.body?.content,
  }).catch(() => null);

  res.status(201).json({ ok: true, message: data.message });
});

const markUserThreadRead = asyncHandler(async (req, res) => {
  const data = await messageChatService.markThreadReadByUser(
    req.userId,
    req.params.sellerId,
  );

  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: req.params.sellerId,
  });

  emitMessageChatRead({
    userId: String(req.userId),
    sellerId: String(req.params.sellerId || "").trim(),
    readBy: "user",
  });

  res.json({ ok: true, ...data });
});

const deleteUserMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.deleteUserMessage(
    req.userId,
    req.params.sellerId,
    req.params.messageId,
  );

  emitMessageChatMessageDeleted({
    userId: String(req.userId),
    sellerId: String(req.params.sellerId || "").trim(),
    messageId: data.messageId,
  });
  emitMessageChatThreadDeleted({
    userId: String(req.userId),
    sellerId: data.sellerId,
  });
  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: data.sellerId,
  });

  res.json({ ok: true, ...data });
});

const editUserMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.editUserMessage(
    req.userId,
    req.params.sellerId,
    req.params.messageId,
    req.body?.content,
  );

  emitMessageChatMessageUpdated({
    userId: String(req.userId),
    sellerId: String(req.params.sellerId || "").trim(),
    message: data.socketMessage,
  });
  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: String(req.params.sellerId || "").trim(),
  });

  res.json({ ok: true, message: data.message });
});

const deleteUserThread = asyncHandler(async (req, res) => {
  const data = await messageChatService.deleteThreadForUser(
    req.userId,
    req.params.sellerId,
  );

  emitMessageChatThreadDeleted({
    userId: String(req.userId),
    sellerId: data.sellerId,
  });
  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: data.sellerId,
  });

  res.json({ ok: true, ...data });
});

const updateUserThreadPreferences = asyncHandler(async (req, res) => {
  const data = await messageChatService.updateUserThreadPreferences(
    req.userId,
    req.params.sellerId,
    req.body || {},
  );

  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: data.sellerId,
  });

  res.json({ ok: true, preferences: data });
});

module.exports = {
  listUserThreads,
  getUserThreadMessages,
  sendUserMessage,
  markUserThreadRead,
  deleteUserMessage,
  editUserMessage,
  deleteUserThread,
  updateUserThreadPreferences,
};
