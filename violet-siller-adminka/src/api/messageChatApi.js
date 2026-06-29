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

export function fetchSellerMessageThreads(token) {
  return fetch(apiUrl('/api/seller-auth/message-chat/threads'), {
    headers: authHeaders(token),
  }).then(parseJson);
}

export function fetchSellerMessageThreadMessages(token, userId) {
  return fetch(apiUrl(`/api/seller-auth/message-chat/threads/${encodeURIComponent(userId)}/messages`), {
    headers: authHeaders(token),
  }).then(parseJson);
}

export function sendSellerMessageChatMessage(token, userId, payload) {
  return fetch(apiUrl(`/api/seller-auth/message-chat/threads/${encodeURIComponent(userId)}/messages`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseJson);
}

export function markSellerMessageThreadRead(token, userId) {
  return fetch(apiUrl(`/api/seller-auth/message-chat/threads/${encodeURIComponent(userId)}/read`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  }).then(parseJson);
}

export { uploadSellerMarketImage as uploadSellerMessageChatImage } from './sellerAuthApi';

export function deleteSellerMessageChatMessage(token, userId, messageId) {
  return fetch(
    apiUrl(`/api/seller-auth/message-chat/threads/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`),
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  ).then(parseJson);
}

export function editSellerMessageChatMessage(token, userId, messageId, content) {
  return fetch(
    apiUrl(`/api/seller-auth/message-chat/threads/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`),
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    },
  ).then(parseJson);
}
