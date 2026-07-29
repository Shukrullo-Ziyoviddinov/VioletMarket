const { asyncHandler } = require("../../utils/asyncHandler");
const logisticaChatService = require("../../services/logisticaChat/logisticaChatService");
const {
  emitLogisticaChatMessage,
  emitLogisticaChatThreadsUpdated,
  emitLogisticaChatRead,
} = require("../../socket/logisticaChatSocketEmitter");

const listThreads = asyncHandler(async (_req, res) => {
  const data = await logisticaChatService.listAdminThreads();
  res.json({ ok: true, data });
});

const listMessages = asyncHandler(async (req, res) => {
  const data = await logisticaChatService.listMessagesForAdmin(
    req.params.logisticaId,
  );
  res.json({ ok: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const logisticaId = String(req.params.logisticaId || "").trim();
  const data = await logisticaChatService.sendAdminMessage(
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
  const logisticaId = String(req.params.logisticaId || "").trim();
  const data = await logisticaChatService.markReadByAdmin(logisticaId);

  emitLogisticaChatThreadsUpdated({ logisticaId });
  emitLogisticaChatRead({ logisticaId, readBy: "admin" });

  res.json({ ok: true, data });
});

module.exports = {
  listThreads,
  listMessages,
  sendMessage,
  markRead,
};
