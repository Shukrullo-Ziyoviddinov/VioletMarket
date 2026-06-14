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

export async function fetchUzWarehouseData() {
  const res = await fetch(apiUrl('/api/admin/uz-warehouse'));
  const data = await parseJson(res);
  return data?.data || {};
}

export async function updateUzWarehouseData(payload) {
  const res = await fetch(apiUrl('/api/admin/uz-warehouse'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data || {};
}
