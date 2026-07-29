const { asyncHandler } = require("../../utils/asyncHandler");
const logisticaChatService = require("../../services/logisticaChat/logisticaChatService");
const {
  emitLogisticaChatMessage,
  emitLogisticaChatThreadsUpdated,
  emitLogisticaChatRead,
} = require("../../socket/logisticaChatSocketEmitter");

const listMessages = asyncHandler(async (req, res) => {
  const data = await logisticaChatService.listMessagesForLogistica(
    req.logisticaId,
  );
  res.json({ ok: true, data });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await logisticaChatService.getUnreadCountForLogistica(
    req.logisticaId,
  );
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const logisticaId = String(req.logisticaId);
  const data = await logisticaChatService.sendLogisticaMessage(
    logisticaId,
    req.body || {},
  );

  emitLogisticaChatMessage({
    logisticaId,
    message: data.socketMessage,
  });
  emitLogisticaChatThreadsUpdated({ logisticaId });

  res.status(201).json({ ok: true, data: { message: data.message } });
});

const markRead = asyncHandler(async (req, res) => {
  const logisticaId = String(req.logisticaId);
  const data = await logisticaChatService.markReadByLogistica(logisticaId);

  emitLogisticaChatThreadsUpdated({ logisticaId });
  emitLogisticaChatRead({ logisticaId, readBy: "logistica" });

  res.json({ ok: true, data });
});

module.exports = {
  listMessages,
  getUnreadCount,
  sendMessage,
  markRead,
};
