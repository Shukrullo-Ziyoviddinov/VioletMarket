import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../config/api';

const SELLER_SUPPORT_CHAT_EVENTS = {
  MESSAGE: 'sellerSupportChat:message',
  THREADS_UPDATED: 'sellerSupportChat:threadsUpdated',
  READ: 'sellerSupportChat:read',
};

const ADMIN_SOCKET_KEY =
  (process.env.REACT_APP_ADMIN_SOCKET_KEY || 'violet-admin-socket-dev-key').trim();

let socket = null;

export function connectSellerSupportChatSocket() {
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

export function disconnectSellerSupportChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function onSellerSupportChatMessage(handler) {
  if (!socket) connectSellerSupportChatSocket();
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  return () => {
    socket?.off(SELLER_SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  };
}

export function onSellerSupportChatThreadsUpdated(handler) {
  if (!socket) connectSellerSupportChatSocket();
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  return () => {
    socket?.off(SELLER_SUPPORT_CHAT_EVENTS.THREADS_UPDATED, handler);
  };
}

export function onSellerSupportChatRead(handler) {
  if (!socket) connectSellerSupportChatSocket();
  socket.on(SELLER_SUPPORT_CHAT_EVENTS.READ, handler);
  return () => {
    socket?.off(SELLER_SUPPORT_CHAT_EVENTS.READ, handler);
  };
}
