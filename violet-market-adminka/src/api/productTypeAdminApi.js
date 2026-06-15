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

export async function fetchProductTypes() {
  const res = await fetch(apiUrl('/api/admin/product-types'));
  const data = await parseJson(res);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createProductType(payload) {
  const res = await fetch(apiUrl('/api/admin/product-types'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateProductType(productTypeId, payload) {
  const res = await fetch(apiUrl(`/api/admin/product-types/${productTypeId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteProductType(productTypeId) {
  const res = await fetch(apiUrl(`/api/admin/product-types/${productTypeId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
