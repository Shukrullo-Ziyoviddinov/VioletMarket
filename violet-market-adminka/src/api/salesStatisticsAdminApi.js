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

function normalizeMetric(metric) {
  return {
    title: String(metric?.title || ''),
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

export async function fetchSalesStatistics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));

  const query = params.toString();
  const path = query
    ? `/api/admin/sales/statistics?${query}`
    : '/api/admin/sales/statistics';

  const res = await fetch(apiUrl(path));
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

export async function fetchSalesRevenueChart(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.granularity) params.set('granularity', String(filters.granularity));

  const query = params.toString();
  const path = query
    ? `/api/admin/sales/revenue-chart?${query}`
    : '/api/admin/sales/revenue-chart';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    granularity: String(data?.granularity || 'day'),
    overallTone: String(data?.overallTone || 'neutral'),
    points: Array.isArray(data?.points) ? data.points.map(normalizeChartPoint) : [],
  };
}

function normalizeTopSeller(row) {
  return {
    rank: Number(row?.rank) || 0,
    sellerId: String(row?.sellerId || ''),
    name: String(row?.name || ''),
    logo: String(row?.logo || ''),
    status: String(row?.status || ''),
    totalAmount: Number(row?.totalAmount) || 0,
    totalQuantity: Number(row?.totalQuantity) || 0,
    orderCount: Number(row?.orderCount) || 0,
  };
}

export async function fetchTopSellersStatistics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));

  const query = params.toString();
  const path = query
    ? `/api/admin/sales/top-sellers?${query}`
    : '/api/admin/sales/top-sellers';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    period: String(data?.period || 'day'),
    periodLabel: String(data?.periodLabel || 'Kunlik'),
    sellers: Array.isArray(data?.sellers) ? data.sellers.map(normalizeTopSeller) : [],
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

export async function fetchTopSellingProductsStatistics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));

  const query = params.toString();
  const path = query
    ? `/api/admin/sales/top-selling-products?${query}`
    : '/api/admin/sales/top-selling-products';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    period: String(data?.period || 'day'),
    periodLabel: String(data?.periodLabel || 'Kunlik'),
    products: Array.isArray(data?.products) ? data.products.map(normalizeTopProduct) : [],
  };
}

function normalizeSellerSoldProductsPayload(data) {
  const seller = data?.seller || {};
  return {
    periodLabel: String(data?.periodLabel || 'Barcha davr'),
    seller: {
      sellerId: String(seller?.sellerId || ''),
      name: String(seller?.name || ''),
      logo: String(seller?.logo || ''),
      totalAmount: Number(seller?.totalAmount) || 0,
      totalQuantity: Number(seller?.totalQuantity) || 0,
      orderCount: Number(seller?.orderCount) || 0,
    },
    products: Array.isArray(data?.products) ? data.products.map(normalizeSoldProduct) : [],
  };
}

function normalizeSoldProduct(row) {
  return {
    rank: Number(row?.rank) || 0,
    productId: Number(row?.productId) || 0,
    title: row?.title ?? '',
    image: String(row?.image || ''),
    totalAmount: Number(row?.totalAmount) || 0,
    totalQuantity: Number(row?.totalQuantity) || 0,
    orderCount: Number(row?.orderCount) || 0,
    remainingQuantity: row?.remainingQuantity == null ? null : Number(row.remainingQuantity) || 0,
    statusKey: String(row?.statusKey || 'active'),
    statusLabel: String(row?.statusLabel || 'Aktiv'),
  };
}

export async function fetchSellerSoldProductsStatistics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.sellerId) params.set('sellerId', String(filters.sellerId));

  const query = params.toString();
  const path = query
    ? `/api/admin/sales/seller-sold-products?${query}`
    : '/api/admin/sales/seller-sold-products';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  return normalizeSellerSoldProductsPayload(payload?.data || {});
}
