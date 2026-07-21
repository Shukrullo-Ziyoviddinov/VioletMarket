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

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeReturnedOrder(row) {
  return {
    id: String(row?.id || ''),
    assignmentId: String(row?.assignmentId || ''),
    orderId: Number(row?.orderId) || 0,
    itemIndex: Number(row?.itemIndex) || 0,
    unitIndex: Number(row?.unitIndex) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    amount: Number(row?.amount) || 0,
    quantity: Number(row?.quantity) || 1,
    imageUrl: String(row?.imageUrl || ''),
    color: String(row?.color || ''),
    size: String(row?.size || ''),
    storage: String(row?.storage || ''),
    model: String(row?.model || ''),
    customer: {
      firstName: String(row?.customer?.firstName || ''),
      lastName: String(row?.customer?.lastName || ''),
      phone: String(row?.customer?.phone || ''),
    },
    courier: {
      firstName: String(row?.courier?.firstName || ''),
      lastName: String(row?.courier?.lastName || ''),
      phone: String(row?.courier?.phone || ''),
      email: String(row?.courier?.email || ''),
    },
    reasonType: String(row?.reasonType || 'return'),
    comment: String(row?.comment || ''),
    orderedAt: row?.orderedAt || null,
    returnedAt: row?.returnedAt || null,
    isPaid: Boolean(row?.isPaid),
  };
}

const EMPTY_STATS = {
  totalCount: 0,
  totalAmount: 0,
  totalQuantity: 0,
  noAnswerCount: 0,
  returnCount: 0,
};

export async function fetchSellerReturnedOrders(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/returned-orders?${query}`
    : '/api/seller-auth/returned-orders';

  const res = await fetch(apiUrl(path), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    filters: data.filters || { day: '', week: '', month: '' },
    filterOptions: data.filterOptions || { days: [], weeks: [], months: [] },
    activePeriod: String(data.activePeriod || 'day'),
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 50,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    stats: {
      allTime: data.stats?.allTime || EMPTY_STATS,
      period: data.stats?.period || EMPTY_STATS,
      day: data.stats?.day || EMPTY_STATS,
      week: data.stats?.week || EMPTY_STATS,
      month: data.stats?.month || EMPTY_STATS,
    },
    orders: Array.isArray(data.orders) ? data.orders.map(normalizeReturnedOrder) : [],
  };
}
