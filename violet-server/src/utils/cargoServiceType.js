/**
 * Server cargo tarifi — Mongo, checkout, savat.
 * Asosiy qoidalar: @volet/cargo-service-rules
 */

const { normalizeCargoCountry } = require("./cargoCountryNormalize");
const {
  CARGO_EXPRESS_POLICY,
  normalizeCargoExpressPolicy,
} = require("./productApproval");
const {
  isLocalSellerCountry,
} = require("../productManagement/seller/sellerPipelineMode");
const { HttpError } = require("./httpError");
const rules = require("@volet/cargo-service-rules");

const {
  CARGO_SERVICE_TYPE,
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
  resolveTrackingCargoServiceType,
  buildSellerFulfillmentGroupKey,
  buildCargoLaneGroupKey,
  resolveShipmentListGroupKey,
  resolveCargoLaneUnitCount,
  countCargoLanes,
  resolveGroupCargoServiceType,
  isMixedCargoLanes,
} = rules;

function buildCustomerTrackingGroupKey(
  orderId,
  sellerId,
  pipelineMode,
  cargoServiceType,
) {
  if (String(pipelineMode || "").trim() === "foreign") {
    return buildCargoLaneGroupKey(orderId, sellerId, cargoServiceType);
  }
  return buildSellerFulfillmentGroupKey(orderId, sellerId);
}

/**
 * UZB last-mile / delivery pool.
 * Xorij (standard|express) → orderId:sellerId:lane.
 * UZB / turi yo‘q → eski order-{orderId}.
 */
function buildDeliveryLastMileGroupKey(orderId, sellerId, cargoServiceType) {
  const oid = Number(orderId) || 0;
  const type = normalizeCargoServiceType(cargoServiceType);
  if (oid && type) {
    const key = buildCargoLaneGroupKey(oid, sellerId, type);
    if (key) return key;
  }
  return oid ? `order-${oid}` : "";
}

function normalizeSelectedCargoOptionsMap(raw) {
  const map =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [key, value] of Object.entries(map)) {
    const country = normalizeCargoCountry(key);
    const type = normalizeCargoServiceType(value);
    if (!country || country === "uzb" || !type) continue;
    out[country] = type;
  }
  return out;
}

function lookupSelectedCargoServiceType(selectedCargoOptions, countryKey) {
  const canonical = normalizeCargoCountry(countryKey);
  if (!canonical) return null;
  const map = normalizeSelectedCargoOptionsMap(selectedCargoOptions);
  return map[canonical] || null;
}

function firstNormalizedCountry(countries) {
  const list = Array.isArray(countries) ? countries : [];
  for (const entry of list) {
    const code = normalizeCargoCountry(entry);
    if (code) return code;
  }
  return "";
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
 * Savat bloki bilan bir xil davlat kaliti.
 */
function resolveCartCargoCountryKey({ itemCountries, sellerCountry } = {}) {
  const fromItemForeign = firstForeignCountry(itemCountries);
  if (fromItemForeign) return fromItemForeign;

  const fromItem = firstNormalizedCountry(itemCountries);
  if (fromItem) return fromItem;

  return normalizeCargoCountry(sellerCountry) || "";
}

function resolveCheckoutCargoServiceType({
  sellerCountry,
  cargoExpressPolicy,
  itemCountries,
  selectedCargoOptions,
  storedType,
  requireSelection = false,
} = {}) {
  if (isLocalSellerCountry(sellerCountry)) return null;

  const countryKey = resolveCartCargoCountryKey({
    itemCountries,
    sellerCountry,
  });
  if (!countryKey || countryKey === "uzb") return null;

  const policy = normalizeCargoExpressPolicy(cargoExpressPolicy);
  if (policy === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_SERVICE_TYPE.STANDARD;
  }

  const selected = lookupSelectedCargoServiceType(
    selectedCargoOptions,
    countryKey,
  );
  if (selected) return selected;

  const stored = normalizeCargoServiceType(storedType);
  if (stored) return stored;

  if (requireSelection) {
    throw new HttpError(
      400,
      "Xorij yetkazish turi tanlanmagan (Standard yoki Express)",
      "CARGO_SERVICE_REQUIRED",
    );
  }

  return CARGO_SERVICE_TYPE.STANDARD;
}

function resolvePersistedCartCargoServiceType({
  sellerCountry,
  cargoExpressPolicy,
  itemCountries,
  selectedCargoOptions,
  storedType,
} = {}) {
  if (isLocalSellerCountry(sellerCountry)) return null;

  const countryKey = resolveCartCargoCountryKey({
    itemCountries,
    sellerCountry,
  });
  if (!countryKey || countryKey === "uzb") return null;

  const policy = normalizeCargoExpressPolicy(cargoExpressPolicy);
  if (policy === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_SERVICE_TYPE.STANDARD;
  }

  const selected = lookupSelectedCargoServiceType(
    selectedCargoOptions,
    countryKey,
  );
  if (selected) return selected;

  return normalizeCargoServiceType(storedType);
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

module.exports = {
  ...rules,
  buildCustomerTrackingGroupKey,
  buildDeliveryLastMileGroupKey,
  lookupSelectedCargoServiceType,
  normalizeSelectedCargoOptionsMap,
  resolveCartCargoCountryKey,
  resolveCheckoutCargoServiceType,
  resolvePersistedCartCargoServiceType,
  cargoServiceTypeQuery,
  mergeMongoFilters,
  applyCargoLaneMongoFilter,
};
