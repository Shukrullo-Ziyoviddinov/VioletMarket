import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import type { SupportChatMessage } from '@/types/support-chat';

const SUPPORT_CHAT_EVENTS = {
  MESSAGE: 'supportChat:message',
  THREADS_UPDATED: 'supportChat:threadsUpdated',
  READ: 'supportChat:read',
} as const;

type MessageHandler = (payload: {
  deliveryId: string;
  message: SupportChatMessage;
}) => void;

type ReadHandler = (payload: {
  deliveryId: string;
  readBy: 'courier' | 'admin';
}) => void;

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectSupportChatSocket(token: string) {
  const nextToken = String(token || '').trim();
  if (!nextToken) return null;

  if (socket && currentToken === nextToken && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = nextToken;
  socket = io(env.apiUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: nextToken },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSupportChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  currentToken = null;
}

export function onSupportChatMessage(handler: MessageHandler) {
  if (!socket) return () => {};
  socket.on(SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  return () => {
    socket?.off(SUPPORT_CHAT_EVENTS.MESSAGE, handler);
  };
}

export function onSupportChatRead(handler: ReadHandler) {
  if (!socket) return () => {};
  socket.on(SUPPORT_CHAT_EVENTS.READ, handler);
  return () => {
    socket?.off(SUPPORT_CHAT_EVENTS.READ, handler);
  };
}
