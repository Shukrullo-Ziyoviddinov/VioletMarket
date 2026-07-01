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

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function fetchChatsPageSearchHistory(token) {
  return fetch(apiUrl('/api/chats-page/search-history'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function addChatsPageSearchHistorySeller(token, sellerId) {
  return fetch(apiUrl('/api/chats-page/search-history'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ sellerId }),
  }).then(parseJsonResponse);
}

export function removeChatsPageSearchHistorySeller(token, sellerId) {
  return fetch(apiUrl(`/api/chats-page/search-history/${encodeURIComponent(sellerId)}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}
