/**
 * Logistica app — cargo so‘rovlarini o‘qish (GET).
 * Qabul / qaytarish / saqlash — keyingi bullak.
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

const DEFAULT_PAGE_SIZE = 20;

function assertActiveLogistica(profile) {
  if (!profile) {
    throw new HttpError(404, "Logistica akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (profile.status === "pending") {
    throw new HttpError(403, "Admin tasdiqlashini kuting", "ACCOUNT_PENDING");
  }
  if (profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }
}

async function loadActiveLogistica(logisticaId) {
  if (!mongoose.isValidObjectId(logisticaId)) {
    throw new HttpError(401, "Avtorizatsiya noto‘g‘ri", "UNAUTHORIZED");
  }
  const profile = await LogisticaProfile.findById(logisticaId)
    .select({ status: 1, logisticaCountry: 1, companyName: 1 })
    .lean();
  assertActiveLogistica(profile);
  return profile;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  return String(title || "").trim() || "Mahsulot";
}

function buildVariantLabel(product) {
  const parts = [
    product?.color,
    product?.size,
    product?.storage,
    product?.model,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.join(" / ");
}

/** Asosiy sahifa kartochkasi — logistica UI mock maydonlari */
function toLogisticaShipmentCard(doc) {
  const row = doc || {};
  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    dateTime: formatDateTime(row.submittedAt || row.createdAt),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: row.weightLabel || "Taxminiy og'irlik",
    status: String(row.status || "pending"),
    sellerCountry: String(row.sellerCountry || ""),
    submittedAt: row.submittedAt || row.createdAt || null,
  };
}

/** Detail — logistica shipment/[id] mock maydonlari */
function toLogisticaShipmentDetail(doc) {
  const row = doc || {};
  const products = (Array.isArray(row.products) ? row.products : []).map(
    (product, index) => ({
      id: `${row._id}-${Number(product.unitIndex) || index}`,
      title: resolveProductTitle(product.title),
      variant: buildVariantLabel(product),
      weightKg: Math.max(0, Number(product.weightKg) || 0),
      quantity: Math.max(1, Number(product.quantity) || 1),
      productId: Number(product.productId) || 0,
      color: String(product.color || ""),
      size: String(product.size || ""),
      storage: String(product.storage || ""),
      model: String(product.model || ""),
      image: String(product.image || "/img/no-image.png"),
      unitIndex: Number(product.unitIndex) || 0,
    }),
  );

  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    dateTime: formatDateTime(row.submittedAt || row.createdAt),
    productCount: Math.max(0, Number(row.productCount) || products.length),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: row.weightLabel || "Taxminiy og'irlik",
    warehouseAddress: String(row.warehouseAddress || ""),
    note: String(row.note || ""),
    products,
    activeProcessStep: row.processStep || null,
    status: String(row.status || "pending"),
    sellerId: String(row.sellerId || ""),
    sellerCountry: String(row.sellerCountry || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    submittedAt: row.submittedAt || row.createdAt || null,
    acceptedAt: row.acceptedAt || null,
  };
}

/**
 * Asosiy: pending so‘rovlar — logistica davlati = siller davlati.
 */
async function listPendingShipmentsForLogistica(logisticaId, query = {}) {
  const profile = await loadActiveLogistica(logisticaId);
  const country = String(profile.logisticaCountry || "")
    .trim()
    .toLowerCase();

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );

  const filter = {
    status: "pending",
    sellerCountry: country,
  };

  const [total, rows] = await Promise.all([
    CargoShipment.countDocuments(filter),
    CargoShipment.find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    logisticaCountry: country,
    shipments: rows.map(toLogisticaShipmentCard),
  };
}

/**
 * Detail: bitta so‘rov.
 * Pending — o‘z davlati. Accepted — faqat shu logistica qabul qilgan bo‘lsa.
 */
async function getShipmentDetailForLogistica(logisticaId, shipmentIdRaw) {
  const profile = await loadActiveLogistica(logisticaId);
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const row = await CargoShipment.findById(shipmentId).lean();
  if (!row) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const country = String(profile.logisticaCountry || "")
    .trim()
    .toLowerCase();
  const sellerCountry = String(row.sellerCountry || "")
    .trim()
    .toLowerCase();

  if (sellerCountry !== country) {
    throw new HttpError(403, "Bu so‘rov sizning davlatingizga tegishli emas", "SHIPMENT_FORBIDDEN");
  }

  const status = String(row.status || "");
  if (status === "pending") {
    return { shipment: toLogisticaShipmentDetail(row) };
  }

  if (
    status === "accepted" &&
    row.logisticaId &&
    String(row.logisticaId) === String(logisticaId)
  ) {
    return { shipment: toLogisticaShipmentDetail(row) };
  }

  throw new HttpError(403, "Bu so‘rovni ko‘rish mumkin emas", "SHIPMENT_FORBIDDEN");
}

module.exports = {
  listPendingShipmentsForLogistica,
  getShipmentDetailForLogistica,
  toLogisticaShipmentCard,
  toLogisticaShipmentDetail,
};
