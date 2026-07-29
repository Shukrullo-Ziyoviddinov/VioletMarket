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
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ''),
    uzArrivalComment: String(row.uzArrivalComment || ''),
    uzArrivedAt: (row.uzArrivedAt as string | null | undefined) ?? null,
    submittedAt: (row.submittedAt as string | null | undefined) ?? null,
    acceptedAt: (row.acceptedAt as string | null | undefined) ?? null,
    returnedAt: (row.returnedAt as string | null | undefined) ?? null,
    paidAt: (row.paidAt as string | null | undefined) ?? null,
    adminCargoFeeConfirmedAt:
      (row.adminCargoFeeConfirmedAt as string | null | undefined) ?? null,
    customerCargoFeePaidAt:
      (row.customerCargoFeePaidAt as string | null | undefined) ?? null,
    canMarkPaid: Boolean(row.canMarkPaid),
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
    request?: Record<string, unknown>;
    alreadyRequested?: boolean;
    alreadyReturned?: boolean;
  }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/return-to-seller`,
    { method: 'POST' },
    token,
  );
  return {
    shipment: mapDetail(data?.shipment || {}),
    alreadyRequested: Boolean(data?.alreadyRequested || data?.alreadyReturned),
  };
}

type ReturnListPage = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ReturnItem[];
};

function mapReturnCard(row: Record<string, unknown>) {
  return {
    id: String(row.id || ''),
    shipmentId: String(row.shipmentId || ''),
    requestCode: String(row.requestCode || ''),
    storeName: String(row.storeName || ''),
    productTitle: String(row.productTitle || 'Mahsulot'),
    productCode: String(row.productCode || ''),
    orderId: Number(row.orderId) || 0,
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    cargoCountry: String(row.cargoCountry || ''),
    cargoCountryLabel: String(row.cargoCountryLabel || ''),
    approvedReasonType: row.approvedReasonType
      ? String(row.approvedReasonType)
      : null,
    reviewedAt: row.reviewedAt ?? null,
    status: String(row.status || ''),
  };
}

type ReturnItem = ReturnType<typeof mapReturnCard>;

function mapReturnPage(
  section: Partial<ReturnListPage> & { items?: Array<Record<string, unknown>> },
  fallbackPage: number,
  fallbackLimit: number,
): ReturnListPage {
  const items = (Array.isArray(section?.items) ? section.items : []).map(
    mapReturnCard,
  );
  return {
    page: Number(section?.page) || fallbackPage,
    limit: Number(section?.limit) || fallbackLimit,
    total: Number(section?.total) || items.length,
    totalPages: Number(section?.totalPages) || 1,
    items,
  };
}

export async function fetchCargoReturnsBoard(
  token: string,
  options: {
    pendingPage?: number;
    approvedPage?: number;
    limit?: number;
  } = {},
) {
  const pendingPage = Math.max(1, Number(options.pendingPage) || 1);
  const approvedPage = Math.max(1, Number(options.approvedPage) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
  const params = new URLSearchParams({
    pendingPage: String(pendingPage),
    approvedPage: String(approvedPage),
    limit: String(limit),
  });

  const data = await apiRequest<{
    limit?: number;
    pending?: Partial<ReturnListPage> & { items?: Array<Record<string, unknown>> };
    approved?: Partial<ReturnListPage> & { items?: Array<Record<string, unknown>> };
  }>(`/api/logistica-auth/cargo-returns?${params.toString()}`, { method: 'GET' }, token);

  return {
    limit: Number(data?.limit) || limit,
    pending: mapReturnPage(data?.pending || {}, pendingPage, limit),
    approved: mapReturnPage(data?.approved || {}, approvedPage, limit),
  };
}

export async function fetchCargoHistory(token: string, page = 1, limit = 30) {
  const data = await apiRequest<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    items: Array<Record<string, unknown>>;
  }>(
    `/api/logistica-auth/history?page=${page}&limit=${limit}`,
    { method: 'GET' },
    token,
  );

  const items = (Array.isArray(data?.items) ? data.items : []).map((row) => ({
    id: String(row.id || ''),
    shipmentId: String(row.shipmentId || ''),
    kind: String(row.kind || '') === 'returned' ? 'returned' : 'handed_over',
    kindLabel: String(row.kindLabel || ''),
    requestCode: String(row.requestCode || ''),
    storeName: String(row.storeName || ''),
    sellerId: String(row.sellerId || ''),
    orderId: Number(row.orderId) || 0,
    productTitle: String(row.productTitle || 'Mahsulot'),
    productCode: String(row.productCode || ''),
    amount: Math.max(0, Number(row.amount) || 0),
    cargoCountry: String(row.cargoCountry || ''),
    cargoCountryLabel: String(row.cargoCountryLabel || ''),
    at: (row.at as string | null | undefined) ?? null,
  }));

  return {
    page: Number(data?.page) || page,
    limit: Number(data?.limit) || limit,
    total: Number(data?.total) || items.length,
    totalPages: Number(data?.totalPages) || 1,
    items,
  };
}

export async function confirmCargoReturn(token: string, requestId: string) {
  const data = await apiRequest<{
    request?: Record<string, unknown>;
    alreadyCompleted?: boolean;
  }>(
    `/api/logistica-auth/cargo-returns/${encodeURIComponent(requestId)}/confirm`,
    { method: 'POST' },
    token,
  );
  return {
    alreadyCompleted: Boolean(data?.alreadyCompleted),
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

export async function arriveShipmentAtUzWarehouse(
  token: string,
  shipmentId: string,
  payload: {
    weightKg: number;
    cargoDeliveryFee: number;
    comment?: string;
    photoBase64?: string | null;
  },
) {
  const data = await apiRequest<{
    shipment: ShipmentDetail;
    alreadyArrived?: boolean;
  }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/uz-arrival`,
    {
      method: 'POST',
      body: JSON.stringify({
        weightKg: payload.weightKg,
        cargoDeliveryFee: payload.cargoDeliveryFee,
        comment: payload.comment || '',
        photoBase64: payload.photoBase64 || undefined,
      }),
    },
    token,
  );
  return {
    shipment: mapDetail(data?.shipment || {}),
    alreadyArrived: Boolean(data?.alreadyArrived),
  };
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
