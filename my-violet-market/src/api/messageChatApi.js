import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'So‘rov xatosi');
    err.status = res.status;
    err.code = data.code;
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

export function fetchMessageChatThreads(token) {
  return fetch(apiUrl('/api/message-chat/threads'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function fetchMessageChatThreadMessages(token, sellerId) {
  return fetch(apiUrl(`/api/message-chat/threads/${encodeURIComponent(sellerId)}/messages`), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function sendMessageChatMessage(token, sellerId, payload) {
  return fetch(apiUrl(`/api/message-chat/threads/${encodeURIComponent(sellerId)}/messages`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseJsonResponse);
}

export function markMessageChatThreadRead(token, sellerId) {
  return fetch(apiUrl(`/api/message-chat/threads/${encodeURIComponent(sellerId)}/read`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  }).then(parseJsonResponse);
}

export function uploadMessageChatImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  return fetch(apiUrl('/api/message-chat/uploads/image'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }).then(parseJsonResponse);
}
