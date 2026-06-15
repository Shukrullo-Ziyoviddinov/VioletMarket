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

export async function fetchAdminProductById(productId) {
  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(productId)}`));
  const data = await parseJson(res);
  return data?.data?.product || null;
}

export async function fetchProductPickerOptions(forProductId) {
  if (forProductId == null) return [];
  const res = await fetch(
    apiUrl(`/api/admin/products/picker?forProductId=${encodeURIComponent(forProductId)}`),
  );
  const data = await parseJson(res);
  return Array.isArray(data?.data?.options) ? data.data.options : [];
}

export async function updateAdminProduct(productId, payload) {
  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(productId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data?.product || null;
}

export async function deleteAdminProduct(productId) {
  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(productId)}`), {
    method: 'DELETE',
  });
  const data = await parseJson(res);
  return data?.data || null;
}

export async function setAdminProductClientActive(productId, clientActive) {
  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(productId)}/client-active`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientActive: Boolean(clientActive) }),
    },
  );
  const data = await parseJson(res);
  return data?.data || null;
}
