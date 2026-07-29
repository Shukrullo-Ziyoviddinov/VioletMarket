/**
 * Logistica — cargo so‘rov: o‘qish, qabul, jarayon, sotuvchiga qaytarish.
 * UZB kuryer zanjiriga aralashmaydi (ko‘prik alohida: foreignUzCourierBridgeService).
 */

const mongoose = require("mongoose");
const { CargoShipment, toPublicCargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  cargoCountriesMatch,
  cargoCountryMatchValues,
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");
const {
  createCargoReturnRequestForLogistica,
} = require("./cargoReturnRequestService");
const {
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
  applyAcceptShipment,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  canLogisticaMarkPaid,
} = require("./cargoShipmentProcessActions");

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
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ""),
    uzArrivalComment: String(row.uzArrivalComment || ""),
    uzArrivedAt: row.uzArrivedAt || null,
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    customerCargoFeePaymentMethod: row.customerCargoFeePaymentMethod || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
    acceptedAt: row.acceptedAt || null,
    returnedAt: row.returnedAt || null,
    paidAt: row.paidAt || null,
    canMarkPaid: canLogisticaMarkPaid(row),
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

  if (
    status === "returned_to_seller" ||
    status === "return_request_pending" ||
    status === "return_approved"
  ) {
    return { shipment: toLogisticaShipmentDetail(row) };
  }

  throw new HttpError(403, "Bu so‘rovni ko‘rish mumkin emas", "SHIPMENT_FORBIDDEN");
}

/**
 * Qabul: pending → accepted; order item → handed_to_cargo.
 */
async function acceptShipmentForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const result = await applyAcceptShipment(shipment, logisticaId);
  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyAccepted: Boolean(result.alreadyAccepted),
  };
}

/**
 * Jarayon stepi — faqat Yuklarim bosqichlari (xitoy → yolda → bojxona).
 * Toshkent: arriveShipmentAtUzWarehouseForLogistica (Clientga yuborish).
 */
async function updateShipmentProcessStepForLogistica(
  logisticaId,
  shipmentIdRaw,
  processStepRaw,
) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(
      409,
      "Avval so‘rovni qabul qiling",
      "SHIPMENT_NOT_ACCEPTED",
    );
  }
  await applyYuklarimProcessStep(shipment, processStepRaw);
  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
  };
}

/**
 * UZB ish stoli — Clientga yuborish:
 * og‘irlik + summa → processStep = toshkent_omborida.
 * Mijozga so‘rov yuborish — keyingi qadam.
 */
async function arriveShipmentAtUzWarehouseForLogistica(
  logisticaId,
  shipmentIdRaw,
  payload = {},
) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }
  const result = await applyUzWarehouseArrival(shipment, payload);
  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyArrived: Boolean(result.alreadyArrived),
  };
}

/**
 * Sotuvchiga qaytarish so‘rovi — asosiy admin tasdiqlamaguncha yakunlanmaydi.
 * Yakunlash: cargoReturnRequestService.confirmCargoReturnByLogistica
 */
async function returnShipmentToSellerForLogistica(logisticaId, shipmentIdRaw, payload = {}) {
  const result = await createCargoReturnRequestForLogistica(
    logisticaId,
    shipmentIdRaw,
    payload,
  );
  const lean = await CargoShipment.findById(result.shipment.id).lean();
  return {
    request: result.request,
    shipment: toLogisticaShipmentDetail(lean),
    alreadyRequested: Boolean(result.alreadyRequested),
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
 * Yuklarim — qabul qilingan, hali UZB oqimiga (bojxona+) o‘tmagan.
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
      { processStep: { $nin: UZB_WAREHOUSE_LIST_STEPS } },
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
 * UZBda — bojxonada (kelish kutilmoqda) yoki toshkent (To‘landi kutilmoqda).
 */
async function listUzWarehouseShipmentsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const { page, limit } = paginateQuery(query);

  const filter = {
    status: "accepted",
    logisticaId,
    processStep: { $in: UZB_WAREHOUSE_LIST_STEPS },
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
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }
  const result = await applyMarkShipmentPaid(shipment);
  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyPaid: Boolean(result.alreadyPaid),
  };
}

module.exports = {
  listPendingShipmentsForLogistica,
  listAcceptedShipmentsForLogistica,
  listUzWarehouseShipmentsForLogistica,
  getShipmentDetailForLogistica,
  acceptShipmentForLogistica,
  updateShipmentProcessStepForLogistica,
  arriveShipmentAtUzWarehouseForLogistica,
  returnShipmentToSellerForLogistica,
  markShipmentPaidForLogistica,
  toLogisticaShipmentCard,
  toLogisticaShipmentDetail,
  toPublicCargoShipment,
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
};
