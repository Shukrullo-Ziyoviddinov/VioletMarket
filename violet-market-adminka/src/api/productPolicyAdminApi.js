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

export async function fetchProductPolicyBlocks() {
  const res = await fetch(apiUrl('/api/admin/product-policy'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.blocks) ? data.data.blocks : [];
}

export async function createProductPolicyBlock(payload) {
  const res = await fetch(apiUrl('/api/admin/product-policy'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateProductPolicyBlock(order, payload) {
  const res = await fetch(apiUrl(`/api/admin/product-policy/${order}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteProductPolicyBlock(order) {
  const res = await fetch(apiUrl(`/api/admin/product-policy/${order}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
