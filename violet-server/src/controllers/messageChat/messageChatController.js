const messageChatService = require("../../services/messageChat/messageChatService");
const { asyncHandler } = require("../../utils/asyncHandler");

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
  res.status(201).json({ ok: true, ...data });
});

const markUserThreadRead = asyncHandler(async (req, res) => {
  const data = await messageChatService.markThreadReadByUser(
    req.userId,
    req.params.sellerId,
  );
  res.json({ ok: true, ...data });
});

module.exports = {
  listUserThreads,
  getUserThreadMessages,
  sendUserMessage,
  markUserThreadRead,
};
