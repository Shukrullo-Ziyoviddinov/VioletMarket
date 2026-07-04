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

function normalizeMetric(metric) {
  return {
    value: Number(metric?.value) || 0,
    growthFormatted: String(metric?.growthFormatted || '0%'),
    tone: String(metric?.tone || 'neutral'),
  };
}

function normalizeChartPoint(point) {
  return {
    key: String(point?.key || ''),
    label: String(point?.label || ''),
    tooltipLabel: String(point?.tooltipLabel || point?.label || ''),
    revenue: Number(point?.revenue) || 0,
    previousRevenue: point?.previousRevenue == null ? null : Number(point.previousRevenue) || 0,
    growthPercent: Number(point?.growthPercent) || 0,
    tone: String(point?.tone || 'neutral'),
  };
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
    metrics: {
      daily: normalizeMetric(data?.metrics?.daily),
      weekly: normalizeMetric(data?.metrics?.weekly),
      monthly: normalizeMetric(data?.metrics?.monthly),
    },
  };
}

export async function fetchSellerSalesRevenueChart(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.granularity) params.set('granularity', String(filters.granularity));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/sales/revenue-chart?${query}`
    : '/api/seller-auth/sales/revenue-chart';

  const res = await fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    granularity: String(data?.granularity || 'day'),
    overallTone: String(data?.overallTone || 'neutral'),
    points: Array.isArray(data?.points) ? data.points.map(normalizeChartPoint) : [],
  };
}

function normalizeTopProduct(row) {
  return {
    rank: Number(row?.rank) || 0,
    productId: Number(row?.productId) || 0,
    title: row?.title ?? '',
    image: String(row?.image || ''),
    totalAmount: Number(row?.totalAmount) || 0,
    totalQuantity: Number(row?.totalQuantity) || 0,
    orderCount: Number(row?.orderCount) || 0,
  };
}

export async function fetchSellerTopSellingProducts(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/sales/top-selling-products?${query}`
    : '/api/seller-auth/sales/top-selling-products';

  const res = await fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    period: String(data?.period || 'day'),
    periodLabel: String(data?.periodLabel || ''),
    products: Array.isArray(data?.products) ? data.products.map(normalizeTopProduct) : [],
  };
}

function normalizeCategoryStat(row) {
  return {
    category: String(row?.category || ''),
    quantity: Number(row?.quantity) || 0,
    percentage: Number(row?.percentage) || 0,
    color: String(row?.color || '#3b82f6'),
  };
}

export async function fetchSellerCategorySalesStatistics(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/sales/category-statistics?${query}`
    : '/api/seller-auth/sales/category-statistics';

  const res = await fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    period: String(data?.period || 'day'),
    periodLabel: String(data?.periodLabel || ''),
    scopeLabel: String(data?.scopeLabel || ''),
    totalQuantity: Number(data?.totalQuantity) || 0,
    categories: Array.isArray(data?.categories) ? data.categories.map(normalizeCategoryStat) : [],
  };
}
