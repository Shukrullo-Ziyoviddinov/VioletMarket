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

function normalizeProduct(row = {}) {
  return {
    id: String(row.id || ''),
    shipmentId: String(row.shipmentId || ''),
    title: String(row.title || ''),
    productId: Number(row.productId) || 0,
    color: String(row.color || ''),
    size: String(row.size || ''),
    storage: String(row.storage || ''),
    model: String(row.model || ''),
    quantity: Math.max(1, Number(row.quantity) || 1),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
  };
}

function normalizeItem(row = {}) {
  const products = Array.isArray(row.products)
    ? row.products.map(normalizeProduct)
    : [];
  return {
    id: String(row.id || ''),
    requestCode: String(row.requestCode || ''),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    sellerName: String(row.sellerName || ''),
    sellerCountry: String(row.sellerCountry || ''),
    logisticaCompanyName: String(row.logisticaCompanyName || ''),
    productTitle: String(row.productTitle || ''),
    productId: Number(row.productId) || 0,
    productImage: String(row.productImage || ''),
    productCount: Number(row.productCount) || 0,
    weightKg: Number(row.weightKg) || 0,
    cargoDeliveryFee: Number(row.cargoDeliveryFee) || 0,
    products,
    isGroup: Boolean(row.isGroup) || products.length > 1,
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ''),
    uzArrivalComment: String(row.uzArrivalComment || ''),
    uzArrivedAt: row.uzArrivedAt || null,
    customerPaidAt: row.customerPaidAt || null,
    customerPaymentMethod: row.customerPaymentMethod || null,
    adminConfirmedAt: row.adminConfirmedAt || null,
    logisticaPaidAt: row.logisticaPaidAt || null,
    paymentStatus: row.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    canConfirm: Boolean(row.canConfirm),
  };
}

export async function fetchAdminCargoFeePayments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.filter) params.set('filter', String(filters.filter));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  const path = query
    ? `/api/admin/cargo-fee-payments?${query}`
    : '/api/admin/cargo-fee-payments';
  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    filter: String(data.filter || 'all'),
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 50,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    items: Array.isArray(data.items) ? data.items.map(normalizeItem) : [],
  };
}

export async function confirmAdminCargoFeePayment(shipmentId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/cargo-fee-payments/${encodeURIComponent(shipmentId)}/confirm`,
    ),
    { method: 'POST' },
  );
  const payload = await parseJson(res);
  return {
    alreadyConfirmed: Boolean(payload?.data?.alreadyConfirmed),
    item: normalizeItem(payload?.data?.item || {}),
  };
}
