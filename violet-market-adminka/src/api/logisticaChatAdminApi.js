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

export async function fetchLogisticaChatThreads() {
  const res = await fetch(apiUrl('/api/admin/logistica-chat/threads'));
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.threads) ? payload.data.threads : [];
}

export async function fetchLogisticaChatUnreadCount() {
  const threads = await fetchLogisticaChatThreads();
  return threads.reduce(
    (total, thread) => total + (Number(thread?.unreadCount) || 0),
    0,
  );
}

export async function fetchLogisticaChatMessages(logisticaId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/logistica-chat/threads/${encodeURIComponent(logisticaId)}/messages`,
    ),
  );
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
}

export async function sendLogisticaChatTextMessage(logisticaId, content) {
  const res = await fetch(
    apiUrl(
      `/api/admin/logistica-chat/threads/${encodeURIComponent(logisticaId)}/messages`,
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

export async function sendLogisticaChatImageMessage(logisticaId, imageBase64) {
  const res = await fetch(
    apiUrl(
      `/api/admin/logistica-chat/threads/${encodeURIComponent(logisticaId)}/messages`,
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

export async function markLogisticaChatRead(logisticaId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/logistica-chat/threads/${encodeURIComponent(logisticaId)}/read`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}
