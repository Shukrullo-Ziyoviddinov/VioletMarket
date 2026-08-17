/**
 * Xorij cargo tarifi: standard | express.
 * Savat tanlovi checkout’da order itemga yoziladi, shipmentga ko‘chadi.
 * Siller guruhi: orderId+sellerId (o‘zgarmaydi).
 * Logistica qabuldan keyin / mijoz: orderId+sellerId+cargoServiceType.
 */

const { normalizeCargoCountry } = require("./cargoCountryNormalize");
const {
  CARGO_EXPRESS_POLICY,
  normalizeCargoExpressPolicy,
} = require("./productApproval");

const CARGO_SERVICE_TYPE = {
  STANDARD: "standard",
  EXPRESS: "express",
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

function lookupSelectedCargoServiceType(selectedCargoOptions, countryKey) {
  const canonical = normalizeCargoCountry(countryKey);
  const map =
    selectedCargoOptions && typeof selectedCargoOptions === "object"
      ? selectedCargoOptions
      : {};
  if (!canonical) return CARGO_SERVICE_TYPE.STANDARD;

  for (const [key, value] of Object.entries(map)) {
    if (normalizeCargoCountry(key) !== canonical) continue;
    const type = normalizeCargoServiceType(value);
    if (type) return type;
  }

  return CARGO_SERVICE_TYPE.STANDARD;
}

function firstForeignCountry(countries) {
  const list = Array.isArray(countries) ? countries : [];
  for (const entry of list) {
    const code = normalizeCargoCountry(entry);
    if (code && code !== "uzb") return code;
  }
  return "";
}

/**
 * Checkout: UZB → null; standard_only → standard; aks holda savat tanlovi.
 */
function resolveCheckoutCargoServiceType({
  sellerCountry,
  cargoExpressPolicy,
  itemCountries,
  selectedCargoOptions,
} = {}) {
  const countryHint =
    normalizeCargoCountry(sellerCountry) || firstForeignCountry(itemCountries);
  if (!countryHint || countryHint === "uzb") return null;

  const policy = normalizeCargoExpressPolicy(cargoExpressPolicy);
  if (policy === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_SERVICE_TYPE.STANDARD;
  }

  return lookupSelectedCargoServiceType(selectedCargoOptions, countryHint);
}

function cargoServiceTypeQuery(cargoServiceType) {
  const type = resolveStoredCargoServiceType(cargoServiceType);
  if (type === CARGO_SERVICE_TYPE.EXPRESS) {
    return { cargoServiceType: CARGO_SERVICE_TYPE.EXPRESS };
  }
  return {
    $or: [
      { cargoServiceType: CARGO_SERVICE_TYPE.STANDARD },
      { cargoServiceType: null },
      { cargoServiceType: "" },
      { cargoServiceType: { $exists: false } },
    ],
  };
}

function mergeMongoFilters(base = {}, extra = {}) {
  if (!extra || Object.keys(extra).length === 0) return base;
  const baseOr = base.$or;
  const extraOr = extra.$or;
  if (baseOr && extraOr) {
    const restBase = { ...base };
    delete restBase.$or;
    const restExtra = { ...extra };
    delete restExtra.$or;
    return {
      ...restBase,
      ...restExtra,
      $and: [{ $or: baseOr }, { $or: extraOr }],
    };
  }
  return { ...base, ...extra };
}

function applyCargoLaneMongoFilter(baseFilter, shipment) {
  return mergeMongoFilters(
    baseFilter,
    cargoServiceTypeQuery(shipment?.cargoServiceType),
  );
}

function countCargoLanes(units = []) {
  const counts = { standard: 0, express: 0 };
  for (const unit of Array.isArray(units) ? units : []) {
    const type = resolveStoredCargoServiceType(unit?.cargoServiceType);
    const qty = Math.max(0, Number(unit?.productCount) || 0);
    counts[type] += qty;
  }
  return counts;
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
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
  buildSellerFulfillmentGroupKey,
  buildCargoLaneGroupKey,
  lookupSelectedCargoServiceType,
  resolveCheckoutCargoServiceType,
  cargoServiceTypeQuery,
  mergeMongoFilters,
  applyCargoLaneMongoFilter,
  countCargoLanes,
  resolveGroupCargoServiceType,
};
