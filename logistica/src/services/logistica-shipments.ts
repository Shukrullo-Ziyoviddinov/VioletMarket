import { apiRequest } from '@/services/api';
import { normalizeProcessStep } from '@/constants/shipmentProcess';
import type {
  PendingShipmentsResponse,
  ShipmentDetail,
  ShipmentDetailResponse,
  ShipmentListItem,
  WeightLabel,
} from '@/types/shipment';

function asWeightLabel(value: unknown): WeightLabel {
  return String(value || '') === "Og'irlik"
    ? "Og'irlik"
    : "Taxminiy og'irlik";
}

function mapListItem(row: Partial<ShipmentListItem> & Record<string, unknown>): ShipmentListItem {
  return {
    id: String(row.id || ''),
    requestCode: String(row.requestCode || ''),
    storeName: String(row.storeName || ''),
    dateTime: String(row.dateTime || ''),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: asWeightLabel(row.weightLabel),
    status: row.status ? String(row.status) : undefined,
    sellerCountry: row.sellerCountry ? String(row.sellerCountry) : undefined,
    processStep: row.processStep != null ? String(row.processStep) : null,
    paidAt: (row.paidAt as string | null | undefined) ?? null,
    submittedAt: row.submittedAt ?? null,
  };
}

function mapDetail(row: Partial<ShipmentDetail> & Record<string, unknown>): ShipmentDetail {
  const products = Array.isArray(row.products)
    ? row.products.map((product, index) => ({
        id: String(product?.id || `${row.id || 'p'}-${index}`),
        title: String(product?.title || 'Mahsulot'),
        variant: String(product?.variant || ''),
        weightKg: Math.max(0, Number(product?.weightKg) || 0),
        quantity: Math.max(1, Number(product?.quantity) || 1),
        productId: Number(product?.productId) || 0,
        color: String(product?.color || ''),
        size: String(product?.size || ''),
        storage: String(product?.storage || ''),
        model: String(product?.model || ''),
        image: String(product?.image || '/img/no-image.png'),
        unitIndex: Number(product?.unitIndex) || 0,
      }))
    : [];

  return {
    id: String(row.id || ''),
    requestCode: String(row.requestCode || ''),
    storeName: String(row.storeName || ''),
    dateTime: String(row.dateTime || ''),
    productCount: Math.max(0, Number(row.productCount) || products.length),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: asWeightLabel(row.weightLabel),
    warehouseAddress: String(row.warehouseAddress || ''),
    note: String(row.note || ''),
    products,
    activeProcessStep: normalizeProcessStep(row.activeProcessStep as string | null),
    status: row.status ? String(row.status) : undefined,
    sellerId: row.sellerId ? String(row.sellerId) : undefined,
    sellerCountry: row.sellerCountry ? String(row.sellerCountry) : undefined,
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    submittedAt: (row.submittedAt as string | null | undefined) ?? null,
    acceptedAt: (row.acceptedAt as string | null | undefined) ?? null,
    returnedAt: (row.returnedAt as string | null | undefined) ?? null,
    paidAt: (row.paidAt as string | null | undefined) ?? null,
  };
}

async function fetchShipmentList(
  token: string,
  path: string,
  page = 1,
  limit = 50,
) {
  const data = await apiRequest<PendingShipmentsResponse>(
    `${path}?page=${page}&limit=${limit}`,
    { method: 'GET' },
    token,
  );

  return {
    ...data,
    shipments: (Array.isArray(data?.shipments) ? data.shipments : []).map(
      mapListItem,
    ),
  };
}

export async function fetchPendingShipments(token: string, page = 1, limit = 50) {
  return fetchShipmentList(token, '/api/logistica-auth/shipments', page, limit);
}

export async function fetchAcceptedShipments(token: string, page = 1, limit = 50) {
  return fetchShipmentList(
    token,
    '/api/logistica-auth/shipments/accepted',
    page,
    limit,
  );
}

export async function fetchUzWarehouseShipments(
  token: string,
  page = 1,
  limit = 50,
) {
  return fetchShipmentList(
    token,
    '/api/logistica-auth/shipments/uzb-warehouse',
    page,
    limit,
  );
}

export async function fetchShipmentDetail(token: string, shipmentId: string) {
  const data = await apiRequest<ShipmentDetailResponse>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}`,
    { method: 'GET' },
    token,
  );

  return mapDetail(data?.shipment || {});
}

export async function acceptShipment(token: string, shipmentId: string) {
  const data = await apiRequest<{ shipment: ShipmentDetail; alreadyAccepted?: boolean }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/accept`,
    { method: 'POST' },
    token,
  );
  return {
    shipment: mapDetail(data?.shipment || {}),
    alreadyAccepted: Boolean(data?.alreadyAccepted),
  };
}

export async function returnShipmentToSeller(token: string, shipmentId: string) {
  const data = await apiRequest<{
    shipment: ShipmentDetail;
    alreadyReturned?: boolean;
  }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/return-to-seller`,
    { method: 'POST' },
    token,
  );
  return {
    shipment: mapDetail(data?.shipment || {}),
    alreadyReturned: Boolean(data?.alreadyReturned),
  };
}

export async function saveShipmentProcessStep(
  token: string,
  shipmentId: string,
  processStep: string,
) {
  const data = await apiRequest<{ shipment: ShipmentDetail }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/process-step`,
    {
      method: 'PATCH',
      body: JSON.stringify({ processStep }),
    },
    token,
  );
  return mapDetail(data?.shipment || {});
}

export async function markShipmentPaid(token: string, shipmentId: string) {
  const data = await apiRequest<{ shipment: ShipmentDetail; alreadyPaid?: boolean }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/mark-paid`,
    { method: 'POST' },
    token,
  );
  return {
    shipment: mapDetail(data?.shipment || {}),
    alreadyPaid: Boolean(data?.alreadyPaid),
  };
}
