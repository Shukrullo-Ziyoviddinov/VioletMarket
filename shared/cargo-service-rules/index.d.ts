export declare const CARGO_SERVICE_TYPE: {
  readonly STANDARD: "standard";
  readonly EXPRESS: "express";
};

export declare const CARGO_EXPRESS_POLICY: {
  readonly UNRESTRICTED: "unrestricted";
  readonly STANDARD_ONLY: "standard_only";
};

export type CargoServiceType = "standard" | "express";
export type CargoExpressPolicy = "unrestricted" | "standard_only" | null;

export declare function normalizeCargoServiceType(
  value: unknown,
): CargoServiceType | null;

export declare function resolveStoredCargoServiceType(
  value: unknown,
): CargoServiceType;

export declare function normalizeCargoExpressPolicy(
  value: unknown,
): CargoExpressPolicy;

export declare function isStandardOnlyCargoPolicy(
  cargoExpressPolicy: unknown,
): boolean;

export declare function isUnrestrictedCargoPolicy(
  cargoExpressPolicy: unknown,
): boolean;

export declare function isStandardOnlyCargoItem(
  productOrItem: { cargoExpressPolicy?: unknown } | null | undefined,
): boolean;

export declare function isUnrestrictedCargoItem(
  productOrItem: { cargoExpressPolicy?: unknown } | null | undefined,
): boolean;

export declare function isKnownCargoServiceType(value: unknown): boolean;

export declare function buildSellerFulfillmentGroupKey(
  orderId: unknown,
  sellerId: unknown,
): string;

export declare function buildCargoLaneGroupKey(
  orderId: unknown,
  sellerId: unknown,
  cargoServiceType: unknown,
): string;

export declare function resolveTrackingCargoServiceType(
  pipelineMode: unknown,
  value: unknown,
): CargoServiceType | null;

export declare function resolveShipmentListGroupKey(
  row: {
    orderId?: number;
    sellerId?: string;
    cargoServiceType?: string | null;
  },
  options?: { splitByCargoService?: boolean },
): string;

export declare function resolveProductCargoLane(product: {
  cargoServiceType?: string | null;
} | null | undefined): CargoServiceType;

export declare function formatCargoServiceTypeLabel(
  value: unknown,
  labels?: { express?: string; standard?: string },
): string;

export declare function resolveCargoLaneUnitCount(unit: unknown): number;

export declare function countCargoLanes(
  units?: unknown[],
): { standard: number; express: number };

export declare function isMixedCargoLanes(
  counts?: { standard?: number; express?: number } | null,
): boolean;

export declare function resolveGroupCargoServiceType(
  units?: unknown[],
): CargoServiceType | null;
