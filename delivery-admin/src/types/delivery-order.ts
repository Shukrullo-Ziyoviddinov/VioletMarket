export type DeliveryAvailableOrder = {
  id: string;
  orderId: number;
  itemIndex: number;
  unitIndex: number;
  orderCode: string;
  productId: number;
  productCode: string;
  barcode: string;
  title: { uz: string; ru: string };
  region?: string;
  city: string;
  district: string;
  distanceKm: number | null;
  productCount: number;
  amount: number;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  orderedAt: string | null;
  handedToCourierAt: string | null;
  trackingStatus: string;
};

export type DeliveryAddressDetails = {
  region?: string;
  city: string;
  district: string;
  addressLine: string;
  placeType: string;
  entrance: string;
  floor: string;
  domofon: string;
  courierNote: string;
  coords: number[] | null;
};

export type DeliveryCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type DeliverySellerPickup = {
  id: string;
  name: string;
  address: string;
  sellerPhone: string;
  coordinates: number[] | null;
  /** warehouse = xorij ombor (admin manzili); seller = UZB siller */
  pickupKind?: 'seller' | 'warehouse';
};

export type DeliveryAssignmentStatus =
  | 'accepted'
  | 'en_route_to_seller'
  | 'arrived_at_seller'
  | 'picked_up'
  | 'en_route_to_customer'
  | 'arrived_at_customer'
  | 'delivered'
  | 'cancelled'
  | 'return_request_pending'
  | 'return_approved'
  | 'return_to_seller'
  | 'en_route_return_to_seller'
  | 'arrived_return_at_seller'
  | 'returned';

export type DeliveryAcceptedOrder = {
  id: string;
  orderId: number;
  itemIndex: number;
  unitIndex: number;
  productId: number;
  productCode: string;
  barcode: string;
  title: { uz: string; ru: string };
  amount: number;
  deliveryFee: number;
  productCount: number;
  imageUrl?: string;
  color?: string;
  size?: string;
  storage?: string;
  model?: string;
  customer: DeliveryCustomer;
  deliveryAddress: DeliveryAddressDetails;
  status: DeliveryAssignmentStatus | string;
  pickupPhase?: 'seller' | 'customer' | 'return';
  pickupKind?: 'seller' | 'warehouse';
  sellerId?: string;
  sellerPickup?: DeliverySellerPickup | null;
  acceptedAt: string | null;
  enRouteToSellerAt?: string | null;
  arrivedAtSellerAt?: string | null;
  pickedUpAt?: string | null;
  enRouteToCustomerAt?: string | null;
  arrivedAtCustomerAt?: string | null;
  handedToCourierAt: string | null;
  deliveredAt: string | null;
  approvedReturnReasonType?: 'no_answer' | 'return' | 'defective' | null;
  enRouteReturnToSellerAt?: string | null;
  arrivedReturnAtSellerAt?: string | null;
  returnedAt?: string | null;
  distanceKm?: number | null;
  courierPayment?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  orderedAt?: string | null;
};

export type DeliveryHistoryStats = {
  totalDelivered: number;
  todayCount: number;
  weekCount: number;
  totalIncome: number;
};

export const TASHKENT_CITY = 'Toshkent';

export const DISTANCE_FILTERS = [
  { label: 'Barchasi', value: 0 },
  { label: '2 km gacha', value: 2 },
  { label: '5 km gacha', value: 5 },
  { label: '10 km gacha', value: 10 },
  { label: '20 km gacha', value: 20 },
] as const;
