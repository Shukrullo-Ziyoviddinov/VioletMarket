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
    status: String(row.status || ''),
    processStep: row.processStep || null,
    processStepLabel: String(row.processStepLabel || ''),
    paidAt: row.paidAt || null,
    acceptedAt: row.acceptedAt || null,
    submittedAt: row.submittedAt || null,
    logisticaId: row.logisticaId || null,
    logisticaCompanyName: String(row.logisticaCompanyName || ''),
    logisticaCountry: String(row.logisticaCountry || ''),
    storeName: String(row.storeName || ''),
    warehouseAddress: String(row.warehouseAddress || ''),
    note: String(row.note || ''),
    products: Array.isArray(row.products) ? row.products : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    processSteps: Array.isArray(row.processSteps) ? row.processSteps : [],
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
