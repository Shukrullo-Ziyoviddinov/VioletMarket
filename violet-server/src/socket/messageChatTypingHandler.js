const { MESSAGE_CHAT_SOCKET_EVENTS } = require("./messageChatSocketEvents");
const { getUserRoom, getSellerRoom } = require("./messageChatSocketEmitter");

function normalizeSocketId(value) {
  return String(value || "").trim();
}

function registerMessageChatTypingOnSocket(socket, io) {
  socket.on(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, (payload) => {
    const identity = socket.data.messageChatIdentity;
    if (!identity) return;

    const isTyping = Boolean(payload?.isTyping);

    if (identity.kind === "user") {
      const sellerId = normalizeSocketId(payload?.sellerId);
      if (!sellerId) return;

      io.to(getSellerRoom(sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, {
        userId: normalizeSocketId(identity.userId),
        sellerId,
        sender: "user",
        isTyping,
      });
      return;
    }

    if (identity.kind === "seller") {
      const userId = normalizeSocketId(payload?.userId);
      if (!userId) return;

      io.to(getUserRoom(userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, {
        userId,
        sellerId: normalizeSocketId(identity.sellerId),
        sender: "seller",
        isTyping,
      });
    }
  });
}

module.exports = { registerMessageChatTypingOnSocket };
