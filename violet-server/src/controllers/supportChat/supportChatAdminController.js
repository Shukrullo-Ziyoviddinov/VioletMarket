const { asyncHandler } = require("../../utils/asyncHandler");
const supportChatService = require("../../services/supportChat/supportChatService");
const {
  emitSupportChatMessage,
  emitSupportChatThreadsUpdated,
  emitSupportChatRead,
} = require("../../socket/supportChatSocketEmitter");

const listThreads = asyncHandler(async (_req, res) => {
  const data = await supportChatService.listAdminThreads();
  res.json({ ok: true, data });
});

const listMessages = asyncHandler(async (req, res) => {
  const data = await supportChatService.listMessagesForAdmin(req.params.deliveryId);
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const deliveryId = String(req.params.deliveryId || "").trim();
  const data = await supportChatService.sendAdminMessage(
    deliveryId,
    req.body || {},
  );

  emitSupportChatMessage({
    deliveryId,
    message: data.socketMessage,
  });
  emitSupportChatThreadsUpdated({ deliveryId });

  res.status(201).json({ ok: true, data: { message: data.message } });
});

const markRead = asyncHandler(async (req, res) => {
  const deliveryId = String(req.params.deliveryId || "").trim();
  const data = await supportChatService.markReadByAdmin(deliveryId);

  emitSupportChatThreadsUpdated({ deliveryId });
  emitSupportChatRead({ deliveryId, readBy: "admin" });

  res.json({ ok: true, data });
});

module.exports = {
  listThreads,
  listMessages,
  sendMessage,
  markRead,
};
