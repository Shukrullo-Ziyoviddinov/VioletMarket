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

export function fetchProductComments(productId) {
  return fetch(apiUrl(`/api/products/${productId}/comments`)).then(parseJsonResponse);
}

export function createComment(token, payload) {
  return fetch(apiUrl('/api/comments'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseJsonResponse);
}
