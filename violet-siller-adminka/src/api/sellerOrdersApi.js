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
    itemIndex: Number(row?.itemIndex) || 0,
    orderCode: String(row?.orderCode || ''),
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || row?.image || ''),
    color: String(row?.color || ''),
    size: String(row?.size || ''),
    storage: String(row?.storage || ''),
    model: String(row?.model || ''),
    orderedAt: row?.orderedAt || '',
    buyer: {
      firstName: String(row?.buyer?.firstName || row?.customer?.firstName || ''),
      lastName: String(row?.buyer?.lastName || row?.customer?.lastName || ''),
      phone: String(row?.buyer?.phone || row?.customer?.phone || ''),
    },
    customer: {
      firstName: String(row?.customer?.firstName || row?.buyer?.firstName || ''),
      lastName: String(row?.customer?.lastName || row?.buyer?.lastName || ''),
      phone: String(row?.customer?.phone || row?.buyer?.phone || ''),
    },
    paymentMethod: String(row?.paymentMethod || 'mock'),
    status: String(row?.status || 'paid'),
    amount: Number(row?.amount) || 0,
    originalPrice: Number(row?.originalPrice) || 0,
    quantity: Number(row?.quantity) || 1,
    trackingStatus: String(row?.trackingStatus || 'accepted'),
    confirmedAt: row?.confirmedAt || null,
    handedToCourierAt: row?.handedToCourierAt || null,
    unitIndex: Number(row?.unitIndex) || 0,
    courierAccepted: Boolean(row?.courierAccepted),
    courier: row?.courier
      ? {
          firstName: String(row.courier.firstName || ''),
          lastName: String(row.courier.lastName || ''),
          phone: String(row.courier.phone || ''),
          email: String(row.courier.email || ''),
        }
      : null,
    acceptedAt: row?.acceptedAt || null,
    assignmentId: row?.assignmentId ? String(row.assignmentId) : null,
    reasonType: String(row?.reasonType || ''),
    comment: String(row?.comment || ''),
    returnedAt: row?.returnedAt || null,
    noAnswerAt: row?.noAnswerAt || row?.returnedAt || null,
  };
}

export async function fetchSellerOrders(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.trackingStatus) {
    params.set('trackingStatus', String(filters.trackingStatus));
  }

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

export async function confirmSellerOrderItem(token, orderId, itemIndex) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/confirm`),
    {
      method: 'PATCH',
      headers: authHeaders(token),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function collectSellerOrderItem(token, orderId, itemIndex) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/collect`),
    {
      method: 'PATCH',
      headers: authHeaders(token),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function handoffSellerOrderItem(token, orderId, itemIndex) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/handoff`),
    {
      method: 'PATCH',
      headers: authHeaders(token),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

async function postNoAnswerAction(token, returnedOrderId, action) {
  const res = await fetch(
    apiUrl(
      `/api/seller-auth/orders/no-answer/${encodeURIComponent(returnedOrderId)}/${action}`,
    ),
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export function reHandoffSellerNoAnswerOrder(token, returnedOrderId) {
  return postNoAnswerAction(token, returnedOrderId, 're-handoff');
}

export function reactivateSellerNoAnswerOrder(token, returnedOrderId) {
  return postNoAnswerAction(token, returnedOrderId, 'reactivate');
}

export function deliverSellerNoAnswerOrder(token, returnedOrderId) {
  return postNoAnswerAction(token, returnedOrderId, 'deliver');
}
