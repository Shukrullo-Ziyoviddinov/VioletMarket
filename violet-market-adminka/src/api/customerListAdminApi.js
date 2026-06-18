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

export async function fetchRegisteredCustomers() {
  const res = await fetch(apiUrl('/api/admin/customers/registered'));
  const payload = await parseJson(res);

  return {
    customers: Array.isArray(payload?.data?.customers) ? payload.data.customers : [],
    total: Number(payload?.data?.total) || 0,
  };
}
