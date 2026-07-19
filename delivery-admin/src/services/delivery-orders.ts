import { apiRequest } from '@/services/api';
import type { DeliveryAvailableOrder } from '@/types/delivery-order';

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
