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

function buildHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** O'xshash mahsulotlar — productType + productCountry (limit yo'q) */
export function fetchRelatedRecommendations(productId) {
  return fetch(
    apiUrl(`/api/recommendations/related/${Number(productId)}`),
  ).then(parseJsonResponse);
}

/** Tavsiya etamiz — product detail (limit yo'q) */
export function fetchRecommendationsForProduct(productId, token) {
  return fetch(apiUrl(`/api/recommendations/for-product/${Number(productId)}`), {
    headers: buildHeaders(token),
  }).then(parseJsonResponse);
}

/** Tavsiya etamiz — cart, wishlist, profile (limit yo'q) */
export function fetchRecommendationsByHistory(token) {
  return fetch(apiUrl('/api/recommendations/by-history'), {
    headers: buildHeaders(token),
  }).then(parseJsonResponse);
}
