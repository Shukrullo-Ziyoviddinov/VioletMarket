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

function normalizeOrder(row) {
  return {
    id: String(row?.id || ''),
    orderId: Number(row?.orderId) || 0,
    orderCode: String(row?.orderCode || ''),
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    image: String(row?.image || ''),
    orderedAt: row?.orderedAt || '',
    buyer: {
      firstName: String(row?.buyer?.firstName || ''),
      lastName: String(row?.buyer?.lastName || ''),
      phone: String(row?.buyer?.phone || ''),
    },
    paymentMethod: String(row?.paymentMethod || 'mock'),
    status: String(row?.status || 'paid'),
    amount: Number(row?.amount) || 0,
    originalPrice: Number(row?.originalPrice) || 0,
    quantity: Number(row?.quantity) || 1,
  };
}

export async function fetchSellerOrders(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = query ? `/api/seller-auth/orders?${query}` : '/api/seller-auth/orders';

  const res = await fetch(apiUrl(path), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || 20,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
    orders: Array.isArray(data?.orders) ? data.orders.map(normalizeOrder) : [],
  };
}
