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

export async function fetchFlashSaleRules() {
  const res = await fetch(apiUrl('/api/flash-sale-rules'));
  const data = await parseJson(res);
  return data?.data || null;
}

export async function updateFlashSaleRules(payload) {
  const res = await fetch(apiUrl('/api/flash-sale-rules'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data || null;
}
