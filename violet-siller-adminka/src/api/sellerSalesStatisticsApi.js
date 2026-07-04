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

export async function fetchSellerSalesStatistics(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/sales/statistics?${query}`
    : '/api/seller-auth/sales/statistics';

  const res = await fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    filters: {
      day: String(data?.filters?.day || ''),
      week: String(data?.filters?.week || ''),
      month: String(data?.filters?.month || ''),
    },
    filterOptions: {
      days: Array.isArray(data?.filterOptions?.days) ? data.filterOptions.days : [],
      weeks: Array.isArray(data?.filterOptions?.weeks) ? data.filterOptions.weeks : [],
      months: Array.isArray(data?.filterOptions?.months) ? data.filterOptions.months : [],
    },
    totalRevenue: Number(data?.totalRevenue) || 0,
  };
}
