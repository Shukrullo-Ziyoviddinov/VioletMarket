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

export async function fetchPendingProducts() {
  const res = await fetch(apiUrl('/api/admin/products/pending'));
  const payload = await parseJson(res);
  return Array.isArray(payload?.data?.pending) ? payload.data.pending : [];
}

export async function approvePendingProduct(productId, cargoExpressPolicy) {
  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(productId)}/approve`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cargoExpressPolicy }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || null;
}

export async function rejectPendingProduct(productId, reason = '') {
  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(productId)}/reject`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || null;
}
