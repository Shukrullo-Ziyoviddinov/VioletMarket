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

function buildHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function searchProducts(query, limit, token) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (limit) params.set('limit', String(limit));
  return fetch(apiUrl(`/api/search?${params}`), {
    headers: buildHeaders(token),
  }).then(parseJsonResponse);
}

export function searchSuggestions(query, limit = 5, token) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));
  return fetch(apiUrl(`/api/search/suggestions?${params}`), {
    headers: buildHeaders(token),
  }).then(parseJsonResponse);
}

export function fetchSearchHistory(token) {
  return fetch(apiUrl('/api/search/history'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function addSearchHistoryQuery(token, query) {
  return fetch(apiUrl('/api/search/history/query'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ query }),
  }).then(parseJsonResponse);
}

export function removeSearchHistoryQuery(token, query) {
  return fetch(apiUrl('/api/search/history/query'), {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ query }),
  }).then(parseJsonResponse);
}

export function fetchSearchRecommended(token) {
  return fetch(apiUrl('/api/search/recommended'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function fetchSearchRecommendedDefault() {
  return fetch(apiUrl('/api/search/recommended-default')).then(parseJsonResponse);
}
