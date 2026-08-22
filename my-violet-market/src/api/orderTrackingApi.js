import { apiUrl } from '../config/api';
import { resolveTrackingCargoServiceType } from '../utils/cargoExpressPolicy';

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

function normalizeProductLine(row) {
  return {
    id: String(row?.id || ''),
    itemIndex: Number(row?.itemIndex) || 0,
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
    trackingStatus: String(row?.trackingStatus || 'accepted'),
    cargoShipmentId: row?.cargoShipmentId ? String(row.cargoShipmentId) : null,
    weightKg: Math.max(0, Number(row?.weightKg) || 0),
    uzArrivalComment: String(row?.uzArrivalComment || '').trim(),
    uzArrivalPhotoUrl: String(row?.uzArrivalPhotoUrl || '').trim(),
  };
}

function normalizeCargoFeePayment(row) {
  if (!row) return null;
  return {
    ready: Boolean(row.ready),
    paymentRequired: Boolean(row.paymentRequired),
    weightKg: Number(row.weightKg) || 0,
    cargoDeliveryFee: Number(row.cargoDeliveryFee) || 0,
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ''),
    uzArrivalComment: String(row.uzArrivalComment || ''),
    uzArrivedAt: row.uzArrivedAt || null,
    customerPaidAt: row.customerPaidAt || null,
    customerPaymentMethod: row.customerPaymentMethod || null,
    adminConfirmedAt: row.adminConfirmedAt || null,
    logisticaPaidAt: row.logisticaPaidAt || null,
    canCustomerPay: Boolean(row.canCustomerPay),
  };
}

function normalizeOrderItem(row) {
  const products = Array.isArray(row?.products)
    ? row.products.map(normalizeProductLine)
    : [];

  return {
    id: String(row?.id || ''),
    isGroup: Boolean(row?.isGroup) || products.length > 1,
    groupKey: String(row?.groupKey || ''),
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
    pipelineMode: String(row?.pipelineMode || 'local') === 'foreign' ? 'foreign' : 'local',
    paymentMethod: String(row?.paymentMethod || ''),
    orderedAt: row?.orderedAt || '',
    trackingStatus: String(row?.trackingStatus || 'accepted'),
    steps: Array.isArray(row?.steps) ? row.steps.map(normalizeStep) : [],
    products,
    cargoShipmentId: row?.cargoShipmentId ? String(row.cargoShipmentId) : null,
    cargoFeePayment: normalizeCargoFeePayment(row?.cargoFeePayment),
    cargoServiceType: resolveTrackingCargoServiceType(
      row?.pipelineMode,
      row?.cargoServiceType,
    ),
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

export async function fetchMyOrderTracking(token) {
  const res = await fetch(apiUrl('/api/orders/my'), {
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

/** @deprecated Prefer fetchMyOrderTracking — UZB + foreign */
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

export async function payMyCargoFee(token, shipmentId, paymentMethod) {
  const res = await fetch(
    apiUrl(`/api/orders/my/cargo-fee/${encodeURIComponent(shipmentId)}/pay`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod }),
    },
  );
  const payload = await parseJsonResponse(res);
  return {
    alreadyPaid: Boolean(payload?.data?.alreadyPaid),
    detail: payload?.data?.detail || null,
  };
}
