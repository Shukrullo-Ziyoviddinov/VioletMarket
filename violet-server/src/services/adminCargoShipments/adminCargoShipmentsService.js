/**
 * Asosiy admin — cargo / logistica jarayon monitoring + amallar.
 * Amallar bitta qoida: cargoShipmentProcessActions (logistica app bilan bir xil).
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  LOGISTICA_PROCESS_STEPS,
} = require("../../productManagement/foreignOrderTracking");
const {
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");
const {
  YUKLARIM_PROCESS_STEPS,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  canLogisticaMarkPaid,
} = require("../cargoShipments/cargoShipmentProcessActions");

const DEFAULT_PAGE_SIZE = 100;

const COUNTRY_LABELS = {
  china: "China",
  xitoy: "China",
  usa: "AQSH",
  aqsh: "AQSH",
  turkiya: "Turkiya",
  turkey: "Turkiya",
  korea: "Koreya",
  koreya: "Koreya",
  japan: "Yaponiya",
};

function countryLabel(code) {
  const key = normalizeCargoCountry(code) || String(code || "").trim().toLowerCase();
  return COUNTRY_LABELS[key] || key.toUpperCase() || "—";
}

function processStepLabel(step) {
  const map = {
    xitoy_omborida: "Xitoy omborida",
    yolda: "Yo‘lda",
    bojxonada: "Bojxonada",
    toshkent_omborida: "Toshkent omborida",
  };
  const key = String(step || "").trim();
  return map[key] || (key ? key : "Qabul qilindi");
}

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  return String(title || "").trim() || "Mahsulot";
}

function formatProductCode(productId) {
  const id = Number(productId) || 0;
  return id > 0 ? `#${String(id).padStart(4, "0")}` : "—";
}

function toAdminShipmentCard(row, sellerMap, logisticaMap) {
  const sellerId = String(row.sellerId || "");
  const seller = sellerMap.get(sellerId);
  const logisticaId = row.logisticaId ? String(row.logisticaId) : "";
  const logistica = logisticaId ? logisticaMap.get(logisticaId) : null;
  const firstProduct = Array.isArray(row.products) ? row.products[0] : null;
  const country = normalizeCargoCountry(row.sellerCountry) || String(row.sellerCountry || "");
  const productId = Number(firstProduct?.productId) || 0;

  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    sellerId,
    sellerName: seller?.name || sellerId || "Noma’lum siller",
    sellerCountry: country,
    sellerCountryLabel: countryLabel(country),
    productTitle: resolveProductTitle(firstProduct?.title || row.storeName),
    productId,
    productCode: formatProductCode(productId),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    status: String(row.status || ""),
    processStep: row.processStep || null,
    processStepLabel: processStepLabel(row.processStep),
    paidAt: row.paidAt || null,
    uzArrivedAt: row.uzArrivedAt || null,
    uzArrivalComment: String(row.uzArrivalComment || ""),
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    canMarkPaid: canLogisticaMarkPaid(row),
    acceptedAt: row.acceptedAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
    logisticaId: logisticaId || null,
    logisticaCompanyName: logistica?.companyName || "—",
    logisticaCountry: logistica?.logisticaCountry || country,
  };
}

function toAdminShipmentDetail(row, sellerMap, logisticaMap) {
  const card = toAdminShipmentCard(row, sellerMap, logisticaMap);
  const stepIndex = LOGISTICA_PROCESS_STEPS.indexOf(String(row.processStep || ""));
  const timeline = [
    {
      key: "accepted",
      label: "Qabul qilindi",
      done: String(row.status || "") === "accepted" || Boolean(row.acceptedAt),
      at: row.acceptedAt || null,
    },
    ...LOGISTICA_PROCESS_STEPS.map((key, index) => ({
      key,
      label: processStepLabel(key),
      done: stepIndex >= 0 && index <= stepIndex,
      at: key === "toshkent_omborida" ? row.uzArrivedAt || null : null,
    })),
    {
      key: "paid",
      label: "To‘landi",
      done: Boolean(row.paidAt),
      at: row.paidAt || null,
    },
  ];

  return {
    ...card,
    storeName: String(row.storeName || ""),
    warehouseAddress: String(row.warehouseAddress || ""),
    note: String(row.note || ""),
    products: (Array.isArray(row.products) ? row.products : []).map((p, i) => ({
      id: `${row._id}-${i}`,
      title: resolveProductTitle(p.title),
      productId: Number(p.productId) || 0,
      color: String(p.color || ""),
      size: String(p.size || ""),
      storage: String(p.storage || ""),
      model: String(p.model || ""),
      quantity: Math.max(1, Number(p.quantity) || 1),
      weightKg: Math.max(0, Number(p.weightKg) || 0),
    })),
    timeline,
    processSteps: YUKLARIM_PROCESS_STEPS.map((key) => ({
      key,
      label: processStepLabel(key),
    })),
    toshkentStep: {
      key: "toshkent_omborida",
      label: processStepLabel("toshkent_omborida"),
      done: String(row.processStep || "") === "toshkent_omborida" && Boolean(row.uzArrivedAt),
    },
  };
}

async function loadSellerMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return new Map();
  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name sellerCountry")
    .lean();
  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        sellerCountry: String(row.sellerCountry || ""),
      },
    ]),
  );
}

async function loadLogisticaMap(logisticaIds = []) {
  const ids = [
    ...new Set(
      logisticaIds
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  ];
  if (!ids.length) return new Map();
  const rows = await LogisticaProfile.find({ _id: { $in: ids } })
    .select({ companyName: 1, logisticaCountry: 1 })
    .lean();
  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        companyName: String(row.companyName || ""),
        logisticaCountry: String(row.logisticaCountry || ""),
      },
    ]),
  );
}

async function loadShipmentDoc(shipmentIdRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }
  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }
  return shipment;
}

async function toAdminDetailResponse(shipment) {
  const row = typeof shipment.toObject === "function" ? shipment.toObject() : shipment;
  const sellerMap = await loadSellerMap([row.sellerId]);
  const logisticaMap = await loadLogisticaMap([row.logisticaId]);
  return {
    shipment: toAdminShipmentDetail(row, sellerMap, logisticaMap),
  };
}

async function listAdminCargoShipmentCountries() {
  const rows = await CargoShipment.aggregate([
    { $match: { status: "accepted", paidAt: null } },
    {
      $group: {
        _id: { $toLower: "$sellerCountry" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const byCanonical = new Map();
  for (const row of rows) {
    const raw = String(row._id || "").trim().toLowerCase();
    if (!raw) continue;
    const code = normalizeCargoCountry(raw) || raw;
    const prev = byCanonical.get(code) || { code, count: 0, label: countryLabel(code) };
    prev.count += Number(row.count) || 0;
    byCanonical.set(code, prev);
  }

  return {
    countries: [...byCanonical.values()].sort((a, b) => b.count - a.count),
  };
}

/**
 * Qabul qilingan, hali To‘lanmagan (Xorij→UZB ga o‘tmagan).
 */
async function listAdminCargoShipments(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const countryRaw = String(query.sellerCountry || query.country || "")
    .trim()
    .toLowerCase();
  const country = countryRaw ? normalizeCargoCountry(countryRaw) || countryRaw : "";

  const filter = { status: "accepted", paidAt: null };
  if (country) {
    const aliases = [country];
    if (country === "turkiya") aliases.push("turkey");
    if (country === "china") aliases.push("xitoy");
    if (country === "usa") aliases.push("aqsh", "us");
    if (country === "korea") aliases.push("koreya");
    filter.sellerCountry = { $in: aliases };
  }

  const [total, rows] = await Promise.all([
    CargoShipment.countDocuments(filter),
    CargoShipment.find(filter)
      .sort({ acceptedAt: -1, submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const sellerMap = await loadSellerMap(rows.map((r) => r.sellerId));
  const logisticaMap = await loadLogisticaMap(rows.map((r) => r.logisticaId));

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    shipments: rows.map((row) => toAdminShipmentCard(row, sellerMap, logisticaMap)),
  };
}

async function getAdminCargoShipmentDetail(shipmentIdRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  return toAdminDetailResponse(shipment);
}

async function updateAdminCargoShipmentProcessStep(shipmentIdRaw, processStepRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  await applyYuklarimProcessStep(shipment, processStepRaw);
  return toAdminDetailResponse(shipment);
}

async function arriveAdminCargoShipmentUzWarehouse(shipmentIdRaw, payload = {}) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  const result = await applyUzWarehouseArrival(shipment, payload);
  const data = await toAdminDetailResponse(shipment);
  return { ...data, alreadyArrived: Boolean(result.alreadyArrived) };
}

async function markAdminCargoShipmentPaid(shipmentIdRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  const result = await applyMarkShipmentPaid(shipment);
  const data = await toAdminDetailResponse(shipment);
  return { ...data, alreadyPaid: Boolean(result.alreadyPaid) };
}

module.exports = {
  listAdminCargoShipmentCountries,
  listAdminCargoShipments,
  getAdminCargoShipmentDetail,
  updateAdminCargoShipmentProcessStep,
  arriveAdminCargoShipmentUzWarehouse,
  markAdminCargoShipmentPaid,
  LOGISTICA_PROCESS_STEPS,
  YUKLARIM_PROCESS_STEPS,
};
