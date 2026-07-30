const { asyncHandler } = require("../../utils/asyncHandler");
const sellerSupportChatService = require("../../services/sellerSupportChat/sellerSupportChatService");
const {
  emitSellerSupportChatMessage,
  emitSellerSupportChatThreadsUpdated,
  emitSellerSupportChatRead,
} = require("../../socket/sellerSupportChatSocketEmitter");
const {
  notifySellerSupportChatMessageReceived,
} = require("../../services/sellerNotifications/sellerNotificationService");

const listThreads = asyncHandler(async (_req, res) => {
  const data = await sellerSupportChatService.listAdminThreads();
  res.json({ ok: true, data });
});

const getUnreadCount = asyncHandler(async (_req, res) => {
  const data = await sellerSupportChatService.getUnreadCountForAdmin();
  res.json({ ok: true, data });
});

const listMessages = asyncHandler(async (req, res) => {
  const data = await sellerSupportChatService.listMessagesForAdmin(
    req.params.sellerId,
  );
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const sellerId = String(req.params.sellerId || "").trim();
  const data = await sellerSupportChatService.sendAdminMessage(
    sellerId,
    req.body || {},
  );

  emitSellerSupportChatMessage({
    sellerId,
    message: data.socketMessage,
  });
  emitSellerSupportChatThreadsUpdated({ sellerId });

  await notifySellerSupportChatMessageReceived({
    sellerId,
    messageType: data.message?.type,
    content: data.message?.content,
  }).catch(() => null);

  res.status(201).json({ ok: true, data: { message: data.message } });
});

const markRead = asyncHandler(async (req, res) => {
  const sellerId = String(req.params.sellerId || "").trim();
  const data = await sellerSupportChatService.markReadByAdmin(sellerId);

  emitSellerSupportChatThreadsUpdated({ sellerId });
  emitSellerSupportChatRead({ sellerId, readBy: "admin" });

  res.json({ ok: true, data });
});

module.exports = {
  listThreads,
  getUnreadCount,
  listMessages,
  sendMessage,
  markRead,
};
