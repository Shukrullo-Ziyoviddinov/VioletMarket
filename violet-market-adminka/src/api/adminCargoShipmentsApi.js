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

function normalizeShipment(row = {}) {
  const siblingIds = Array.isArray(row.siblingIds)
    ? row.siblingIds.map((id) => String(id || '')).filter(Boolean)
    : [];
  return {
    id: String(row.id || ''),
    requestCode: String(row.requestCode || ''),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    sellerId: String(row.sellerId || ''),
    sellerName: String(row.sellerName || ''),
    sellerCountry: String(row.sellerCountry || ''),
    sellerCountryLabel: String(row.sellerCountryLabel || row.sellerCountry || ''),
    productTitle: String(row.productTitle || ''),
    productId: Number(row.productId) || 0,
    productCount: Number(row.productCount) || 0,
    weightKg: Number(row.weightKg) || 0,
    cargoDeliveryFee: Number(row.cargoDeliveryFee) || 0,
    cargoFeePaymentRequired: Boolean(row.cargoFeePaymentRequired),
    status: String(row.status || ''),
    processStep: row.processStep || null,
    processStepLabel: String(row.processStepLabel || ''),
    paidAt: row.paidAt || null,
    uzArrivedAt: row.uzArrivedAt || null,
    uzArrivalComment: String(row.uzArrivalComment || ''),
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    canMarkPaid: Boolean(row.canMarkPaid),
    acceptedAt: row.acceptedAt || null,
    submittedAt: row.submittedAt || null,
    logisticaId: row.logisticaId || null,
    logisticaCompanyName: String(row.logisticaCompanyName || ''),
    logisticaCountry: String(row.logisticaCountry || ''),
    storeName: String(row.storeName || ''),
    warehouseAddress: String(row.warehouseAddress || ''),
    note: String(row.note || ''),
    products: Array.isArray(row.products)
      ? row.products.map((product) => ({
          id: String(product?.id || ''),
          shipmentId: product?.shipmentId
            ? String(product.shipmentId)
            : null,
          title: String(product?.title || ''),
          productId: Number(product?.productId) || 0,
          color: String(product?.color || ''),
          size: String(product?.size || ''),
          storage: String(product?.storage || ''),
          model: String(product?.model || ''),
          quantity: Math.max(1, Number(product?.quantity) || 1),
          weightKg: Math.max(0, Number(product?.weightKg) || 0),
        }))
      : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    processSteps: Array.isArray(row.processSteps) ? row.processSteps : [],
    toshkentStep: row.toshkentStep || {
      key: 'toshkent_omborida',
      label: 'Toshkent omborida',
      done: false,
    },
    groupKey: String(row.groupKey || ''),
    cargoServiceType:
      row.cargoServiceType === 'express' || row.cargoServiceType === 'standard'
        ? row.cargoServiceType
        : null,
    cargoLaneCounts: {
      standard: Math.max(0, Number(row.cargoLaneCounts?.standard) || 0),
      express: Math.max(0, Number(row.cargoLaneCounts?.express) || 0),
    },
    isGroup: Boolean(row.isGroup) || siblingIds.length > 1,
    siblingIds,
  };
}

function unwrapDetail(payload) {
  const data = payload?.data || {};
  return {
    shipment: normalizeShipment(data.shipment || {}),
    alreadyArrived: Boolean(data.alreadyArrived),
    alreadyPaid: Boolean(data.alreadyPaid),
  };
}

export async function fetchAdminCargoShipmentCountries() {
  const res = await fetch(apiUrl('/api/admin/cargo-shipments/countries'));
  const payload = await parseJson(res);
  const countries = Array.isArray(payload?.data?.countries)
    ? payload.data.countries
    : [];
  return countries.map((row) => ({
    code: String(row.code || ''),
    label: String(row.label || row.code || ''),
    count: Number(row.count) || 0,
  }));
}

export async function fetchAdminCargoShipments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sellerCountry) {
    params.set('sellerCountry', String(filters.sellerCountry));
  }
  const query = params.toString();
  const path = query
    ? `/api/admin/cargo-shipments?${query}`
    : '/api/admin/cargo-shipments';
  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 100,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    shipments: Array.isArray(data.shipments)
      ? data.shipments.map(normalizeShipment)
      : [],
  };
}

export async function fetchAdminCargoShipmentDetail(shipmentId) {
  const res = await fetch(
    apiUrl(`/api/admin/cargo-shipments/${encodeURIComponent(shipmentId)}`),
  );
  const payload = await parseJson(res);
  return normalizeShipment(payload?.data?.shipment || {});
}

export async function updateAdminCargoShipmentProcessStep(
  shipmentId,
  processStep,
) {
  const res = await fetch(
    apiUrl(
      `/api/admin/cargo-shipments/${encodeURIComponent(shipmentId)}/process-step`,
    ),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processStep }),
    },
  );
  const payload = await parseJson(res);
  return normalizeShipment(payload?.data?.shipment || {});
}

export async function arriveAdminCargoShipmentUzWarehouse(
  shipmentId,
  payload = {},
) {
  const res = await fetch(
    apiUrl(
      `/api/admin/cargo-shipments/${encodeURIComponent(shipmentId)}/uz-arrival`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: payload.weightKg,
        cargoDeliveryFee: payload.cargoDeliveryFee,
        comment: payload.comment || '',
        photoBase64: payload.photoBase64 || null,
        ...(Array.isArray(payload.itemWeights) && payload.itemWeights.length
          ? {
              itemWeights: payload.itemWeights
                .map((row) => ({
                  shipmentId: String(row?.shipmentId || '').trim(),
                  weightKg: Number(row?.weightKg),
                }))
                .filter(
                  (row) =>
                    row.shipmentId &&
                    Number.isFinite(row.weightKg) &&
                    row.weightKg > 0,
                ),
            }
          : {}),
      }),
    },
  );
  const body = await parseJson(res);
  return unwrapDetail(body);
}

export async function markAdminCargoShipmentPaid(shipmentId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/cargo-shipments/${encodeURIComponent(shipmentId)}/mark-paid`,
    ),
    { method: 'POST' },
  );
  const body = await parseJson(res);
  return unwrapDetail(body);
}
