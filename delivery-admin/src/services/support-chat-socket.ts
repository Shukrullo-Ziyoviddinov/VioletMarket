import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import type { SupportChatMessage } from '@/types/support-chat';

const SUPPORT_CHAT_EVENTS = {
  MESSAGE: 'supportChat:message',
  THREADS_UPDATED: 'supportChat:threadsUpdated',
  READ: 'supportChat:read',
} as const;

type MessagePayload = {
  deliveryId: string;
  message: SupportChatMessage;
};

type ReadPayload = {
  deliveryId: string;
  readBy: 'courier' | 'admin';
};

type ThreadsPayload = {
  deliveryId: string | null;
};

type MessageHandler = (payload: MessagePayload) => void;
type ReadHandler = (payload: ReadPayload) => void;
type ThreadsHandler = (payload: ThreadsPayload) => void;

let socket: Socket | null = null;
let currentToken: string | null = null;

const messageHandlers = new Set<MessageHandler>();
const readHandlers = new Set<ReadHandler>();
const threadsHandlers = new Set<ThreadsHandler>();

function dispatchMessage(payload: MessagePayload) {
  messageHandlers.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // ignore listener errors
    }
  });
}

function dispatchRead(payload: ReadPayload) {
  readHandlers.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // ignore listener errors
    }
  });
}

function dispatchThreads(payload: ThreadsPayload) {
  threadsHandlers.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // ignore listener errors
    }
  });
}

function bindSocketEvents(nextSocket: Socket) {
  nextSocket.off(SUPPORT_CHAT_EVENTS.MESSAGE);
  nextSocket.off(SUPPORT_CHAT_EVENTS.READ);
  nextSocket.off(SUPPORT_CHAT_EVENTS.THREADS_UPDATED);

  nextSocket.on(SUPPORT_CHAT_EVENTS.MESSAGE, (payload: MessagePayload) => {
    dispatchMessage(payload);
  });
  nextSocket.on(SUPPORT_CHAT_EVENTS.READ, (payload: ReadPayload) => {
    dispatchRead(payload);
  });
  nextSocket.on(
    SUPPORT_CHAT_EVENTS.THREADS_UPDATED,
    (payload: ThreadsPayload) => {
      dispatchThreads(payload);
    },
  );
}

export function connectSupportChatSocket(token: string) {
  const nextToken = String(token || '').trim();
  if (!nextToken) return null;

  if (socket && currentToken === nextToken) {
    if (!socket.connected) {
      socket.connect();
    }
    bindSocketEvents(socket);
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
    reconnection: true,
    reconnectionAttempts: 20,
  });

  bindSocketEvents(socket);
  socket.on('reconnect', () => {
    if (socket) bindSocketEvents(socket);
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
  messageHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    messageHandlers.delete(handler);
  };
}

export function onSupportChatRead(handler: ReadHandler) {
  readHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    readHandlers.delete(handler);
  };
}

export function onSupportChatThreadsUpdated(handler: ThreadsHandler) {
  threadsHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    threadsHandlers.delete(handler);
  };
}
