import { apiRequest } from '@/services/api';
import type { LogisticaChatMessage } from '@/types/logistica-chat';

export async function fetchLogisticaChatMessages(token: string) {
  return apiRequest<{ messages: LogisticaChatMessage[] }>(
    '/api/logistica/chat/messages',
    { method: 'GET' },
    token,
  );
}

export async function sendLogisticaChatTextMessage(
  token: string,
  content: string,
) {
  return apiRequest<{ message: LogisticaChatMessage }>(
    '/api/logistica/chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ type: 'text', content }),
    },
    token,
  );
}

export async function sendLogisticaChatImageMessage(
  token: string,
  imageBase64: string,
) {
  return apiRequest<{ message: LogisticaChatMessage }>(
    '/api/logistica/chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ type: 'image', imageBase64 }),
    },
    token,
  );
}

export async function fetchLogisticaChatUnreadCount(token: string) {
  return apiRequest<{ unread: number }>(
    '/api/logistica/chat/unread',
    { method: 'GET' },
    token,
  );
}

export async function markLogisticaChatRead(token: string) {
  return apiRequest<{ updated: number }>(
    '/api/logistica/chat/read',
    { method: 'POST' },
    token,
  );
}
