const {
  SELLER_SUPPORT_CHAT_SOCKET_EVENTS,
} = require("./sellerSupportChatSocketEvents");
const { getMessageChatSocketIo } = require("./messageChatSocketEmitter");

function getSellerSupportRoom(sellerId) {
  return `seller-support-chat:seller:${String(sellerId)}`;
}

function getSellerSupportAdminRoom() {
  return "seller-support-chat:admin";
}

function normalizeId(value) {
  return String(value || "").trim();
}

function emitSellerSupportChatMessage({ sellerId, message }) {
  const io = getMessageChatSocketIo();
  if (!io || !sellerId || !message) return;

  const payload = {
    sellerId: normalizeId(sellerId),
    message,
  };

  io.to(getSellerSupportRoom(payload.sellerId)).emit(
    SELLER_SUPPORT_CHAT_SOCKET_EVENTS.MESSAGE,
    payload,
  );
  io.to(getSellerSupportAdminRoom()).emit(
    SELLER_SUPPORT_CHAT_SOCKET_EVENTS.MESSAGE,
    payload,
  );
}

function emitSellerSupportChatThreadsUpdated({ sellerId }) {
  const io = getMessageChatSocketIo();
  if (!io) return;

  const payload = {
    sellerId: sellerId ? normalizeId(sellerId) : null,
  };

  if (sellerId) {
    io.to(getSellerSupportRoom(sellerId)).emit(
      SELLER_SUPPORT_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
      payload,
    );
  }
  io.to(getSellerSupportAdminRoom()).emit(
    SELLER_SUPPORT_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
    payload,
  );
}

function emitSellerSupportChatRead({ sellerId, readBy }) {
  const io = getMessageChatSocketIo();
  if (!io || !sellerId || !readBy) return;

  const payload = {
    sellerId: normalizeId(sellerId),
    readBy: String(readBy).trim(),
  };

  io.to(getSellerSupportRoom(payload.sellerId)).emit(
    SELLER_SUPPORT_CHAT_SOCKET_EVENTS.READ,
    payload,
  );
  io.to(getSellerSupportAdminRoom()).emit(
    SELLER_SUPPORT_CHAT_SOCKET_EVENTS.READ,
    payload,
  );
}

module.exports = {
  getSellerSupportRoom,
  getSellerSupportAdminRoom,
  emitSellerSupportChatMessage,
  emitSellerSupportChatThreadsUpdated,
  emitSellerSupportChatRead,
};
