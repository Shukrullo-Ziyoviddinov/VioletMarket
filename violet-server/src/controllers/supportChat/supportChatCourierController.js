const { asyncHandler } = require("../../utils/asyncHandler");
const supportChatService = require("../../services/supportChat/supportChatService");
const {
  emitSupportChatMessage,
  emitSupportChatThreadsUpdated,
  emitSupportChatRead,
} = require("../../socket/supportChatSocketEmitter");
const {
  notifyAdminCourierChatMessage,
} = require("../../services/adminNotifications/adminNotificationService");

const listMessages = asyncHandler(async (req, res) => {
  const data = await supportChatService.listMessagesForCourier(req.deliveryId);
  res.json({ ok: true, data });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await supportChatService.getUnreadCountForCourier(req.deliveryId);
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const deliveryId = String(req.deliveryId);
  const data = await supportChatService.sendCourierMessage(
    deliveryId,
    req.body || {},
  );

  await notifyAdminCourierChatMessage({
    deliveryId,
    messageType: data.message?.type,
    content: data.message?.content,
  }).catch(() => null);

  emitSupportChatMessage({
    deliveryId,
    message: data.socketMessage,
  });
  emitSupportChatThreadsUpdated({ deliveryId });

  res.status(201).json({ ok: true, data: { message: data.message } });
});

const markRead = asyncHandler(async (req, res) => {
  const deliveryId = String(req.deliveryId);
  const data = await supportChatService.markReadByCourier(deliveryId);

  emitSupportChatThreadsUpdated({ deliveryId });
  emitSupportChatRead({ deliveryId, readBy: "courier" });

  res.json({ ok: true, data });
});

module.exports = {
  listMessages,
  getUnreadCount,
  sendMessage,
  markRead,
};
