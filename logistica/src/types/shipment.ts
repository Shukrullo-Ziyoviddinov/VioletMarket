export type WeightLabel = "Taxminiy og'irlik" | "Og'irlik";

export type ProcessStepKey =
  | 'xitoy_omborida'
  | 'yolda'
  | 'bojxonada'
  | 'toshkent_omborida';

export type ShipmentProduct = {
  id: string;
  title: string;
  variant: string;
  weightKg: number;
  quantity: number;
  productId?: number;
  color?: string;
  size?: string;
  storage?: string;
  model?: string;
  image?: string;
  unitIndex?: number;
};

export type ShipmentListItem = {
  id: string;
  requestCode: string;
  storeName: string;
  dateTime: string;
  productCount: number;
  weightKg: number;
  weightLabel: WeightLabel;
  status?: string;
  sellerCountry?: string;
  submittedAt?: string | null;
};

export type ShipmentDetail = {
  id: string;
  requestCode: string;
  storeName: string;
  dateTime: string;
  productCount: number;
  weightKg: number;
  weightLabel: WeightLabel;
  warehouseAddress: string;
  note: string;
  products: ShipmentProduct[];
  activeProcessStep: ProcessStepKey | null;
  status?: string;
  sellerId?: string;
  sellerCountry?: string;
  orderId?: number;
  itemIndex?: number;
  submittedAt?: string | null;
  acceptedAt?: string | null;
};

export type PendingShipmentsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  logisticaCountry?: string;
  shipments: ShipmentListItem[];
};

export type ShipmentDetailResponse = {
  shipment: ShipmentDetail;
};
