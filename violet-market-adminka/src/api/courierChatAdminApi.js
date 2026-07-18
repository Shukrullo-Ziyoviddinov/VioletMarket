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

export async function fetchCourierChatThreads() {
  const res = await fetch(apiUrl('/api/admin/support-chat/threads'));
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.threads) ? payload.data.threads : [];
}

export async function fetchCourierChatMessages(deliveryId) {
  const res = await fetch(
    apiUrl(`/api/admin/support-chat/threads/${encodeURIComponent(deliveryId)}/messages`),
  );
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
}

export async function sendCourierChatTextMessage(deliveryId, content) {
  const res = await fetch(
    apiUrl(`/api/admin/support-chat/threads/${encodeURIComponent(deliveryId)}/messages`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', content }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function sendCourierChatImageMessage(deliveryId, imageBase64) {
  const res = await fetch(
    apiUrl(`/api/admin/support-chat/threads/${encodeURIComponent(deliveryId)}/messages`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'image', imageBase64 }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function markCourierChatRead(deliveryId) {
  const res = await fetch(
    apiUrl(`/api/admin/support-chat/threads/${encodeURIComponent(deliveryId)}/read`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}
