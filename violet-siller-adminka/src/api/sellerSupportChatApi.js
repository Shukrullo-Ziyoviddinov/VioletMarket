import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchSellerSupportChatMessages(token) {
  const res = await fetch(apiUrl('/api/seller-auth/support-chat/messages'), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
}

export async function fetchSellerSupportChatUnread(token) {
  const res = await fetch(apiUrl('/api/seller-auth/support-chat/unread'), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return Number(payload?.data?.unread) || 0;
}

export async function sendSellerSupportChatTextMessage(token, content) {
  const res = await fetch(apiUrl('/api/seller-auth/support-chat/messages'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type: 'text', content }),
  });
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function sendSellerSupportChatImageMessage(token, imageBase64) {
  const res = await fetch(apiUrl('/api/seller-auth/support-chat/messages'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type: 'image', imageBase64 }),
  });
  const payload = await parseJson(res);
  return payload?.data?.message;
}

export async function markSellerSupportChatRead(token) {
  const res = await fetch(apiUrl('/api/seller-auth/support-chat/read'), {
    method: 'POST',
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return payload?.data;
}
