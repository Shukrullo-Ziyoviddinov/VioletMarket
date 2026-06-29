import { io } from 'socket.io-client';
import { getMessageChatSocketUrl, MESSAGE_CHAT_SOCKET_EVENTS } from './messageChatSocketConfig';

let socket = null;
let activeToken = '';

const listeners = new Map();

function dispatchEvent(eventName, payload) {
  const handlers = listeners.get(eventName);
  if (!handlers) return;
  handlers.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // listener xatosi boshqa listenerlarni to'xtatmasin
    }
  });
}

function bindSocketEvents(nextSocket) {
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.TYPING);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.SENDING);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.READ);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED);
  nextSocket.off(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED);

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.READ, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.READ, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, payload);
  });
}

export function connectMessageChatSocket(token) {
  const nextToken = String(token || '').trim();
  if (!nextToken) {
    disconnectMessageChatSocket();
    return null;
  }

  if (socket && activeToken === nextToken && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeToken = nextToken;
  socket = io(getMessageChatSocketUrl(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: nextToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
  });

  bindSocketEvents(socket);
  return socket;
}

export function disconnectMessageChatSocket() {
  activeToken = '';
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function subscribeMessageChatSocket(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName).add(handler);

  return () => {
    const handlers = listeners.get(eventName);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      listeners.delete(eventName);
    }
  };
}

export function getMessageChatSocket() {
  return socket;
}

export function emitMessageChatTyping(payload) {
  const activeSocket = getMessageChatSocket();
  if (!activeSocket?.connected) return;
  activeSocket.emit(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, payload);
}

export function emitMessageChatSending(payload) {
  const activeSocket = getMessageChatSocket();
  if (!activeSocket?.connected) return;
  activeSocket.emit(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, payload);
}

export function emitMessageChatPresenceSubscribe(payload) {
  const activeSocket = getMessageChatSocket();
  if (!activeSocket?.connected) return;
  activeSocket.emit(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_SUBSCRIBE, payload);
}
