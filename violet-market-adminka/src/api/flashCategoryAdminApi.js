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

export async function fetchFlashCategoryOptions() {
  const res = await fetch(apiUrl('/api/admin/flash-category/options'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.options) ? data.data.options : [];
}

export async function fetchFlashCategorySellers() {
  const res = await fetch(apiUrl('/api/admin/flash-category/sellers'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.sellers) ? data.data.sellers : [];
}

export async function fetchFlashCategorySellerProducts(sellerId) {
  const res = await fetch(
    apiUrl(`/api/admin/flash-category/sellers/${encodeURIComponent(sellerId)}/products`),
  );
  const data = await parseJson(res);
  return Array.isArray(data?.data?.products) ? data.data.products : [];
}

export async function fetchFlashCategoryProducts() {
  const res = await fetch(apiUrl('/api/admin/flash-category/products'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.products) ? data.data.products : [];
}

export async function assignFlashCategoryProduct(payload) {
  const res = await fetch(apiUrl('/api/admin/flash-category/assign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data?.product || null;
}

export async function removeFlashCategoryProduct(productId) {
  const res = await fetch(
    apiUrl(`/api/admin/flash-category/products/${encodeURIComponent(productId)}/remove`),
    { method: 'PATCH' },
  );
  const data = await parseJson(res);
  return data?.data || null;
}
