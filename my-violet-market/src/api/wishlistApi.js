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

export function fetchWishlist(token) {
  return fetch(apiUrl('/api/wishlist'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function toggleWishlistItem(token, productId) {
  return fetch(apiUrl('/api/wishlist/toggle'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId: Number(productId) }),
  }).then(parseJsonResponse);
}
