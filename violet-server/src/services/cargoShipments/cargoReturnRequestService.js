/**
 * Cargo (logistica) → asosiy admin → logistica «Qaytarish» → siller.
 * Kuryer Ajdaniya zanjiriga aralashmaydi.
 */

const mongoose = require("mongoose");
const { CargoReturnRequest } = require("../../models/cargoReturnRequest");
const { CargoShipment, toPublicCargoShipment } = require("../../models/cargoShipment");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { Order } = require("../../models/order");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeCargoCountry,
  cargoCountriesMatch,
} = require("../../utils/cargoCountryNormalize");
const {
  notifyAdminReturnRequestSubmitted,
} = require("../adminNotifications/adminNotificationService");
const {
  isOrderPaid,
  resolvePeriodKeys,
  toPublicReturnedOrder,
} = require("../deliveryOrders/courierReturnOrderService");
const {
  claimAndApplyReturnStockDisposition,
} = require("../../unitLifecycle/stockDisposition");
const { resolveOptionLabel } = require("../../unitLifecycle/optionLabel");
const { normalizeVariant } = require("../../productManagement/variantStockAdjust");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

const CARGO_COUNTRY_LABELS = {
  china: "Xitoy",
  korea: "Koreya",
  turkiya: "Turkiya",
  turkey: "Turkiya",
  usa: "AQSH",
  japan: "Yaponiya",
};

function cargoCountryLabel(value) {
  const key = normalizeCargoCountry(value);
  return CARGO_COUNTRY_LABELS[key] || key || "—";
}

function resolveProductTitleParts(title) {
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  const text = String(title || "").trim();
  return { uz: text, ru: text };
}

function formatProductCode(productId) {
  const id = Number(productId) || 0;
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
}

function toPublicCargoReturnRequest(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const country = normalizeCargoCountry(row.cargoCountry || row.logistica?.country);
  return {
    id: String(row._id),
    source: "cargo",
    shipmentId: String(row.shipmentId || ""),
    requestCode: String(row.requestCode || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    storeName: String(row.storeName || ""),
    cargoCountry: country,
    cargoCountryLabel: cargoCountryLabel(country),
    title: {
      uz: String(row.title?.uz || ""),
      ru: String(row.title?.ru || ""),
    },
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    logisticaId: String(row.logisticaId || ""),
    logistica: {
      companyName: String(row.logistica?.companyName || ""),
      country: String(row.logistica?.country || ""),
    },
    courier: {
      firstName: String(row.logistica?.companyName || "Cargo"),
      lastName: cargoCountryLabel(country),
      phone: "",
      email: "",
    },
    customer: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    status: String(row.status || "pending"),
    comment: String(row.comment || ""),
    approvedReasonType: row.approvedReasonType || null,
    reviewedBy: String(row.reviewedBy || ""),
    reviewedAt: row.reviewedAt || null,
    rejectReason: String(row.rejectReason || ""),
    previousShipmentStatus: String(row.previousShipmentStatus || ""),
    isPaid: Boolean(row.isPaid),
    orderPaymentStatus: String(row.orderPaymentStatus || ""),
    orderedAt: row.orderedAt || null,
    completedAt: row.completedAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    allowedReasonTypes: ["defective"],
  };
}

function toLogisticaReturnCard(doc) {
  const row = doc || {};
  const title = resolveProductTitleParts(row.title);
  return {
    id: String(row._id),
    shipmentId: String(row.shipmentId || ""),
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    productTitle: title.uz || title.ru || "Mahsulot",
    productCode: String(row.productCode || ""),
    orderId: Number(row.orderId) || 0,
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    cargoCountry: normalizeCargoCountry(row.cargoCountry),
    cargoCountryLabel: cargoCountryLabel(row.cargoCountry),
    approvedReasonType: row.approvedReasonType || null,
    reviewedAt: row.reviewedAt || null,
    status: String(row.status || ""),
  };
}

async function loadActiveLogistica(logisticaId) {
  if (!mongoose.isValidObjectId(logisticaId)) {
    throw new HttpError(401, "Avtorizatsiya noto‘g‘ri", "UNAUTHORIZED");
  }
  const profile = await LogisticaProfile.findById(logisticaId)
    .select({ status: 1, logisticaCountry: 1, companyName: 1 })
    .lean();
  if (!profile) {
    throw new HttpError(404, "Logistica akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (profile.status === "pending") {
    throw new HttpError(403, "Admin tasdiqlashini kuting", "ACCOUNT_PENDING");
  }
  if (profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }
  return profile;
}

/**
 * «Sotuvchiga qaytarish» — admin kutadigan so‘rov (darhol qaytarmaydi).
 */
async function createCargoReturnRequestForLogistica(
  logisticaId,
  shipmentIdRaw,
  payload = {},
) {
  const profile = await loadActiveLogistica(logisticaId);
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  if (!cargoCountriesMatch(profile.logisticaCountry, shipment.sellerCountry)) {
    throw new HttpError(
      403,
      "Bu so‘rov sizning davlatingizga tegishli emas",
      "SHIPMENT_FORBIDDEN",
    );
  }

  const status = String(shipment.status || "");
  if (status === "return_request_pending") {
    const existing = await CargoReturnRequest.findOne({
      shipmentId: shipment._id,
      status: "pending",
    });
    if (existing) {
      return {
        request: toPublicCargoReturnRequest(existing),
        shipment: toPublicCargoShipment(shipment),
        alreadyRequested: true,
      };
    }
  }

  if (status === "return_approved") {
    throw new HttpError(
      409,
      "Admin allaqachon tasdiqlagan — «Qaytarish» sahifasidan yakunlang",
      "RETURN_ALREADY_APPROVED",
    );
  }

  if (status === "returned_to_seller") {
    throw new HttpError(409, "Allaqachon qaytarilgan", "SHIPMENT_ALREADY_RETURNED");
  }

  if (status !== "pending" && status !== "accepted") {
    throw new HttpError(
      409,
      "Bu so‘rovni qaytarib bo‘lmaydi",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  if (shipment.paidAt) {
    throw new HttpError(
      409,
      "To‘langan yukni shu yo‘l bilan qaytarib bo‘lmaydi",
      "SHIPMENT_ALREADY_PAID",
    );
  }

  if (
    status === "accepted" &&
    shipment.logisticaId &&
    String(shipment.logisticaId) !== String(logisticaId)
  ) {
    throw new HttpError(403, "Bu so‘rov sizniki emas", "SHIPMENT_FORBIDDEN");
  }

  const openPending = await CargoReturnRequest.findOne({
    shipmentId: shipment._id,
    status: "pending",
  }).lean();
  if (openPending) {
    throw new HttpError(409, "Ochiq so‘rov allaqachon bor", "RETURN_REQUEST_EXISTS");
  }

  const order = await Order.findOne({ id: shipment.orderId })
    .select("status paidAt createdAt items paymentMethod")
    .lean();
  const orderItem = Array.isArray(order?.items)
    ? order.items[Number(shipment.itemIndex)]
    : null;
  const product = Array.isArray(shipment.products) ? shipment.products[0] : null;
  const productId =
    Number(product?.productId) || Number(orderItem?.productId) || 0;
  if (!productId) {
    throw new HttpError(409, "Mahsulot ID topilmadi", "PRODUCT_ID_MISSING");
  }

  const qty = Math.max(
    1,
    Math.floor(toNumber(product?.quantity, toNumber(orderItem?.quantity, 1))),
  );
  const unitAmount =
    Math.max(0, toNumber(orderItem?.lineTotal, 0)) ||
    Math.max(0, toNumber(orderItem?.price, 0)) * qty;
  const titleParts = resolveProductTitleParts(product?.title || orderItem?.title);
  const comment = String(payload.comment || "").trim();
  const country =
    normalizeCargoCountry(shipment.sellerCountry) ||
    normalizeCargoCountry(profile.logisticaCountry);

  const created = await CargoReturnRequest.create({
    shipmentId: shipment._id,
    requestCode: String(shipment.requestCode || ""),
    orderId: Number(shipment.orderId),
    itemIndex: Number(shipment.itemIndex) || 0,
    unitIndex: Number(product?.unitIndex) || 0,
    productId,
    productCode: formatProductCode(productId),
    sellerId: String(shipment.sellerId || "").trim(),
    storeName: String(shipment.storeName || "").trim(),
    cargoCountry: country,
    title: titleParts,
    amount: unitAmount,
    quantity: qty,
    imageUrl: String(product?.image || orderItem?.image || ""),
    color: resolveOptionLabel(product?.color) || resolveOptionLabel(orderItem?.color),
    size: resolveOptionLabel(product?.size) || resolveOptionLabel(orderItem?.size),
    storage:
      resolveOptionLabel(product?.storage) || resolveOptionLabel(orderItem?.storage),
    model: resolveOptionLabel(product?.model) || resolveOptionLabel(orderItem?.model),
    logisticaId,
    logistica: {
      companyName: String(profile.companyName || "").trim(),
      country: normalizeCargoCountry(profile.logisticaCountry),
    },
    status: "pending",
    comment,
    previousShipmentStatus: status === "accepted" ? "accepted" : "pending",
    isPaid: isOrderPaid(order),
    orderPaymentStatus: String(order?.status || ""),
    orderedAt: order?.createdAt || shipment.submittedAt || null,
  });

  shipment.status = "return_request_pending";
  if (!shipment.logisticaId) {
    shipment.logisticaId = logisticaId;
  }
  await shipment.save();

  try {
    await notifyAdminReturnRequestSubmitted({
      ...created.toObject(),
      courier: {
        firstName: String(profile.companyName || "Cargo"),
        lastName: cargoCountryLabel(country),
      },
    });
  } catch (err) {
    console.error("Admin cargo return request notification:", err?.message || err);
  }

  return {
    request: toPublicCargoReturnRequest(created),
    shipment: toPublicCargoShipment(shipment),
    alreadyRequested: false,
  };
}

async function listCargoReturnRequestsForAdmin(query = {}) {
  const status = String(query.status || "pending").trim().toLowerCase();
  const barcode = String(query.barcode || query.productCode || query.q || "")
    .trim()
    .toLowerCase();
  const filter = {};
  if (status && status !== "all") {
    if (status === "approved") {
      filter.status = { $in: ["approved", "completed"] };
    } else {
      filter.status = status;
    }
  }
  if (barcode) {
    filter.productCode = {
      $regex: barcode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const rows = await CargoReturnRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return rows.map(toPublicCargoReturnRequest);
}

async function approveCargoReturnRequest(requestId, payload = {}) {
  const id = String(requestId || "").trim();
  const reasonType = String(payload.reasonType || payload.approvedReasonType || "")
    .trim()
    .toLowerCase();
  const reviewedBy = String(payload.reviewedBy || "admin").trim();

  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_REQUEST_ID");
  }

  if (reasonType !== "defective") {
    throw new HttpError(
      400,
      "Cargo qaytarishda hozircha faqat «Yaroqsiz» tanlanadi",
      "INVALID_REASON_TYPE",
    );
  }

  const request = await CargoReturnRequest.findById(id);
  if (!request) {
    throw new HttpError(404, "So‘rov topilmadi", "RETURN_REQUEST_NOT_FOUND");
  }
  if (String(request.status) !== "pending") {
    throw new HttpError(409, "So‘rov allaqachon ko‘rib chiqilgan", "RETURN_REQUEST_NOT_PENDING");
  }

  const shipment = await CargoShipment.findById(request.shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const now = new Date();
  request.status = "approved";
  request.approvedReasonType = "defective";
  request.reviewedAt = now;
  request.reviewedBy = reviewedBy;
  request.rejectReason = "";
  await request.save();

  shipment.status = "return_approved";
  await shipment.save();

  return {
    request: toPublicCargoReturnRequest(request),
    shipment: toPublicCargoShipment(shipment),
  };
}

async function rejectCargoReturnRequest(requestId, payload = {}) {
  const id = String(requestId || "").trim();
  const rejectReason = String(payload.rejectReason || payload.reason || "").trim();
  const reviewedBy = String(payload.reviewedBy || "admin").trim();

  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_REQUEST_ID");
  }

  const request = await CargoReturnRequest.findById(id);
  if (!request) {
    throw new HttpError(404, "So‘rov topilmadi", "RETURN_REQUEST_NOT_FOUND");
  }
  if (String(request.status) !== "pending") {
    throw new HttpError(409, "So‘rov allaqachon ko‘rib chiqilgan", "RETURN_REQUEST_NOT_PENDING");
  }

  const shipment = await CargoShipment.findById(request.shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const restoreStatus =
    request.previousShipmentStatus === "accepted" ? "accepted" : "pending";

  const now = new Date();
  request.status = "rejected";
  request.reviewedAt = now;
  request.reviewedBy = reviewedBy;
  request.rejectReason = rejectReason;
  request.set("approvedReasonType", undefined);
  await request.save();

  shipment.status = restoreStatus;
  await shipment.save();

  return {
    request: toPublicCargoReturnRequest(request),
    shipment: toPublicCargoShipment(shipment),
  };
}

async function listApprovedCargoReturnsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(100, Math.max(1, Math.floor(toNumber(query.limit, 50))));

  const filter = {
    logisticaId,
    status: "approved",
    completedAt: null,
  };

  const [total, rows] = await Promise.all([
    CargoReturnRequest.countDocuments(filter),
    CargoReturnRequest.find(filter)
      .sort({ reviewedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    items: rows.map(toLogisticaReturnCard),
  };
}

async function markOrderItemReturnedToSellerFromCargo(orderId, itemIndex, sellerId, at) {
  const order = await Order.findOne({ id: Number(orderId) });
  if (!order) return;

  const item = order.items?.[itemIndex];
  if (!item || String(item.sellerId || "").trim() !== String(sellerId).trim()) {
    return;
  }

  const current = String(item.trackingStatus || "");
  if (current === "returned_to_seller") return;

  item.trackingStatus = "returned_to_seller";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({
    status: "returned_to_seller",
    at,
    note: "cargo_return_defective",
  });
  order.markModified("items");
  await order.save();
}

/**
 * Logistica Ha — Yaroqsiz: ombordan olib tashlash, siller «Qaytarilgan»ga.
 */
async function confirmCargoReturnByLogistica(logisticaId, requestIdRaw) {
  const profile = await loadActiveLogistica(logisticaId);
  const requestId = String(requestIdRaw || "").trim();
  if (!mongoose.isValidObjectId(requestId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_REQUEST_ID");
  }

  const request = await CargoReturnRequest.findById(requestId);
  if (!request) {
    throw new HttpError(404, "So‘rov topilmadi", "RETURN_REQUEST_NOT_FOUND");
  }
  if (String(request.logisticaId) !== String(logisticaId)) {
    throw new HttpError(403, "Bu so‘rov sizniki emas", "RETURN_FORBIDDEN");
  }

  if (String(request.status) === "completed" && request.returnedOrderId) {
    const existing = await CourierReturnedOrder.findById(request.returnedOrderId).lean();
    return {
      request: toPublicCargoReturnRequest(request),
      returned: toPublicReturnedOrder(existing),
      alreadyCompleted: true,
    };
  }

  if (String(request.status) !== "approved") {
    throw new HttpError(
      409,
      "Avval asosiy admin tasdiqlashi kerak",
      "RETURN_NOT_APPROVED",
    );
  }

  if (String(request.approvedReasonType) !== "defective") {
    throw new HttpError(
      409,
      "Faqat Yaroqsiz qaytarish yakunlanadi",
      "INVALID_REASON_TYPE",
    );
  }

  const shipment = await CargoShipment.findById(request.shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const order = await Order.findOne({ id: request.orderId })
    .select("status paidAt createdAt items paymentMethod")
    .lean();

  const returnedAt = new Date();
  const periodKeys = resolvePeriodKeys(returnedAt);
  const qty = Math.max(1, Math.floor(Number(request.quantity) || 1));
  const variant = normalizeVariant({
    color: request.color,
    size: request.size,
    storage: request.storage,
    model: request.model,
  });

  const existingUnit = await CourierReturnedOrder.findOne({
    orderId: Number(request.orderId),
    itemIndex: Number(request.itemIndex),
    unitIndex: Number(request.unitIndex) || 0,
  });
  if (existingUnit) {
    throw new HttpError(
      409,
      "Bu mahsulot allaqachon qaytarilganlar ro‘yxatida",
      "RETURNED_ORDER_EXISTS",
    );
  }

  const returnedDoc = await CourierReturnedOrder.create({
    source: "cargo",
    shipmentId: shipment._id,
    cargoReturnRequestId: request._id,
    orderId: Number(request.orderId),
    itemIndex: Number(request.itemIndex) || 0,
    unitIndex: Number(request.unitIndex) || 0,
    productId: Number(request.productId),
    productCode: String(request.productCode || ""),
    sellerId: String(request.sellerId || "").trim(),
    title: {
      uz: String(request.title?.uz || ""),
      ru: String(request.title?.ru || ""),
    },
    amount: Math.max(0, Number(request.amount) || 0),
    quantity: qty,
    imageUrl: String(request.imageUrl || ""),
    color: variant.color,
    size: variant.size,
    storage: variant.storage,
    model: variant.model,
    courier: {
      firstName: String(profile.companyName || "Cargo"),
      lastName: cargoCountryLabel(request.cargoCountry),
      phone: "",
      email: "",
    },
    customer: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    reasonType: "defective",
    comment: String(request.comment || ""),
    orderedAt: request.orderedAt || order?.createdAt || null,
    returnedAt,
    dateKey: periodKeys.dateKey,
    weekKey: periodKeys.weekKey,
    monthKey: periodKeys.monthKey,
    orderPaymentStatus: String(order?.status || request.orderPaymentStatus || ""),
    isPaid: isOrderPaid(order) || Boolean(request.isPaid),
    stockReleased: false,
    stockDiscarded: false,
  });

  await claimAndApplyReturnStockDisposition({
    returnedOrderId: returnedDoc._id,
    reasonType: "defective",
    productId: request.productId,
    qty,
    variant,
  });

  await markOrderItemReturnedToSellerFromCargo(
    request.orderId,
    request.itemIndex,
    request.sellerId,
    returnedAt,
  );

  shipment.status = "returned_to_seller";
  shipment.returnedAt = returnedAt;
  await shipment.save();

  request.status = "completed";
  request.completedAt = returnedAt;
  request.returnedOrderId = returnedDoc._id;
  await request.save();

  const freshReturned = await CourierReturnedOrder.findById(returnedDoc._id).lean();

  return {
    request: toPublicCargoReturnRequest(request),
    returned: toPublicReturnedOrder(freshReturned),
    shipment: toPublicCargoShipment(shipment),
    alreadyCompleted: false,
  };
}

async function findCargoReturnRequestById(id) {
  if (!id || !mongoose.isValidObjectId(id)) return null;
  return CargoReturnRequest.findById(id);
}

module.exports = {
  createCargoReturnRequestForLogistica,
  listCargoReturnRequestsForAdmin,
  approveCargoReturnRequest,
  rejectCargoReturnRequest,
  listApprovedCargoReturnsForLogistica,
  confirmCargoReturnByLogistica,
  findCargoReturnRequestById,
  toPublicCargoReturnRequest,
  cargoCountryLabel,
};
