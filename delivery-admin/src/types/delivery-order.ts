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
  city: string;
  district: string;
  distanceKm: number | null;
  productCount: number;
  amount: number;
  orderedAt: string | null;
  handedToCourierAt: string | null;
  trackingStatus: string;
};

export type DeliveryAddressDetails = {
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
  productCount: number;
  deliveryAddress: DeliveryAddressDetails;
  status: string;
  acceptedAt: string | null;
  handedToCourierAt: string | null;
};

export const TASHKENT_CITY = 'Toshkent';

export const DISTANCE_FILTERS = [
  { label: 'Barchasi', value: 0 },
  { label: '2 km gacha', value: 2 },
  { label: '5 km gacha', value: 5 },
  { label: '10 km gacha', value: 10 },
  { label: '20 km gacha', value: 20 },
] as const;
