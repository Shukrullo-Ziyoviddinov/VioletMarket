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

export function fetchCollectionProducts(categoryName, { page = 1, limit = 8, sort = 'default' } = {}) {
  const name = encodeURIComponent(String(categoryName ?? '').trim());
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: String(sort),
  });
  return fetch(apiUrl(`/api/collections/${name}/products?${params}`)).then(parseJsonResponse);
}
