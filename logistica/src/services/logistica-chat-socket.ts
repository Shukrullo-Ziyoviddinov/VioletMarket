import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import type { LogisticaChatMessage } from '@/types/logistica-chat';

const LOGISTICA_CHAT_EVENTS = {
  MESSAGE: 'logisticaChat:message',
  THREADS_UPDATED: 'logisticaChat:threadsUpdated',
  READ: 'logisticaChat:read',
} as const;

type MessagePayload = {
  logisticaId: string;
  message: LogisticaChatMessage;
};

type ReadPayload = {
  logisticaId: string;
  readBy: 'logistica' | 'admin';
};

type ThreadsPayload = {
  logisticaId: string | null;
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
  nextSocket.off(LOGISTICA_CHAT_EVENTS.MESSAGE);
  nextSocket.off(LOGISTICA_CHAT_EVENTS.READ);
  nextSocket.off(LOGISTICA_CHAT_EVENTS.THREADS_UPDATED);

  nextSocket.on(LOGISTICA_CHAT_EVENTS.MESSAGE, (payload: MessagePayload) => {
    dispatchMessage(payload);
  });
  nextSocket.on(LOGISTICA_CHAT_EVENTS.READ, (payload: ReadPayload) => {
    dispatchRead(payload);
  });
  nextSocket.on(
    LOGISTICA_CHAT_EVENTS.THREADS_UPDATED,
    (payload: ThreadsPayload) => {
      dispatchThreads(payload);
    },
  );
}

export function connectLogisticaChatSocket(token: string) {
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

export function disconnectLogisticaChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  currentToken = null;
}

export function onLogisticaChatMessage(handler: MessageHandler) {
  messageHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    messageHandlers.delete(handler);
  };
}

export function onLogisticaChatRead(handler: ReadHandler) {
  readHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    readHandlers.delete(handler);
  };
}

export function onLogisticaChatThreadsUpdated(handler: ThreadsHandler) {
  threadsHandlers.add(handler);
  if (socket) bindSocketEvents(socket);
  return () => {
    threadsHandlers.delete(handler);
  };
}
