const { LOGISTICA_CHAT_SOCKET_EVENTS } = require("./logisticaChatSocketEvents");
const { getMessageChatSocketIo } = require("./messageChatSocketEmitter");

function getLogisticaRoom(logisticaId) {
  return `logistica-chat:logistica:${String(logisticaId)}`;
}

function getLogisticaAdminRoom() {
  return "logistica-chat:admin";
}

function normalizeId(value) {
  return String(value || "").trim();
}

function emitLogisticaChatMessage({ logisticaId, message }) {
  const io = getMessageChatSocketIo();
  if (!io || !logisticaId || !message) return;

  const payload = {
    logisticaId: normalizeId(logisticaId),
    message,
  };

  io.to(getLogisticaRoom(payload.logisticaId)).emit(
    LOGISTICA_CHAT_SOCKET_EVENTS.MESSAGE,
    payload,
  );
  io.to(getLogisticaAdminRoom()).emit(
    LOGISTICA_CHAT_SOCKET_EVENTS.MESSAGE,
    payload,
  );
}

function emitLogisticaChatThreadsUpdated({ logisticaId }) {
  const io = getMessageChatSocketIo();
  if (!io) return;

  const payload = {
    logisticaId: logisticaId ? normalizeId(logisticaId) : null,
  };

  if (logisticaId) {
    io.to(getLogisticaRoom(logisticaId)).emit(
      LOGISTICA_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
      payload,
    );
  }
  io.to(getLogisticaAdminRoom()).emit(
    LOGISTICA_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
    payload,
  );
}

function emitLogisticaChatRead({ logisticaId, readBy }) {
  const io = getMessageChatSocketIo();
  if (!io || !logisticaId || !readBy) return;

  const payload = {
    logisticaId: normalizeId(logisticaId),
    readBy: String(readBy).trim(),
  };

  io.to(getLogisticaRoom(payload.logisticaId)).emit(
    LOGISTICA_CHAT_SOCKET_EVENTS.READ,
    payload,
  );
  io.to(getLogisticaAdminRoom()).emit(
    LOGISTICA_CHAT_SOCKET_EVENTS.READ,
    payload,
  );
}

module.exports = {
  getLogisticaRoom,
  getLogisticaAdminRoom,
  emitLogisticaChatMessage,
  emitLogisticaChatThreadsUpdated,
  emitLogisticaChatRead,
};
