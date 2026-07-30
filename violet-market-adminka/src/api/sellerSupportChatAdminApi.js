import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchSellerSupportChatThreads() {
  const res = await fetch(apiUrl('/api/admin/seller-support-chat/threads'));
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.threads) ? payload.data.threads : [];
}

export async function fetchSellerSupportChatUnreadCount() {
  const res = await fetch(apiUrl('/api/admin/seller-support-chat/unread'));
  const payload = await parseJson(res);
  return Number(payload?.data?.unread) || 0;
}

export async function fetchSellerSupportChatMessages(sellerId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/seller-support-chat/threads/${encodeURIComponent(sellerId)}/messages`,
    ),
  );
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
}

export async function sendSellerSupportChatTextMessage(sellerId, content) {
  const res = await fetch(
    apiUrl(
      `/api/admin/seller-support-chat/threads/${encodeURIComponent(sellerId)}/messages`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', content }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function sendSellerSupportChatImageMessage(sellerId, imageBase64) {
  const res = await fetch(
    apiUrl(
      `/api/admin/seller-support-chat/threads/${encodeURIComponent(sellerId)}/messages`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'image', imageBase64 }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function markSellerSupportChatRead(sellerId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/seller-support-chat/threads/${encodeURIComponent(sellerId)}/read`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}
