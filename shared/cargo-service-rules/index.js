/**
 * Cargo Standard/Express — bitta qoida manbasi.
 *
 * Legacy: cargoServiceType yo‘q / noto‘g‘ri → standard (resolveStored).
 * UZB/local siller → null (lane yo‘q).
 * standard_only → har doim standard.
 *
 * Ro‘yxat guruhlash: resolveShipmentListGroupKey(..., { splitByCargoService }).
 * Default splitByCargoService=false — qabul sahifasi (1 kartochka).
 * Yuklarim / admin qabuldan keyin: splitByCargoService=true.
 */

const CARGO_SERVICE_TYPE = {
  STANDARD: "standard",
  EXPRESS: "express",
};

const CARGO_EXPRESS_POLICY = {
  UNRESTRICTED: "unrestricted",
  STANDARD_ONLY: "standard_only",
};

function cleanSellerId(value) {
  return String(value || "").trim();
}

function normalizeCargoServiceType(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === CARGO_SERVICE_TYPE.EXPRESS) return CARGO_SERVICE_TYPE.EXPRESS;
  if (raw === CARGO_SERVICE_TYPE.STANDARD) return CARGO_SERVICE_TYPE.STANDARD;
  return null;
}

/** Eski yozuvlar (maydon yo‘q) → standard. */
function resolveStoredCargoServiceType(value) {
  return normalizeCargoServiceType(value) || CARGO_SERVICE_TYPE.STANDARD;
}

function normalizeCargoExpressPolicy(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_EXPRESS_POLICY.STANDARD_ONLY;
  }
  if (raw === CARGO_EXPRESS_POLICY.UNRESTRICTED) {
    return CARGO_EXPRESS_POLICY.UNRESTRICTED;
  }
  return null;
}

function isStandardOnlyCargoPolicy(cargoExpressPolicy) {
  return (
    normalizeCargoExpressPolicy(cargoExpressPolicy) ===
    CARGO_EXPRESS_POLICY.STANDARD_ONLY
  );
}

function isUnrestrictedCargoPolicy(cargoExpressPolicy) {
  return !isStandardOnlyCargoPolicy(cargoExpressPolicy);
}

function isStandardOnlyCargoItem(productOrItem) {
  return isStandardOnlyCargoPolicy(productOrItem?.cargoExpressPolicy);
}

function isUnrestrictedCargoItem(productOrItem) {
  return isUnrestrictedCargoPolicy(productOrItem?.cargoExpressPolicy);
}

function isKnownCargoServiceType(value) {
  return normalizeCargoServiceType(value) !== null;
}

function buildSellerFulfillmentGroupKey(orderId, sellerId) {
  const oid = Number(orderId) || 0;
  const sid = cleanSellerId(sellerId);
  if (!oid || !sid) return "";
  return `${oid}:${sid}`;
}

function buildCargoLaneGroupKey(orderId, sellerId, cargoServiceType) {
  const base = buildSellerFulfillmentGroupKey(orderId, sellerId);
  if (!base) return "";
  return `${base}:${resolveStoredCargoServiceType(cargoServiceType)}`;
}

/**
 * Mijoz tracking: foreign missing → standard. UZB → null.
 */
function resolveTrackingCargoServiceType(pipelineMode, value) {
  if (String(pipelineMode || "").trim() !== "foreign") return null;
  return resolveStoredCargoServiceType(value);
}

/**
 * Logistica/admin ro‘yxat guruh kaliti.
 * @param {{ orderId?: number, sellerId?: string, cargoServiceType?: string|null }} row
 * @param {{ splitByCargoService?: boolean }} [options] — default false (qabul)
 */
function resolveShipmentListGroupKey(row, options = {}) {
  const splitByCargoService = options.splitByCargoService === true;
  const orderId = Number(row?.orderId) || 0;
  const sellerId = cleanSellerId(row?.sellerId);
  if (!orderId || !sellerId) return "";
  if (splitByCargoService) {
    return buildCargoLaneGroupKey(orderId, sellerId, row?.cargoServiceType);
  }
  return buildSellerFulfillmentGroupKey(orderId, sellerId);
}

/** UI: mahsulot/shipment lane (legacy → standard). */
function resolveProductCargoLane(product) {
  return resolveStoredCargoServiceType(product?.cargoServiceType);
}

function formatCargoServiceTypeLabel(
  value,
  labels = { express: "Express", standard: "Standard" },
) {
  const type = normalizeCargoServiceType(value);
  if (type === CARGO_SERVICE_TYPE.EXPRESS) return labels.express;
  if (type === CARGO_SERVICE_TYPE.STANDARD) return labels.standard;
  return "";
}

function resolveCargoLaneUnitCount(unit) {
  if (!unit || typeof unit !== "object") return 0;

  const fromCount = Math.max(0, Number(unit.productCount) || 0);
  if (fromCount > 0) return fromCount;

  if (Array.isArray(unit.products)) {
    if (unit.products.length === 0) return 0;
    const fromProducts = unit.products.reduce(
      (sum, product) => sum + Math.max(1, Number(product?.quantity) || 1),
      0,
    );
    if (fromProducts > 0) return fromProducts;
  }

  const fromQty = Math.max(0, Number(unit.quantity) || 0);
  if (fromQty > 0) return fromQty;

  // Eski yozuv: productCount yo‘q, products[] ham yo‘q — shipment bor deb 1.
  return 1;
}

function countCargoLanes(units = []) {
  const counts = { standard: 0, express: 0 };
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit) continue;
    const type = resolveStoredCargoServiceType(unit.cargoServiceType);
    counts[type] += resolveCargoLaneUnitCount(unit);
  }
  return counts;
}

function isMixedCargoLanes(counts) {
  const standard = Math.max(0, Number(counts?.standard) || 0);
  const express = Math.max(0, Number(counts?.express) || 0);
  return standard > 0 && express > 0;
}

function resolveGroupCargoServiceType(units = []) {
  const counts = countCargoLanes(units);
  const hasStandard = counts.standard > 0;
  const hasExpress = counts.express > 0;
  if (hasStandard && hasExpress) return null;
  if (hasExpress) return CARGO_SERVICE_TYPE.EXPRESS;
  if (hasStandard) return CARGO_SERVICE_TYPE.STANDARD;
  return null;
}

module.exports = {
  CARGO_SERVICE_TYPE,
  CARGO_EXPRESS_POLICY,
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
  normalizeCargoExpressPolicy,
  isStandardOnlyCargoPolicy,
  isUnrestrictedCargoPolicy,
  isStandardOnlyCargoItem,
  isUnrestrictedCargoItem,
  isKnownCargoServiceType,
  buildSellerFulfillmentGroupKey,
  buildCargoLaneGroupKey,
  resolveTrackingCargoServiceType,
  resolveShipmentListGroupKey,
  resolveProductCargoLane,
  formatCargoServiceTypeLabel,
  resolveCargoLaneUnitCount,
  countCargoLanes,
  isMixedCargoLanes,
  resolveGroupCargoServiceType,
};
