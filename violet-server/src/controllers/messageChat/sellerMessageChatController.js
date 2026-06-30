const messageChatService = require("../../services/messageChat/messageChatService");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  emitMessageChatMessage,
  emitMessageChatThreadsUpdated,
  emitMessageChatRead,
  emitMessageChatMessageDeleted,
  emitMessageChatMessageUpdated,
} = require("../../socket/messageChatSocketEmitter");

const listSellerThreads = asyncHandler(async (req, res) => {
  const data = await messageChatService.listSellerThreads(req.sellerShopId);
  res.json({ ok: true, ...data });
});

const getSellerThreadMessages = asyncHandler(async (req, res) => {
  const data = await messageChatService.getThreadMessagesForSeller(
    req.sellerShopId,
    req.params.userId,
  );
  res.json({ ok: true, ...data });
});

const sendSellerMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.sendSellerMessage(
    req.sellerShopId,
    req.params.userId,
    req.body || {},
  );

  emitMessageChatMessage({
    userId: req.params.userId,
    sellerId: req.sellerShopId,
    message: data.socketMessage,
  });
  emitMessageChatThreadsUpdated({
    userId: req.params.userId,
    sellerId: req.sellerShopId,
  });

  res.status(201).json({ ok: true, message: data.message });
});

const markSellerThreadRead = asyncHandler(async (req, res) => {
  const data = await messageChatService.markThreadReadBySeller(
    req.sellerShopId,
    req.params.userId,
  );

  emitMessageChatThreadsUpdated({
    userId: req.params.userId,
    sellerId: req.sellerShopId,
  });

  emitMessageChatRead({
    userId: String(req.params.userId || "").trim(),
    sellerId: String(req.sellerShopId || "").trim(),
    readBy: "seller",
  });

  res.json({ ok: true, ...data });
});

const deleteSellerMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.deleteSellerMessage(
    req.sellerShopId,
    req.params.userId,
    req.params.messageId,
  );

  emitMessageChatMessageDeleted({
    userId: String(req.params.userId || "").trim(),
    sellerId: String(req.sellerShopId || "").trim(),
    messageId: data.messageId,
  });
  emitMessageChatThreadsUpdated({
    userId: req.params.userId,
    sellerId: req.sellerShopId,
  });

  res.json({ ok: true, ...data });
});

const editSellerMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.editSellerMessage(
    req.sellerShopId,
    req.params.userId,
    req.params.messageId,
    req.body?.content,
  );

  emitMessageChatMessageUpdated({
    userId: String(req.params.userId || "").trim(),
    sellerId: String(req.sellerShopId || "").trim(),
    message: data.socketMessage,
  });
  emitMessageChatThreadsUpdated({
    userId: req.params.userId,
    sellerId: req.sellerShopId,
  });

  res.json({ ok: true, message: data.message });
});

const deleteSellerThread = asyncHandler(async (req, res) => {
  const data = await messageChatService.deleteThreadForSeller(
    req.sellerShopId,
    req.params.userId,
  );

  emitMessageChatThreadsUpdated({
    userId: data.userId,
    sellerId: req.sellerShopId,
  });

  res.json({ ok: true, ...data });
});

module.exports = {
  listSellerThreads,
  getSellerThreadMessages,
  sendSellerMessage,
  markSellerThreadRead,
  deleteSellerMessage,
  editSellerMessage,
  deleteSellerThread,
};
