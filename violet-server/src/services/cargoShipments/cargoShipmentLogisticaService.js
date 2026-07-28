/**
 * Logistica — cargo so‘rov: o‘qish, qabul, jarayon, sotuvchiga qaytarish.
 * UZB kuryer zanjiriga aralashmaydi (ko‘prik alohida: foreignUzCourierBridgeService).
 */

const mongoose = require("mongoose");
const { CargoShipment, toPublicCargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { Order } = require("../../models/order");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  LOGISTICA_PROCESS_STEPS,
} = require("../../productManagement/foreignOrderTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  cargoCountriesMatch,
  cargoCountryMatchValues,
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");

const DEFAULT_PAGE_SIZE = 20;
const PROCESS_STEP_SET = new Set(LOGISTICA_PROCESS_STEPS);

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

function assertShipmentCountryAccess(profile, row) {
  if (!cargoCountriesMatch(profile.logisticaCountry, row.sellerCountry)) {
    throw new HttpError(
      403,
      "Bu so‘rov sizning davlatingizga tegishli emas",
      "SHIPMENT_FORBIDDEN",
    );
  }
}

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
    processStep: row.processStep || null,
    paidAt: row.paidAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
  };
}

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
    returnedAt: row.returnedAt || null,
    paidAt: row.paidAt || null,
  };
}

async function loadShipmentForLogistica(logisticaId, shipmentIdRaw) {
  const profile = await loadActiveLogistica(logisticaId);
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  assertShipmentCountryAccess(profile, shipment);
  return { profile, shipment };
}

/**
 * Order item: ready_for_cargo → handed_to_cargo (logistica qabul).
 */
async function markOrderItemHandedToCargo(orderId, itemIndex, sellerId, at) {
  const order = await Order.findOne({ id: Number(orderId) });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }
  const item = order.items?.[itemIndex];
  if (!item || String(item.sellerId || "").trim() !== String(sellerId).trim()) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const status = normalizeOrderTrackingStatus(item.trackingStatus);
  if (status === "handed_to_cargo") {
    return { order, item, already: true };
  }
  if (status !== "ready_for_cargo") {
    throw new HttpError(
      409,
      "Buyurtma cargoga yuborilmagan",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  item.trackingStatus = "handed_to_cargo";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "handed_to_cargo", at });
  order.markModified("items");
  await order.save();
  return { order, item, already: false };
}

/**
 * Sotuvchiga qaytarish: ready_for_cargo | handed_to_cargo → collected.
 */
async function revertOrderItemToCollected(orderId, itemIndex, sellerId, at) {
  const order = await Order.findOne({ id: Number(orderId) });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }
  const item = order.items?.[itemIndex];
  if (!item || String(item.sellerId || "").trim() !== String(sellerId).trim()) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const status = normalizeOrderTrackingStatus(item.trackingStatus);
  if (status === "collected") {
    return { order, item, already: true };
  }
  if (status !== "ready_for_cargo" && status !== "handed_to_cargo") {
    throw new HttpError(
      409,
      "Bu holatda sotuvchiga qaytarib bo‘lmaydi",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  item.trackingStatus = "collected";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({
    status: "collected",
    at,
    note: "cargo_returned_to_seller",
  });
  order.markModified("items");
  await order.save();
  return { order, item, already: false };
}

async function listPendingShipmentsForLogistica(logisticaId, query = {}) {
  const profile = await loadActiveLogistica(logisticaId);
  const countryValues = cargoCountryMatchValues(profile.logisticaCountry);

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );

  const filter = {
    status: "pending",
    sellerCountry: { $in: countryValues.length ? countryValues : ["__none__"] },
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
    logisticaCountry: normalizeCargoCountry(profile.logisticaCountry),
    shipments: rows.map(toLogisticaShipmentCard),
  };
}

async function getShipmentDetailForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const row = shipment.toObject ? shipment.toObject() : shipment;
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

  if (status === "returned_to_seller") {
    return { shipment: toLogisticaShipmentDetail(row) };
  }

  throw new HttpError(403, "Bu so‘rovni ko‘rish mumkin emas", "SHIPMENT_FORBIDDEN");
}

/**
 * Qabul: pending → accepted; order item → handed_to_cargo.
 */
async function acceptShipmentForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const status = String(shipment.status || "");

  if (status === "accepted" && String(shipment.logisticaId) === String(logisticaId)) {
    return {
      shipment: toLogisticaShipmentDetail(shipment.toObject()),
      alreadyAccepted: true,
    };
  }

  if (status !== "pending") {
    throw new HttpError(
      409,
      "Faqat kutilayotgan so‘rovni qabul qilish mumkin",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  const acceptedAt = new Date();
  await markOrderItemHandedToCargo(
    shipment.orderId,
    shipment.itemIndex,
    shipment.sellerId,
    acceptedAt,
  );

  shipment.status = "accepted";
  shipment.logisticaId = logisticaId;
  shipment.acceptedAt = acceptedAt;
  shipment.processStep = null;
  shipment.sellerCountry =
    normalizeCargoCountry(shipment.sellerCountry) || shipment.sellerCountry;
  await shipment.save();

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyAccepted: false,
  };
}

/**
 * Jarayon stepi — faqat accepted + shu logistica.
 */
async function updateShipmentProcessStepForLogistica(
  logisticaId,
  shipmentIdRaw,
  processStepRaw,
) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const status = String(shipment.status || "");

  if (status !== "accepted" || String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(
      409,
      "Avval so‘rovni qabul qiling",
      "SHIPMENT_NOT_ACCEPTED",
    );
  }

  const processStep = String(processStepRaw || "")
    .trim()
    .toLowerCase();
  if (!PROCESS_STEP_SET.has(processStep)) {
    throw new HttpError(400, "Jarayon holati noto‘g‘ri", "INVALID_PROCESS_STEP");
  }

  shipment.processStep = processStep;
  await shipment.save();

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
  };
}

/**
 * Sotuvchiga qaytarish: pending|accepted → returned_to_seller; item → collected.
 */
async function returnShipmentToSellerForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const status = String(shipment.status || "");

  if (status === "returned_to_seller") {
    return {
      shipment: toLogisticaShipmentDetail(shipment.toObject()),
      alreadyReturned: true,
    };
  }

  if (status !== "pending" && status !== "accepted") {
    throw new HttpError(
      409,
      "Bu so‘rovni qaytarib bo‘lmaydi",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  if (
    status === "accepted" &&
    shipment.logisticaId &&
    String(shipment.logisticaId) !== String(logisticaId)
  ) {
    throw new HttpError(403, "Bu so‘rov sizniki emas", "SHIPMENT_FORBIDDEN");
  }

  const returnedAt = new Date();
  await revertOrderItemToCollected(
    shipment.orderId,
    shipment.itemIndex,
    shipment.sellerId,
    returnedAt,
  );

  shipment.status = "returned_to_seller";
  shipment.returnedAt = returnedAt;
  if (!shipment.logisticaId) {
    shipment.logisticaId = logisticaId;
  }
  await shipment.save();

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyReturned: false,
  };
}

function paginateQuery(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );
  return { page, limit };
}

/**
 * Yuklarim — qabul qilingan, hali Toshkent omboriga yetmagan (to‘lanmagan).
 */
async function listAcceptedShipmentsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const { page, limit } = paginateQuery(query);

  const filter = {
    status: "accepted",
    logisticaId,
    paidAt: null,
    $or: [
      { processStep: null },
      { processStep: { $exists: false } },
      { processStep: { $ne: "toshkent_omborida" } },
    ],
  };

  const [total, rows] = await Promise.all([
    CargoShipment.countDocuments(filter),
    CargoShipment.find(filter)
      .sort({ acceptedAt: -1, submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    shipments: rows.map(toLogisticaShipmentCard),
  };
}

/**
 * UZBda — Toshkent omborida, hali To‘landi bosilmagan.
 */
async function listUzWarehouseShipmentsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const { page, limit } = paginateQuery(query);

  const filter = {
    status: "accepted",
    logisticaId,
    processStep: "toshkent_omborida",
    paidAt: null,
  };

  const [total, rows] = await Promise.all([
    CargoShipment.countDocuments(filter),
    CargoShipment.find(filter)
      .sort({ updatedAt: -1, acceptedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    shipments: rows.map(toLogisticaShipmentCard),
  };
}

/**
 * To‘landi — faqat Toshkent omborida. Keyin asosiy admin Xorij→UZB ga chiqadi.
 */
async function markShipmentPaidForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const status = String(shipment.status || "");

  if (status !== "accepted" || String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }

  if (String(shipment.processStep || "") !== "toshkent_omborida") {
    throw new HttpError(
      409,
      "Avval «Toshkent omborida» holatini belgilang",
      "NOT_IN_UZ_WAREHOUSE",
    );
  }

  if (shipment.paidAt) {
    return {
      shipment: toLogisticaShipmentDetail(shipment.toObject()),
      alreadyPaid: true,
    };
  }

  shipment.paidAt = new Date();
  await shipment.save();

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyPaid: false,
  };
}

module.exports = {
  listPendingShipmentsForLogistica,
  listAcceptedShipmentsForLogistica,
  listUzWarehouseShipmentsForLogistica,
  getShipmentDetailForLogistica,
  acceptShipmentForLogistica,
  updateShipmentProcessStepForLogistica,
  returnShipmentToSellerForLogistica,
  markShipmentPaidForLogistica,
  toLogisticaShipmentCard,
  toLogisticaShipmentDetail,
  toPublicCargoShipment,
};
