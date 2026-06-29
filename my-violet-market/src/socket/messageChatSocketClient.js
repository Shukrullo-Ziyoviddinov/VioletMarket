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
  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, payload);
  });

  nextSocket.on(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, (payload) => {
    dispatchEvent(MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED, payload);
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
