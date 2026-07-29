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
    pipelineMode: String(row?.pipelineMode || 'local') === 'foreign' ? 'foreign' : 'local',
    paymentMethod: String(row?.paymentMethod || ''),
    orderedAt: row?.orderedAt || '',
    trackingStatus: String(row?.trackingStatus || 'accepted'),
    steps: Array.isArray(row?.steps) ? row.steps.map(normalizeStep) : [],
    cargoShipmentId: row?.cargoShipmentId ? String(row.cargoShipmentId) : null,
    cargoFeePayment: row?.cargoFeePayment
      ? {
          ready: Boolean(row.cargoFeePayment.ready),
          weightKg: Number(row.cargoFeePayment.weightKg) || 0,
          cargoDeliveryFee: Number(row.cargoFeePayment.cargoDeliveryFee) || 0,
          uzArrivalPhotoUrl: String(row.cargoFeePayment.uzArrivalPhotoUrl || ''),
          uzArrivalComment: String(row.cargoFeePayment.uzArrivalComment || ''),
          uzArrivedAt: row.cargoFeePayment.uzArrivedAt || null,
          customerPaidAt: row.cargoFeePayment.customerPaidAt || null,
          customerPaymentMethod: row.cargoFeePayment.customerPaymentMethod || null,
          adminConfirmedAt: row.cargoFeePayment.adminConfirmedAt || null,
          logisticaPaidAt: row.cargoFeePayment.logisticaPaidAt || null,
          canCustomerPay: Boolean(row.cargoFeePayment.canCustomerPay),
        }
      : null,
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
