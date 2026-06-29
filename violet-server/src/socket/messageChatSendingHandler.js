const { MESSAGE_CHAT_SOCKET_EVENTS } = require("./messageChatSocketEvents");
const { getUserRoom, getSellerRoom } = require("./messageChatSocketEmitter");

function normalizeSocketId(value) {
  return String(value || "").trim();
}

function registerMessageChatSendingOnSocket(socket, io) {
  socket.on(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, (payload) => {
    const identity = socket.data.messageChatIdentity;
    if (!identity) return;

    const isSending = Boolean(payload?.isSending);

    if (identity.kind === "user") {
      const sellerId = normalizeSocketId(payload?.sellerId);
      if (!sellerId) return;

      io.to(getSellerRoom(sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, {
        userId: normalizeSocketId(identity.userId),
        sellerId,
        sender: "user",
        isSending,
      });
      return;
    }

    if (identity.kind === "seller") {
      const userId = normalizeSocketId(payload?.userId);
      if (!userId) return;

      io.to(getUserRoom(userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, {
        userId,
        sellerId: normalizeSocketId(identity.sellerId),
        sender: "seller",
        isSending,
      });
    }
  });
}

module.exports = { registerMessageChatSendingOnSocket };
