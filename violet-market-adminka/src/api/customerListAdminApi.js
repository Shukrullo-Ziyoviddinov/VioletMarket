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

export async function fetchRegisteredCustomers(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.month) params.set('month', String(filters.month));

  const query = params.toString();
  const path = query
    ? `/api/admin/customers/registered?${query}`
    : '/api/admin/customers/registered';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);

  return {
    customers: Array.isArray(payload?.data?.customers) ? payload.data.customers : [],
    total: Number(payload?.data?.total) || 0,
  };
}
