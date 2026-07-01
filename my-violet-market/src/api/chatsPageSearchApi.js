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

export function fetchChatsPageSellerSearch(query, limit = 20) {
  const params = new URLSearchParams();
  params.set('q', String(query || '').trim());
  if (limit) params.set('limit', String(limit));

  return fetch(apiUrl(`/api/chats-page/seller-search?${params.toString()}`)).then(
    parseJsonResponse,
  );
}
