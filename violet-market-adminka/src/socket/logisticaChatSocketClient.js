import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../config/api';

const LOGISTICA_CHAT_EVENTS = {
  MESSAGE: 'logisticaChat:message',
  THREADS_UPDATED: 'logisticaChat:threadsUpdated',
  READ: 'logisticaChat:read',
};

const ADMIN_SOCKET_KEY =
  (process.env.REACT_APP_ADMIN_SOCKET_KEY || 'violet-admin-socket-dev-key').trim();

let socket = null;

export function connectLogisticaChatSocket() {
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

export function disconnectLogisticaChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function onLogisticaChatMessage(handler) {
  if (!socket) connectLogisticaChatSocket();
  socket.on(LOGISTICA_CHAT_EVENTS.MESSAGE, handler);
  return () => {
    socket?.off(LOGISTICA_CHAT_EVENTS.MESSAGE, handler);
  };
}

export function onLogisticaChatThreadsUpdated(handler) {
  if (!socket) connectLogisticaChatSocket();
  socket.on(LOGISTICA_CHAT_EVENTS.THREADS_UPDATED, handler);
  return () => {
    socket?.off(LOGISTICA_CHAT_EVENTS.THREADS_UPDATED, handler);
  };
}

export function onLogisticaChatRead(handler) {
  if (!socket) connectLogisticaChatSocket();
  socket.on(LOGISTICA_CHAT_EVENTS.READ, handler);
  return () => {
    socket?.off(LOGISTICA_CHAT_EVENTS.READ, handler);
  };
}
