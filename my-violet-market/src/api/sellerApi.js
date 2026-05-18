import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || res.statusText || 'So‘rov xatosi');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

function optionalAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function fetchSellerProfile(sellerId, token) {
  const id = encodeURIComponent(String(sellerId ?? '').trim());
  return fetch(apiUrl(`/api/sellers/${id}/profile`), {
    headers: optionalAuthHeaders(token),
  }).then(parseJsonResponse);
}

export function fetchSellerProducts(sellerId, { page = 1, limit = 8, sort = 'default' } = {}, token) {
  const id = encodeURIComponent(String(sellerId ?? '').trim());
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: String(sort),
  });
  return fetch(apiUrl(`/api/sellers/${id}/products?${params}`), {
    headers: optionalAuthHeaders(token),
  }).then(parseJsonResponse);
}
