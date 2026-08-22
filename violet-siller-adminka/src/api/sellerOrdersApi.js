import { apiUrl } from '../config/api';
import { normalizeCargoServiceType } from '../utils/cargoServiceRules';

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
    readyForCargoAt: row?.readyForCargoAt || null,
    handedToCargoAt: row?.handedToCargoAt || null,
    unitIndex: Number(row?.unitIndex) || 0,
    sellerId: String(row?.sellerId || ''),
    groupKey: String(row?.groupKey || ''),
    pipelineMode: String(row?.pipelineMode || '') === 'foreign' ? 'foreign' : 'local',
    sellerCountry: String(row?.sellerCountry || ''),
    cargoServiceType:
      String(row?.pipelineMode || '') === 'foreign'
        ? normalizeCargoServiceType(row?.cargoServiceType)
        : null,
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
    cargoSubmitted: Boolean(row?.cargoSubmitted),
    cargoAccepted: Boolean(row?.cargoAccepted),
    cargoShipment: row?.cargoShipment
      ? {
          ...row.cargoShipment,
          id: String(row.cargoShipment.id || ''),
          requestCode: String(row.cargoShipment.requestCode || ''),
          groupId: String(row.cargoShipment.groupId || ''),
          status: String(row.cargoShipment.status || ''),
          cargoServiceType: normalizeCargoServiceType(
            row.cargoShipment.cargoServiceType,
          ),
        }
      : null,
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

/**
 * Bir guruhni tasdiqlash. itemIndexes — joriy tabdagi siblinglar.
 */
export async function confirmSellerOrderGroup(token, orderId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/confirm-group`),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
      }),
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

/**
 * Bir guruhni yig‘ish. itemIndexes — joriy tabdagi siblinglar.
 */
export async function collectSellerOrderGroup(token, orderId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/collect-group`),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
      }),
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

/**
 * UZB — bir guruhni kuryerga topshirish.
 * itemIndexes majburiy yuborilishi tavsiya (joriy tabdagi siblinglar).
 */
export async function handoffSellerOrderGroup(token, orderId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/handoff-group`),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
      }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function submitSellerOrderItemToCargo(token, orderId, itemIndex, body = {}) {
  const res = await fetch(
    apiUrl(
      `/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/submit-to-cargo`,
    ),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

/**
 * Xorij — bir guruhni cargoga yuborish (Variant A: N shipment + bir groupId).
 * itemIndexes majburiy yuborilishi tavsiya.
 */
export async function submitSellerOrderGroupToCargo(token, orderId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/submit-to-cargo-group`),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
        note: body.note ? String(body.note) : undefined,
      }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function fetchSellerCargoWarehouseContacts(token) {
  const res = await fetch(apiUrl('/api/seller-auth/cargo-warehouse-contacts'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    sellerCountry: String(data.sellerCountry || ''),
    sellerCountryLabel: String(data.sellerCountryLabel || ''),
    contacts: Array.isArray(data.contacts)
      ? data.contacts.map((row) => ({
          id: String(row.id || ''),
          companyName: String(row.companyName || 'Logistica'),
          logisticaCountry: String(row.logisticaCountry || ''),
          chinaAddress: String(row.chinaAddress || ''),
          chinaPhone: String(row.chinaPhone || ''),
          profileDescription: String(row.profileDescription || ''),
        }))
      : [],
  };
}

export async function cancelSellerOrderItem(token, orderId, itemIndex) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/cancel`),
    {
      method: 'PATCH',
      headers: authHeaders(token),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function cancelSellerOrderGroup(token, orderId, body = {}) {
  const res = await fetch(
    apiUrl(`/api/seller-auth/orders/${Number(orderId)}/cancel-group`),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemIndexes: Array.isArray(body.itemIndexes) ? body.itemIndexes : undefined,
      }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data || {};
}

export async function markUnavailableSellerOrderItem(
  token,
  orderId,
  itemIndex,
  options = {},
) {
  const unitIndexes = Array.isArray(options.unitIndexes)
    ? [
        ...new Set(
          options.unitIndexes
            .map((value) => Math.floor(Number(value)))
            .filter((value) => Number.isInteger(value) && value >= 0),
        ),
      ]
    : null;

  const res = await fetch(
    apiUrl(
      `/api/seller-auth/orders/${Number(orderId)}/items/${Number(itemIndex)}/unavailable`,
    ),
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        unitIndexes?.length ? { unitIndexes } : {},
      ),
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
