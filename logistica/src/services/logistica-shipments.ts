import i18n from '@/i18n';
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

function productFallbackTitle() {
  return i18n.t('common.product');
}

function mapListItem(row: Partial<ShipmentListItem> & Record<string, unknown>): ShipmentListItem {
  const siblingIds = Array.isArray(row.siblingIds)
    ? row.siblingIds.map((id) => String(id || '')).filter(Boolean)
    : [];

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
    cargoFeePaymentRequired: Boolean(row.cargoFeePaymentRequired),
    customerCargoFeePaidAt:
      (row.customerCargoFeePaidAt as string | null | undefined) ?? null,
    adminCargoFeeConfirmedAt:
      (row.adminCargoFeeConfirmedAt as string | null | undefined) ?? null,
    paidAt: (row.paidAt as string | null | undefined) ?? null,
    submittedAt: row.submittedAt ?? null,
    orderId: Number(row.orderId) || 0,
    sellerId: row.sellerId ? String(row.sellerId) : undefined,
    groupKey: row.groupKey ? String(row.groupKey) : undefined,
    isGroup: Boolean(row.isGroup) || siblingIds.length > 1,
    siblingIds,
  };
}

function mapDetail(row: Partial<ShipmentDetail> & Record<string, unknown>): ShipmentDetail {
  const products = Array.isArray(row.products)
    ? row.products.map((product, index) => ({
        id: String(product?.id || `${row.id || 'p'}-${index}`),
        shipmentId: String(
          product?.shipmentId || row.id || '',
        ).trim() || undefined,
        title: String(product?.title || productFallbackTitle()),
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
        returnStatus: String(product?.returnStatus || 'active'),
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
    groupKey: row.groupKey ? String(row.groupKey) : undefined,
    isGroup: Boolean(row.isGroup),
    siblingIds: Array.isArray(row.siblingIds)
      ? row.siblingIds.map((id) => String(id || '')).filter(Boolean)
      : [],
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

export async function returnShipmentToSeller(
  token: string,
  shipmentId: string,
  options?: {
    shipmentIds?: string[];
    unitIndexes?: number[];
    selections?: { shipmentId: string; unitIndex: number }[];
  },
) {
  const selections = Array.isArray(options?.selections)
    ? options.selections
        .map((row) => ({
          shipmentId: String(row.shipmentId || '').trim(),
          unitIndex: Math.max(0, Math.floor(Number(row.unitIndex) || 0)),
        }))
        .filter((row) => Boolean(row.shipmentId))
    : undefined;

  const shipmentIds = Array.isArray(options?.shipmentIds)
    ? [...new Set(options.shipmentIds.map(String).filter(Boolean))]
    : undefined;

  const unitIndexes = Array.isArray(options?.unitIndexes)
    ? [
        ...new Set(
          options.unitIndexes
            .map((value) => Math.floor(Number(value)))
            .filter((value) => Number.isInteger(value) && value >= 0),
        ),
      ]
    : undefined;

  const body: Record<string, unknown> = {};
  if (selections?.length) body.selections = selections;
  else {
    if (shipmentIds?.length) body.shipmentIds = shipmentIds;
    if (unitIndexes?.length) body.unitIndexes = unitIndexes;
  }

  const data = await apiRequest<{
    shipment: ShipmentDetail;
    request?: Record<string, unknown>;
    alreadyRequested?: boolean;
    alreadyReturned?: boolean;
  }>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}/return-to-seller`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
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
    productTitle: String(row.productTitle || productFallbackTitle()),
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

export type CargoHistoryPeriodParams = {
  mode?: 'month' | 'week';
  year?: number;
  month?: number;
  weekStart?: string;
  kind?: 'all' | 'handed_over' | 'returned';
};

export async function fetchCargoHistory(
  token: string,
  page = 1,
  limit = 30,
  period: CargoHistoryPeriodParams = {},
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (period.kind) query.set('kind', period.kind);
  if (period.mode) query.set('mode', period.mode);
  if (period.mode === 'month') {
    if (period.year) query.set('year', String(period.year));
    if (period.month) query.set('month', String(period.month));
  } else if (period.mode === 'week' && period.weekStart) {
    query.set('weekStart', period.weekStart);
  }

  const data = await apiRequest<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    counts?: {
      handedOver?: number;
      returned?: number;
    };
    items: Array<Record<string, unknown>>;
  }>(
    `/api/logistica-auth/history?${query.toString()}`,
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
    productTitle: String(row.productTitle || productFallbackTitle()),
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
    counts: {
      handedOver: Math.max(0, Number(data?.counts?.handedOver) || 0),
      returned: Math.max(0, Number(data?.counts?.returned) || 0),
    },
    items,
  };
}

export type CargoHistoryBalanceResponse = {
  mode: 'month' | 'week';
  periodLabel: string;
  balance: number;
  count: number;
  selected: {
    year?: number;
    month?: number;
    weekStart?: string;
    weekEnd?: string;
  };
  months: Array<{ key: string; label: string; year: number; month: number }>;
  weeks: Array<{
    key: string;
    label: string;
    weekStart: string;
    weekEnd: string;
  }>;
};

export async function fetchCargoHistoryBalance(
  token: string,
  params: {
    mode: 'month' | 'week';
    year?: number;
    month?: number;
    weekStart?: string;
  },
) {
  const query = new URLSearchParams();
  query.set('mode', params.mode);
  if (params.mode === 'month') {
    if (params.year) query.set('year', String(params.year));
    if (params.month) query.set('month', String(params.month));
  } else if (params.weekStart) {
    query.set('weekStart', params.weekStart);
  }

  const data = await apiRequest<CargoHistoryBalanceResponse>(
    `/api/logistica-auth/history/balance?${query.toString()}`,
    { method: 'GET' },
    token,
  );

  return {
    mode: data?.mode === 'week' ? 'week' : 'month',
    periodLabel: String(data?.periodLabel || ''),
    balance: Math.max(0, Number(data?.balance) || 0),
    count: Math.max(0, Number(data?.count) || 0),
    selected: {
      year: Number(data?.selected?.year) || undefined,
      month: Number(data?.selected?.month) || undefined,
      weekStart: data?.selected?.weekStart
        ? String(data.selected.weekStart)
        : undefined,
      weekEnd: data?.selected?.weekEnd
        ? String(data.selected.weekEnd)
        : undefined,
    },
    months: Array.isArray(data?.months)
      ? data.months.map((row) => ({
          key: String(row.key || ''),
          label: String(row.label || ''),
          year: Number(row.year) || 0,
          month: Number(row.month) || 0,
        }))
      : [],
    weeks: Array.isArray(data?.weeks)
      ? data.weeks.map((row) => ({
          key: String(row.key || ''),
          label: String(row.label || ''),
          weekStart: String(row.weekStart || ''),
          weekEnd: String(row.weekEnd || ''),
        }))
      : [],
  } satisfies CargoHistoryBalanceResponse;
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
    itemWeights?: Array<{ shipmentId: string; weightKg: number }>;
  },
) {
  const itemWeights = Array.isArray(payload.itemWeights)
    ? payload.itemWeights
        .map((row) => ({
          shipmentId: String(row?.shipmentId || '').trim(),
          weightKg: Number(row?.weightKg),
        }))
        .filter(
          (row) =>
            row.shipmentId &&
            Number.isFinite(row.weightKg) &&
            row.weightKg > 0,
        )
    : [];

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
        ...(itemWeights.length ? { itemWeights } : {}),
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
