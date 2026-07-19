import { apiRequest } from '@/services/api';
import type {
  DeliveryAcceptedOrder,
  DeliveryAvailableOrder,
} from '@/types/delivery-order';

export type AvailableOrdersFilters = {
  city?: string;
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
  if (filters.city) params.set('city', filters.city);
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

export async function fetchAcceptedDeliveryOrders(token: string) {
  return apiRequest<{
    total: number;
    orders: DeliveryAcceptedOrder[];
  }>('/api/delivery/orders/accepted', { method: 'GET' }, token);
}
