import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchSellerProductFormOptions(token) {
  const res = await fetch(apiUrl('/api/seller-auth/product-form/options'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJson(res);
  return data?.data;
}
