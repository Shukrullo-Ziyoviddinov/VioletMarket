import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'So‘rov xatosi');
    err.status = res.status;
    err.code = data.code;
    err.details = data.details;
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

export function fetchCart(token) {
  return fetch(apiUrl('/api/cart'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function addCartItem(token, payload) {
  return fetch(apiUrl('/api/cart/add'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseJsonResponse);
}

export function updateCartItemQuantity(token, itemId, change) {
  return fetch(apiUrl(`/api/cart/items/${itemId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ change }),
  }).then(parseJsonResponse);
}

export function removeCartItem(token, itemId) {
  return fetch(apiUrl(`/api/cart/items/${itemId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function dismissCartUrgency(token, itemId) {
  return fetch(apiUrl(`/api/cart/items/${itemId}/urgency-dismiss`), {
    method: 'POST',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function clearCartApi(token) {
  return fetch(apiUrl('/api/cart'), {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function checkoutCartApi(token, { paymentMethod, deliveryAddress } = {}) {
  const method = String(paymentMethod || '').trim();
  if (!method) {
    return Promise.reject(Object.assign(new Error('To‘lov usulini tanlang'), { status: 400 }));
  }

  return fetch(apiUrl('/api/cart/checkout'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      paymentMethod: method,
      deliveryAddress: deliveryAddress || null,
    }),
  }).then(parseJsonResponse);
}
