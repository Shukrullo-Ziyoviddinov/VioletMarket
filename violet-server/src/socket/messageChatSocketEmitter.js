const { MESSAGE_CHAT_SOCKET_EVENTS } = require("./messageChatSocketEvents");

let ioInstance = null;

function setMessageChatSocketIo(io) {
  ioInstance = io;
}

function getUserRoom(userId) {
  return `message-chat:user:${String(userId)}`;
}

function getSellerRoom(sellerId) {
  return `message-chat:seller:${String(sellerId)}`;
}

function emitMessageChatMessage({ userId, sellerId, message }) {
  if (!ioInstance || !userId || !sellerId || !message) return;

  const payload = {
    userId: String(userId),
    sellerId: String(sellerId),
    message,
  };

  ioInstance.to(getUserRoom(userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
  ioInstance.to(getSellerRoom(sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
}

function emitMessageChatThreadsUpdated({ userId, sellerId }) {
  if (!ioInstance) return;

  const payload = {
    userId: userId ? String(userId) : null,
    sellerId: sellerId ? String(sellerId) : null,
  };

  if (userId) {
    ioInstance.to(getUserRoom(userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
  }
  if (sellerId) {
    ioInstance.to(getSellerRoom(sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
  }
}

module.exports = {
  setMessageChatSocketIo,
  emitMessageChatMessage,
  emitMessageChatThreadsUpdated,
};
