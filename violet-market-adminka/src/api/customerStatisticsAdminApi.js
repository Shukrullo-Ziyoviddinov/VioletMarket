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

export async function fetchCustomerDashboardStats() {
  const res = await fetch(apiUrl('/api/admin/customers/dashboard-stats'));
  const payload = await parseJson(res);
  return {
    monthlyVisitors: Number(payload?.data?.monthlyVisitors) || 0,
    todayVisitors: Number(payload?.data?.todayVisitors) || 0,
  };
}

export async function fetchCustomerStatistics(filters) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));

  const query = params.toString();
  const path = query
    ? `/api/admin/customers/statistics?${query}`
    : '/api/admin/customers/statistics';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  return payload?.data || null;
}
