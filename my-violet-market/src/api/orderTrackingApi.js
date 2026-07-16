import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || res.statusText || 'So‘rov xatosi');
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

function normalizeStep(row) {
  return {
    status: String(row?.status || 'accepted'),
    state: String(row?.state || 'upcoming'),
    occurredAt: row?.occurredAt || null,
  };
}

function normalizeOrderItem(row) {
  return {
    id: String(row?.id || ''),
    orderId: Number(row?.orderId) || 0,
    orderCode: String(row?.orderCode || ''),
    productId: Number(row?.productId) || 0,
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    price: Number(row?.price) || 0,
    originalPrice: Number(row?.originalPrice) || 0,
    quantity: Number(row?.quantity) || 1,
    lineTotal: Number(row?.lineTotal) || 0,
    color: String(row?.color || ''),
    size: String(row?.size || ''),
    storage: String(row?.storage || ''),
    model: String(row?.model || ''),
    seller: {
      id: String(row?.seller?.id || ''),
      name: row?.seller?.name || { uz: '', ru: '' },
      country: String(row?.seller?.country || ''),
    },
    paymentMethod: String(row?.paymentMethod || ''),
    orderedAt: row?.orderedAt || '',
    trackingStatus: String(row?.trackingStatus || 'accepted'),
    steps: Array.isArray(row?.steps) ? row.steps.map(normalizeStep) : [],
  };
}

function normalizeDeliveredOrderItem(row) {
  return {
    id: String(row?.id || ''),
    orderId: Number(row?.orderId) || 0,
    orderCode: String(row?.orderCode || ''),
    trackingCode: String(row?.trackingCode || ''),
    productId: Number(row?.productId) || 0,
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    price: Number(row?.price) || 0,
    quantity: Number(row?.quantity) || 1,
    lineTotal: Number(row?.lineTotal) || 0,
    color: String(row?.color || ''),
    size: String(row?.size || ''),
    storage: String(row?.storage || ''),
    model: String(row?.model || ''),
    deliveredAt: row?.deliveredAt || null,
  };
}

export async function fetchMyUzbOrderTracking(token) {
  const res = await fetch(apiUrl('/api/orders/my/uzb'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await parseJsonResponse(res);
  const inProgressItems = Array.isArray(payload?.data?.inProgressItems)
    ? payload.data.inProgressItems
    : Array.isArray(payload?.data?.items)
      ? payload.data.items
      : [];
  const deliveredItems = Array.isArray(payload?.data?.deliveredItems)
    ? payload.data.deliveredItems
    : [];

  return {
    inProgressItems: inProgressItems.map(normalizeOrderItem),
    deliveredItems: deliveredItems.map(normalizeDeliveredOrderItem),
  };
}
