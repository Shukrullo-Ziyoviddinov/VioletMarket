import { apiRequest } from '@/services/api';
import type { SupportChatMessage } from '@/types/support-chat';

export async function fetchSupportMessages(token: string) {
  return apiRequest<{ messages: SupportChatMessage[] }>(
    '/api/delivery/support-chat/messages',
    { method: 'GET' },
    token,
  );
}

export async function sendSupportTextMessage(token: string, content: string) {
  return apiRequest<{ message: SupportChatMessage }>(
    '/api/delivery/support-chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ type: 'text', content }),
    },
    token,
  );
}

export async function sendSupportImageMessage(
  token: string,
  imageBase64: string,
) {
  return apiRequest<{ message: SupportChatMessage }>(
    '/api/delivery/support-chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ type: 'image', imageBase64 }),
    },
    token,
  );
}

export async function fetchSupportUnreadCount(token: string) {
  return apiRequest<{ unread: number }>(
    '/api/delivery/support-chat/unread',
    { method: 'GET' },
    token,
  );
}

export async function markSupportChatRead(token: string) {
  return apiRequest<{ updated: number }>(
    '/api/delivery/support-chat/read',
    { method: 'POST' },
    token,
  );
}
