import {
  connectMessageChatSocket,
  getMessageChatSocket,
} from './messageChatSocketClient';

export const SELLER_SUPPORT_CHAT_EVENTS = {
  MESSAGE: 'sellerSupportChat:message',
  THREADS_UPDATED: 'sellerSupportChat:threadsUpdated',
  READ: 'sellerSupportChat:read',
};

export const SELLER_SUPPORT_CHAT_UPDATED_EVENT = 'sellerSupportChatUpdated';

function ensureSocket(token) {
  const existing = getMessageChatSocket();
  if (existing?.connected) return existing;
  return connectMessageChatSocket(token);
}

export function onSellerSupportChatMessage(token, handler) {
  const socket = ensureSocket(token);
  if (!socket) return () => {};
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  return () => {
    socket.off(SELLER_SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  };
}

export function onSellerSupportChatThreadsUpdated(token, handler) {
  const socket = ensureSocket(token);
  if (!socket) return () => {};
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  return () => {
    socket.off(SELLER_SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  };
}

export function onSellerSupportChatRead(token, handler) {
  const socket = ensureSocket(token);
  if (!socket) return () => {};
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.READ, handler);
  return () => {
    socket.off(SELLER_SUPPORT_CHAT_EVENTS.READ, handler);
  };
}

export function emitSellerSupportChatUpdated() {
  window.dispatchEvent(new CustomEvent(SELLER_SUPPORT_CHAT_UPDATED_EVENT));
}
