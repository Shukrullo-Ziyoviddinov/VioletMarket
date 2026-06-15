import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchProductStats() {
  const res = await fetch(apiUrl('/api/admin/products/stats'));
  const data = await parseJson(res);
  return {
    total: Number(data?.data?.total) || 0,
    addedToday: Number(data?.data?.addedToday) || 0,
  };
}

export async function fetchAdminProducts() {
  const res = await fetch(apiUrl('/api/admin/products'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.products) ? data.data.products : [];
}
