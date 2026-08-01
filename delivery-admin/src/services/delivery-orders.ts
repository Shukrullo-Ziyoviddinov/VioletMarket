import { apiRequest } from '@/services/api';
import type {
  DeliveryAcceptedOrder,
  DeliveryAvailableOrder,
  DeliveryHistoryStats,
} from '@/types/delivery-order';

export type AvailableOrdersFilters = {
  district?: string;
  maxDistanceKm?: number;
  courierLat?: number;
  courierLng?: number;
};

export async function fetchAvailableDeliveryOrders(
  token: string,
  filters: AvailableOrdersFilters = {},
) {
  const params = new URLSearchParams();
  if (filters.district && filters.district !== 'Barchasi') {
    params.set('district', filters.district);
  }
  if (filters.maxDistanceKm && filters.maxDistanceKm > 0) {
    params.set('maxDistanceKm', String(filters.maxDistanceKm));
  }
  if (
    Number.isFinite(filters.courierLat) &&
    Number.isFinite(filters.courierLng)
  ) {
    params.set('courierLat', String(filters.courierLat));
    params.set('courierLng', String(filters.courierLng));
  }

  const query = params.toString();
  const path = query
    ? `/api/delivery/orders/available?${query}`
    : '/api/delivery/orders/available';

  return apiRequest<{
    total: number;
    orders: DeliveryAvailableOrder[];
    locationUsed?: boolean;
  }>(path, { method: 'GET' }, token);
}

export async function acceptDeliveryOrder(
  token: string,
  payload: { orderId: number; itemIndex: number; unitIndex: number },
) {
  return apiRequest<{
    id: string;
    orderId: number;
    itemIndex: number;
    unitIndex: number;
  }>(
    '/api/delivery/orders/accept',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function acceptDeliveryOrderGroup(
  token: string,
  payload: {
    orderId: number;
    units: Array<{ itemIndex: number; unitIndex: number }>;
    courierLat?: number;
    courierLng?: number;
  },
) {
  return apiRequest<{
    orderId: number;
    updatedCount: number;
    skippedCount: number;
    updated: Array<{ id: string; orderId: number; itemIndex: number; unitIndex: number }>;
    skipped: Array<{ itemIndex: number; unitIndex: number; code?: string; message?: string }>;
  }>(
    '/api/delivery/orders/accept-group',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function pickUpDeliveryOrder(
  token: string,
  payload: { assignmentId: string },
) {
  return apiRequest<DeliveryAcceptedOrder>(
    '/api/delivery/orders/pickup',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export type DeliveryAdvanceAction =
  | 'go_to_seller'
  | 'arrive_seller'
  | 'go_to_customer'
  | 'arrive_customer';

export async function advanceDeliveryOrderStep(
  token: string,
  payload: { assignmentId: string; action: DeliveryAdvanceAction },
) {
  return apiRequest<DeliveryAcceptedOrder>(
    '/api/delivery/orders/advance',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deliverDeliveryOrder(
  token: string,
  payload: {
    assignmentId: string;
    courierLat?: number;
    courierLng?: number;
  },
) {
  return apiRequest<DeliveryAcceptedOrder>(
    '/api/delivery/orders/deliver',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchAcceptedDeliveryOrders(token: string) {
  return apiRequest<{
    total: number;
    orders: DeliveryAcceptedOrder[];
  }>('/api/delivery/orders/accepted', { method: 'GET' }, token);
}

export async function fetchAcceptedDeliveryOrder(
  token: string,
  assignmentId: string,
) {
  return apiRequest<DeliveryAcceptedOrder>(
    `/api/delivery/orders/accepted/${encodeURIComponent(assignmentId)}`,
    { method: 'GET' },
    token,
  );
}

export async function fetchDeliveredHistory(token: string) {
  return apiRequest<{
    total: number;
    stats: DeliveryHistoryStats;
    orders: DeliveryAcceptedOrder[];
  }>('/api/delivery/orders/history', { method: 'GET' }, token);
}

export type ReturnReasonType = 'no_answer' | 'return' | 'defective';

/** Ajdaniya → admin so‘rovi */
export async function returnDeliveryOrder(
  token: string,
  payload: {
    assignmentId: string;
    comment?: string;
  },
) {
  return apiRequest<{
    request: { id: string; status: string };
    assignment: DeliveryAcceptedOrder;
  }>(
    '/api/delivery/orders/return',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function confirmReturnReason(
  token: string,
  payload: { assignmentId: string; reasonType: ReturnReasonType },
) {
  return apiRequest<DeliveryAcceptedOrder>(
    '/api/delivery/orders/return/confirm-reason',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export type DeliveryReturnAdvanceAction =
  | 'go_return_to_seller'
  | 'arrive_return_seller';

export async function advanceReturnDeliveryStep(
  token: string,
  payload: { assignmentId: string; action: DeliveryReturnAdvanceAction },
) {
  return apiRequest<DeliveryAcceptedOrder>(
    '/api/delivery/orders/return/advance',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function completeReturnDeliveryOrder(
  token: string,
  payload: {
    assignmentId: string;
    courierLat?: number;
    courierLng?: number;
  },
) {
  return apiRequest<{
    returned: { id: string; reasonType: ReturnReasonType };
    assignment: DeliveryAcceptedOrder;
  }>(
    '/api/delivery/orders/return/complete',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}
