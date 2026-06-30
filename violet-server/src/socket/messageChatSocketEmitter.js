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

function normalizeSocketId(value) {
  return String(value || "").trim();
}

function emitMessageChatMessage({ userId, sellerId, message }) {
  if (!ioInstance || !userId || !sellerId || !message) return;

  const payload = {
    userId: normalizeSocketId(userId),
    sellerId: normalizeSocketId(sellerId),
    message,
  };

  ioInstance.to(getUserRoom(payload.userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
  ioInstance.to(getSellerRoom(payload.sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
}

function emitMessageChatThreadsUpdated({ userId, sellerId }) {
  if (!ioInstance) return;

  const payload = {
    userId: userId ? normalizeSocketId(userId) : null,
    sellerId: sellerId ? normalizeSocketId(sellerId) : null,
  };

  if (userId) {
    ioInstance.to(getUserRoom(userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
  }
  if (sellerId) {
    ioInstance.to(getSellerRoom(sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
  }
}

function emitMessageChatRead({ userId, sellerId, readBy }) {
  if (!ioInstance || !userId || !sellerId || !readBy) return;

  const payload = {
    userId: normalizeSocketId(userId),
    sellerId: normalizeSocketId(sellerId),
    readBy: String(readBy).trim(),
  };

  ioInstance.to(getUserRoom(payload.userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.READ, payload);
  ioInstance.to(getSellerRoom(payload.sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.READ, payload);
}

function emitMessageChatMessageDeleted({ userId, sellerId, messageId }) {
  if (!ioInstance || !userId || !sellerId || !messageId) return;

  const payload = {
    userId: normalizeSocketId(userId),
    sellerId: normalizeSocketId(sellerId),
    messageId: normalizeSocketId(messageId),
  };

  ioInstance.to(getUserRoom(payload.userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED, payload);
  ioInstance.to(getSellerRoom(payload.sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED, payload);
}

function emitMessageChatMessageUpdated({ userId, sellerId, message }) {
  if (!ioInstance || !userId || !sellerId || !message) return;

  const payload = {
    userId: normalizeSocketId(userId),
    sellerId: normalizeSocketId(sellerId),
    message,
  };

  ioInstance.to(getUserRoom(payload.userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, payload);
  ioInstance.to(getSellerRoom(payload.sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, payload);
}

function emitMessageChatThreadDeleted({ userId, sellerId }) {
  if (!ioInstance || !userId || !sellerId) return;

  const payload = {
    userId: normalizeSocketId(userId),
    sellerId: normalizeSocketId(sellerId),
  };

  ioInstance.to(getUserRoom(payload.userId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREAD_DELETED, payload);
  ioInstance.to(getSellerRoom(payload.sellerId)).emit(MESSAGE_CHAT_SOCKET_EVENTS.THREAD_DELETED, payload);
}

module.exports = {
  setMessageChatSocketIo,
  emitMessageChatMessage,
  emitMessageChatThreadsUpdated,
  emitMessageChatRead,
  emitMessageChatMessageDeleted,
  emitMessageChatMessageUpdated,
  emitMessageChatThreadDeleted,
  getUserRoom,
  getSellerRoom,
};
