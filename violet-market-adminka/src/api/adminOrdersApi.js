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

function normalizeSeller(seller, sellerId) {
  return {
    id: String(seller?.id || sellerId || ''),
    name: String(seller?.name || sellerId || 'Noma’lum siller'),
    logo: String(seller?.logo || ''),
    sellerCountry: String(seller?.sellerCountry || ''),
    status: String(seller?.status || ''),
  };
}

function normalizeOrder(row) {
  const sellerId = String(row?.sellerId || row?.seller?.id || '');
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
    groupKey: String(row?.groupKey || ''),
    groupSize: Number(row?.groupSize) || 0,
    groupItemCount: Number(row?.groupItemCount) || 0,
    siblingIds: Array.isArray(row?.siblingIds)
      ? row.siblingIds.map((id) => String(id))
      : [],
    visibleGroupSize: Number(row?.visibleGroupSize) || 0,
    visibleSiblingIds: Array.isArray(row?.visibleSiblingIds)
      ? row.visibleSiblingIds.map((id) => String(id))
      : [],
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
    sellerId,
    seller: normalizeSeller(row?.seller, sellerId),
  };
}

export async function fetchAdminOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.trackingStatus) {
    params.set('trackingStatus', String(filters.trackingStatus));
  }
  if (filters?.pipeline) {
    params.set('pipeline', String(filters.pipeline));
  }
  if (filters?.uzWarehouseReady) {
    params.set('uzWarehouseReady', '1');
  }

  const query = params.toString();
  const path = query ? `/api/admin/orders?${query}` : '/api/admin/orders';

  const res = await fetch(apiUrl(path));
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

async function patchOrderItem(action, orderId, itemIndex, sellerId, extra = {}) {
  const res = await fetch(
    apiUrl(`/api/admin/orders/${Number(orderId)}/items/${Number(itemIndex)}/${action}`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: String(sellerId || ''),
        ...(extra && typeof extra === 'object' ? extra : {}),
      }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export function confirmAdminOrderItem(orderId, itemIndex, sellerId) {
  return patchOrderItem('confirm', orderId, itemIndex, sellerId);
}

export function collectAdminOrderItem(orderId, itemIndex, sellerId) {
  return patchOrderItem('collect', orderId, itemIndex, sellerId);
}

export function handoffAdminOrderItem(orderId, itemIndex, sellerId, pickup = null) {
  const extra =
    pickup && typeof pickup === 'object'
      ? {
          uzWarehousePickup: {
            address: String(pickup.address || '').trim(),
            coordinates: Array.isArray(pickup.coordinates)
              ? pickup.coordinates
              : undefined,
            phone: String(pickup.phone || '').trim() || undefined,
            label: String(pickup.label || 'Toshkent ombori').trim(),
          },
        }
      : {};
  return patchOrderItem('handoff', orderId, itemIndex, sellerId, extra);
}

async function patchOrderGroup(action, orderId, sellerId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/admin/orders/${Number(orderId)}/${action}-group`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: String(sellerId || ''),
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
        ...(body.note ? { note: String(body.note) } : {}),
        ...(body.uzWarehousePickup
          ? { uzWarehousePickup: body.uzWarehousePickup }
          : {}),
      }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export function confirmAdminOrderGroup(orderId, sellerId, body = {}) {
  return patchOrderGroup('confirm', orderId, sellerId, body);
}

export function collectAdminOrderGroup(orderId, sellerId, body = {}) {
  return patchOrderGroup('collect', orderId, sellerId, body);
}

/** Local yoki xorij→UZB bulk handoff. pickup — xorij ombor manzili. */
export function handoffAdminOrderGroup(orderId, sellerId, body = {}) {
  const pickup = body?.pickup;
  const extra =
    pickup && typeof pickup === 'object'
      ? {
          uzWarehousePickup: {
            address: String(pickup.address || '').trim(),
            coordinates: Array.isArray(pickup.coordinates)
              ? pickup.coordinates
              : undefined,
            phone: String(pickup.phone || '').trim() || undefined,
            label: String(pickup.label || 'Toshkent ombori').trim(),
          },
        }
      : {};
  return patchOrderGroup('handoff', orderId, sellerId, {
    itemIndexes: body.itemIndexes,
    ...extra,
  });
}

export function cancelAdminOrderItem(orderId, itemIndex, sellerId) {
  return patchOrderItem('cancel', orderId, itemIndex, sellerId);
}

async function postNoAnswerAction(returnedOrderId, action) {
  const res = await fetch(
    apiUrl(
      `/api/admin/orders/no-answer/${encodeURIComponent(returnedOrderId)}/${action}`,
    ),
    { method: 'POST' },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export function reHandoffAdminNoAnswerOrder(returnedOrderId) {
  return postNoAnswerAction(returnedOrderId, 're-handoff');
}

export function reactivateAdminNoAnswerOrder(returnedOrderId) {
  return postNoAnswerAction(returnedOrderId, 'reactivate');
}

export function deliverAdminNoAnswerOrder(returnedOrderId) {
  return postNoAnswerAction(returnedOrderId, 'deliver');
}

export async function fetchAdminOrderCounts(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.pipeline) {
    params.set('pipeline', String(filters.pipeline));
  }
  const query = params.toString();
  const path = query
    ? `/api/admin/orders/counts?${query}`
    : '/api/admin/orders/counts';

  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    confirmation: Number(data?.confirmation) || 0,
    collection: Number(data?.collection) || 0,
    courier: Number(data?.courier) || 0,
    handed: Number(data?.handed) || 0,
    noAnswer: Number(data?.noAnswer) || 0,
  };
}
