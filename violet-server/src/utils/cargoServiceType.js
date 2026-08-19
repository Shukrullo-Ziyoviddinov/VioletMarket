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
const {
  isLocalSellerCountry,
} = require("../productManagement/seller/sellerPipelineMode");
const { HttpError } = require("./httpError");

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

/**
 * Mijoz tracking yo‘lagi: foreign missing → standard (logistica bilan bir xil).
 * UZB / local → null (lane yo‘q). Eski Express tiklanmaydi.
 */
function resolveTrackingCargoServiceType(pipelineMode, value) {
  if (String(pipelineMode || "").trim() !== "foreign") return null;
  return resolveStoredCargoServiceType(value);
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
 * Client: groupCartItemsByCountry → selectedCargoOptions[countryKey].
 * Tartib: countries[] xorij → countries[] (uzb-only) → sellerCountry.
 */
function resolveCartCargoCountryKey({ itemCountries, sellerCountry } = {}) {
  const fromItemForeign = firstForeignCountry(itemCountries);
  if (fromItemForeign) return fromItemForeign;

  const fromItem = firstNormalizedCountry(itemCountries);
  if (fromItem) return fromItem;

  return normalizeCargoCountry(sellerCountry) || "";
}

/**
 * Checkout / savat: UZB siller → null; standard_only → standard.
 * Unrestricted: selectedCargoOptions, keyin storedType; yo‘q bo‘lsa
 * requireSelection → 400, aks holda standard (faqat hisob-kitob, GET stamp emas).
 */
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

/**
 * Savatga yozish: tanlov yoki saqlangan tur. Yo‘q bo‘lsa null —
 * Standard ni o‘zi yozib Express ni yutmasin.
 */
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

/**
 * Qabuldan keyin yo‘lak filtri.
 * Har doim applyCargoLaneMongoFilter(baseFilter, shipment).
 * `{ ...base, ...applyCargoLaneMongoFilter({}, shipment) }` qilmang —
 * Standard $or base $or ni yozib yuboradi, yo‘laklar aralashadi.
 */
function applyCargoLaneMongoFilter(baseFilter, shipment) {
  return mergeMongoFilters(
    baseFilter,
    cargoServiceTypeQuery(shipment?.cargoServiceType),
  );
}

/**
 * Lane badge / guruh soni.
 * productCount 0 bo‘lsa products.length yoki quantity; shipment bor bo‘lsa kamida 1.
 */
function resolveCargoLaneUnitCount(unit) {
  if (!unit || typeof unit !== "object") return 0;

  const fromCount = Math.max(0, Number(unit.productCount) || 0);
  if (fromCount > 0) return fromCount;

  if (Array.isArray(unit.products) && unit.products.length) {
    const fromProducts = unit.products.reduce(
      (sum, product) => sum + Math.max(1, Number(product?.quantity) || 1),
      0,
    );
    if (fromProducts > 0) return fromProducts;
  }

  const fromQty = Math.max(0, Number(unit.quantity) || 0);
  if (fromQty > 0) return fromQty;

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
  resolveTrackingCargoServiceType,
  buildSellerFulfillmentGroupKey,
  buildCargoLaneGroupKey,
  buildCustomerTrackingGroupKey,
  lookupSelectedCargoServiceType,
  normalizeSelectedCargoOptionsMap,
  resolveCartCargoCountryKey,
  resolveCheckoutCargoServiceType,
  resolvePersistedCartCargoServiceType,
  cargoServiceTypeQuery,
  mergeMongoFilters,
  applyCargoLaneMongoFilter,
  resolveCargoLaneUnitCount,
  countCargoLanes,
  resolveGroupCargoServiceType,
};
