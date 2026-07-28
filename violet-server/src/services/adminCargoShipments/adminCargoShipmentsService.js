/**
 * Asosiy admin — cargo / logistica jarayon monitoring.
 * Logistica app bilan bir xil CargoShipment processStep (chalkashmaydi).
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

const DEFAULT_PAGE_SIZE = 100;
const PROCESS_STEP_SET = new Set(LOGISTICA_PROCESS_STEPS);

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

function toAdminShipmentCard(row, sellerMap, logisticaMap) {
  const sellerId = String(row.sellerId || "");
  const seller = sellerMap.get(sellerId);
  const logisticaId = row.logisticaId ? String(row.logisticaId) : "";
  const logistica = logisticaId ? logisticaMap.get(logisticaId) : null;
  const firstProduct = Array.isArray(row.products) ? row.products[0] : null;
  const country = normalizeCargoCountry(row.sellerCountry) || String(row.sellerCountry || "");

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
    productId: Number(firstProduct?.productId) || 0,
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    status: String(row.status || ""),
    processStep: row.processStep || null,
    processStepLabel: processStepLabel(row.processStep),
    paidAt: row.paidAt || null,
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
      at: null,
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
    processSteps: LOGISTICA_PROCESS_STEPS.map((key) => ({
      key,
      label: processStepLabel(key),
    })),
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

/**
 * Filter uchun: qabul qilingan yuklar bor davlatlar (avtomatik).
 */
async function listAdminCargoShipmentCountries() {
  const rows = await CargoShipment.aggregate([
    { $match: { status: "accepted" } },
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
 * Qabul qilingan cargo so‘rovlari (jarayon monitoring).
 */
async function listAdminCargoShipments(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const countryRaw = String(query.sellerCountry || query.country || "")
    .trim()
    .toLowerCase();
  const country = countryRaw ? normalizeCargoCountry(countryRaw) || countryRaw : "";

  const filter = { status: "accepted" };
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
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const row = await CargoShipment.findById(shipmentId).lean();
  if (!row) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const sellerMap = await loadSellerMap([row.sellerId]);
  const logisticaMap = await loadLogisticaMap([row.logisticaId]);
  return {
    shipment: toAdminShipmentDetail(row, sellerMap, logisticaMap),
  };
}

/**
 * Admin jarayon holatini o‘zgartiradi — logistica app bilan bir xil maydon.
 */
async function updateAdminCargoShipmentProcessStep(shipmentIdRaw, processStepRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const processStep = String(processStepRaw || "")
    .trim()
    .toLowerCase();
  if (!PROCESS_STEP_SET.has(processStep)) {
    throw new HttpError(400, "Jarayon holati noto‘g‘ri", "INVALID_PROCESS_STEP");
  }

  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }
  if (String(shipment.status || "") !== "accepted") {
    throw new HttpError(
      409,
      "Faqat qabul qilingan so‘rov holatini o‘zgartirish mumkin",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  shipment.processStep = processStep;
  await shipment.save();

  const sellerMap = await loadSellerMap([shipment.sellerId]);
  const logisticaMap = await loadLogisticaMap([shipment.logisticaId]);
  return {
    shipment: toAdminShipmentDetail(shipment.toObject(), sellerMap, logisticaMap),
  };
}

module.exports = {
  listAdminCargoShipmentCountries,
  listAdminCargoShipments,
  getAdminCargoShipmentDetail,
  updateAdminCargoShipmentProcessStep,
  LOGISTICA_PROCESS_STEPS,
};
