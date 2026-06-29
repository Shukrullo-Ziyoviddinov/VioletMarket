const messageChatService = require("../../services/messageChat/messageChatService");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  emitMessageChatMessage,
  emitMessageChatThreadsUpdated,
} = require("../../socket/messageChatSocketEmitter");

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
  const data = await messageChatService.sendUserMessage(
    req.userId,
    req.params.sellerId,
    req.body || {},
  );

  emitMessageChatMessage({
    userId: String(req.userId),
    sellerId: req.params.sellerId,
    message: data.socketMessage,
  });
  emitMessageChatThreadsUpdated({
    userId: String(req.userId),
    sellerId: req.params.sellerId,
  });

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

  res.json({ ok: true, ...data });
});

module.exports = {
  listUserThreads,
  getUserThreadMessages,
  sendUserMessage,
  markUserThreadRead,
};
