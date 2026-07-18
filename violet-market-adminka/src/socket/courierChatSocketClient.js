import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../config/api';

const SUPPORT_CHAT_EVENTS = {
  MESSAGE: 'supportChat:message',
  THREADS_UPDATED: 'supportChat:threadsUpdated',
  READ: 'supportChat:read',
};

const ADMIN_SOCKET_KEY =
  (process.env.REACT_APP_ADMIN_SOCKET_KEY || 'violet-admin-socket-dev-key').trim();

let socket = null;

export function connectCourierChatSocket() {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(getApiBaseUrl(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { adminKey: ADMIN_SOCKET_KEY },
    autoConnect: true,
    reconnection: true,
  });

  return socket;
}

export function disconnectCourierChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function onCourierChatMessage(handler) {
  if (!socket) connectCourierChatSocket();
  socket.on(SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  return () => {
    socket?.off(SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  };
}

export function onCourierChatThreadsUpdated(handler) {
  if (!socket) connectCourierChatSocket();
  socket.on(SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  return () => {
    socket?.off(SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  };
}
