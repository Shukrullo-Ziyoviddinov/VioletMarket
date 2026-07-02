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

export async function fetchSalesDashboardStats() {
  const res = await fetch(apiUrl('/api/admin/sales/dashboard-stats'));
  const payload = await parseJson(res);
  return {
    monthlyRevenue: Number(payload?.data?.monthlyRevenue) || 0,
    previousMonthlyRevenue: Number(payload?.data?.previousMonthlyRevenue) || 0,
    monthlyGrowthPercent: Number(payload?.data?.monthlyGrowthPercent) || 0,
    monthlyGrowthFormatted: String(payload?.data?.monthlyGrowthFormatted || '0%'),
    monthlyGrowthTone: String(payload?.data?.monthlyGrowthTone || 'neutral'),
    month: String(payload?.data?.month || ''),
  };
}
