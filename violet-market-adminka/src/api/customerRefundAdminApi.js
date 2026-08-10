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

function normalizeSeller(row) {
  return {
    id: String(row?.id || ''),
    name: String(row?.name || row?.id || '—'),
    logo: String(row?.logo || ''),
  };
}

function normalizeUnit(row) {
  return {
    id: String(row?.id || ''),
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
  };
}

function normalizeItem(row) {
  const unitsRaw = Array.isArray(row?.units) ? row.units : [];
  const units = unitsRaw.map(normalizeUnit);
  const siblingIds = Array.isArray(row?.siblingIds)
    ? row.siblingIds.map((id) => String(id || '')).filter(Boolean)
    : units.map((unit) => unit.id).filter(Boolean);

  return {
    id: String(row?.id || ''),
    returnedOrderId: String(row?.returnedOrderId || ''),
    orderId: Number(row?.orderId) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    productCodes: Array.isArray(row?.productCodes)
      ? row.productCodes.map((code) => String(code || '')).filter(Boolean)
      : [],
    sellerId: String(row?.sellerId || ''),
    seller: normalizeSeller(row?.seller),
    title: row?.title || { uz: '', ru: '' },
    amount: Number(row?.amount) || 0,
    quantity: Number(row?.quantity) || 1,
    productCount: Number(row?.productCount) || units.length || 1,
    isGroup: Boolean(row?.isGroup) || units.length > 1,
    imageUrl: String(row?.imageUrl || ''),
    color: String(row?.color || ''),
    size: String(row?.size || ''),
    storage: String(row?.storage || ''),
    model: String(row?.model || ''),
    reasonType: String(row?.reasonType || 'return'),
    source: String(row?.source || 'courier'),
    cargoCountry: String(row?.cargoCountry || ''),
    cargoCountryLabel: String(row?.cargoCountryLabel || ''),
    customer: {
      firstName: String(row?.customer?.firstName || ''),
      lastName: String(row?.customer?.lastName || ''),
      phone: String(row?.customer?.phone || ''),
    },
    courier: {
      firstName: String(row?.courier?.firstName || ''),
      lastName: String(row?.courier?.lastName || ''),
      phone: String(row?.courier?.phone || ''),
    },
    status: String(row?.status || 'pending'),
    returnedAt: row?.returnedAt || null,
    refundedAt: row?.refundedAt || null,
    units,
    siblingIds,
  };
}

export async function fetchAdminCustomerRefunds(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.day) params.set('day', String(filters.day));
  if (filters?.week) params.set('week', String(filters.week));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.period) params.set('period', String(filters.period));
  if (filters?.status) params.set('status', String(filters.status));
  if (filters?.search) params.set('search', String(filters.search));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = query
    ? `/api/admin/customer-refunds?${query}`
    : '/api/admin/customer-refunds';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    filters: data.filters || { day: '', week: '', month: '' },
    filterOptions: data.filterOptions || { days: [], weeks: [], months: [] },
    activePeriod: String(data.activePeriod || 'day'),
    status: String(data.status || 'pending'),
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 50,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    counts: {
      pending: Number(data.counts?.pending) || 0,
      refunded: Number(data.counts?.refunded) || 0,
    },
    items: Array.isArray(data.items) ? data.items.map(normalizeItem) : [],
  };
}

export async function confirmAdminCustomerRefund(id) {
  const res = await fetch(apiUrl(`/api/admin/customer-refunds/${id}/confirm`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return normalizeItem(payload?.data || {});
}
