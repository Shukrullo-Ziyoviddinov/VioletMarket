const { asyncHandler } = require("../../utils/asyncHandler");
const sellerSupportChatService = require("../../services/sellerSupportChat/sellerSupportChatService");
const {
  emitSellerSupportChatMessage,
  emitSellerSupportChatThreadsUpdated,
  emitSellerSupportChatRead,
} = require("../../socket/sellerSupportChatSocketEmitter");
const {
  notifyAdminSellerSupportChatMessage,
} = require("../../services/adminNotifications/adminNotificationService");

const listMessages = asyncHandler(async (req, res) => {
  const data = await sellerSupportChatService.listMessagesForSeller(
    req.sellerShopId,
  );
  res.json({ ok: true, data });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await sellerSupportChatService.getUnreadCountForSeller(
    req.sellerShopId,
  );
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const sellerId = String(req.sellerShopId);
  const data = await sellerSupportChatService.sendSellerMessage(
    sellerId,
    req.body || {},
  );

  emitSellerSupportChatMessage({
    sellerId,
    message: data.socketMessage,
  });
  emitSellerSupportChatThreadsUpdated({ sellerId });

  await notifyAdminSellerSupportChatMessage({
    sellerId,
    account: data.account,
    messageType: data.message?.type,
    content: data.message?.content,
  }).catch(() => null);

  res.status(201).json({ ok: true, data: { message: data.message } });
});

const markRead = asyncHandler(async (req, res) => {
  const sellerId = String(req.sellerShopId);
  const data = await sellerSupportChatService.markReadBySeller(sellerId);

  emitSellerSupportChatThreadsUpdated({ sellerId });
  emitSellerSupportChatRead({ sellerId, readBy: "seller" });

  res.json({ ok: true, data });
});

module.exports = {
  listMessages,
  getUnreadCount,
  sendMessage,
  markRead,
};
