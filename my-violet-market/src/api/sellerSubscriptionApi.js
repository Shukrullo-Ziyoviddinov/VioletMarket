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

function optionalAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function fetchMySellerSubscriptions(token) {
  return fetch(apiUrl('/api/seller-subscriptions/me'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function fetchSellerSubscriptionStatus(sellerId, token) {
  const id = encodeURIComponent(String(sellerId ?? '').trim());
  return fetch(apiUrl(`/api/seller-subscriptions/seller/${id}`), {
    headers: optionalAuthHeaders(token),
  }).then(parseJsonResponse);
}

export function toggleSellerSubscription(token, sellerId) {
  return fetch(apiUrl('/api/seller-subscriptions/toggle'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ sellerId: String(sellerId ?? '').trim() }),
  }).then(parseJsonResponse);
}
