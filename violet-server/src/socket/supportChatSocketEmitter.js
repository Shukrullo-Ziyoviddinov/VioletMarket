const { SUPPORT_CHAT_SOCKET_EVENTS } = require("./supportChatSocketEvents");
const { getMessageChatSocketIo } = require("./messageChatSocketEmitter");

function getCourierRoom(deliveryId) {
  return `support-chat:courier:${String(deliveryId)}`;
}

function getAdminRoom() {
  return "support-chat:admin";
}

function normalizeId(value) {
  return String(value || "").trim();
}

function emitSupportChatMessage({ deliveryId, message }) {
  const io = getMessageChatSocketIo();
  if (!io || !deliveryId || !message) return;

  const payload = {
    deliveryId: normalizeId(deliveryId),
    message,
  };

  io.to(getCourierRoom(payload.deliveryId)).emit(
    SUPPORT_CHAT_SOCKET_EVENTS.MESSAGE,
    payload,
  );
  io.to(getAdminRoom()).emit(SUPPORT_CHAT_SOCKET_EVENTS.MESSAGE, payload);
}

function emitSupportChatThreadsUpdated({ deliveryId }) {
  const io = getMessageChatSocketIo();
  if (!io) return;

  const payload = {
    deliveryId: deliveryId ? normalizeId(deliveryId) : null,
  };

  if (deliveryId) {
    io.to(getCourierRoom(deliveryId)).emit(
      SUPPORT_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
      payload,
    );
  }
  io.to(getAdminRoom()).emit(
    SUPPORT_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
    payload,
  );
}

function emitSupportChatRead({ deliveryId, readBy }) {
  const io = getMessageChatSocketIo();
  if (!io || !deliveryId || !readBy) return;

  const payload = {
    deliveryId: normalizeId(deliveryId),
    readBy: String(readBy).trim(),
  };

  io.to(getCourierRoom(payload.deliveryId)).emit(
    SUPPORT_CHAT_SOCKET_EVENTS.READ,
    payload,
  );
  io.to(getAdminRoom()).emit(SUPPORT_CHAT_SOCKET_EVENTS.READ, payload);
}

module.exports = {
  getCourierRoom,
  getAdminRoom,
  emitSupportChatMessage,
  emitSupportChatThreadsUpdated,
  emitSupportChatRead,
};
