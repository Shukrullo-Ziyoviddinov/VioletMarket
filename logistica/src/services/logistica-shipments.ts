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

function mapListItem(row: Partial<ShipmentListItem>): ShipmentListItem {
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
    submittedAt: row.submittedAt ?? null,
  };
}

function mapDetail(row: Partial<ShipmentDetail>): ShipmentDetail {
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
    activeProcessStep: normalizeProcessStep(row.activeProcessStep),
    status: row.status ? String(row.status) : undefined,
    sellerId: row.sellerId ? String(row.sellerId) : undefined,
    sellerCountry: row.sellerCountry ? String(row.sellerCountry) : undefined,
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    submittedAt: row.submittedAt ?? null,
    acceptedAt: row.acceptedAt ?? null,
  };
}

export async function fetchPendingShipments(token: string, page = 1, limit = 50) {
  const data = await apiRequest<PendingShipmentsResponse>(
    `/api/logistica-auth/shipments?page=${page}&limit=${limit}`,
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

export async function fetchShipmentDetail(token: string, shipmentId: string) {
  const data = await apiRequest<ShipmentDetailResponse>(
    `/api/logistica-auth/shipments/${encodeURIComponent(shipmentId)}`,
    { method: 'GET' },
    token,
  );

  return mapDetail(data?.shipment || {});
}
