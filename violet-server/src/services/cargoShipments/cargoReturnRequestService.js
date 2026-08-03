/**
 * Cargo (logistica) → asosiy admin → logistica «Qaytarish» → siller.
 * Kuryer Ajdaniya zanjiriga aralashmaydi.
 */

const mongoose = require("mongoose");
const {
  CargoReturnRequest,
  ensureCargoReturnRequestIndexes,
} = require("../../models/cargoReturnRequest");
const { CargoShipment, toPublicCargoShipment } = require("../../models/cargoShipment");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeCargoCountry,
  cargoCountriesMatch,
  cargoCountryDisplayLabel,
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
  createCustomerRefundRequestIfNeeded,
} = require("../customerRefund/customerRefundService");
const {
  recordReturnedHistory,
} = require("./cargoLogisticaHistoryService");
const {
  claimAndApplyReturnStockDisposition,
} = require("../../unitLifecycle/stockDisposition");
const { resolveOptionLabel } = require("../../unitLifecycle/optionLabel");
const { normalizeVariant } = require("../../productManagement/variantStockAdjust");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  ensureItemUnits,
  getItemUnit,
  recomputeItemTrackingStatusFromUnits,
  resolveUnitTrackingStatus,
} = require("../../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  areAllOrderItemsSettledForDelivery,
} = require("../../unitLifecycle/deliveryUnitSettlement");
const {
  findShipmentProductByUnitIndex,
  isProductActiveForCargo,
  normalizeCargoUnitIndexes,
  setProductReturnStatus,
  recomputeShipmentStatusFromProducts,
  resolveCargoUnitAmount,
  resolveProductReturnStatus,
  listActiveProductUnitIndexes,
} = require("./cargoShipmentUnitReturn");

function cargoCountryLabel(value) {
  return cargoCountryDisplayLabel(value);
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
 * payload.unitIndex / unitIndexes — dona; berilmasa birinchi faol dona.
 */
async function createCargoReturnRequestForLogistica(
  logisticaId,
  shipmentIdRaw,
  payload = {},
) {
  await ensureCargoReturnRequestIndexes();

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

  if (status === "returned_to_seller") {
    throw new HttpError(409, "Allaqachon qaytarilgan", "SHIPMENT_ALREADY_RETURNED");
  }

  if (shipment.paidAt) {
    throw new HttpError(
      409,
      "To‘langan yukni shu yo‘l bilan qaytarib bo‘lmaydi",
      "SHIPMENT_ALREADY_PAID",
    );
  }

  const processStep = String(shipment.processStep || "")
    .trim()
    .toLowerCase();
  if (processStep === "bojxonada" || processStep === "toshkent_omborida") {
    throw new HttpError(
      409,
      "UZBda bosqichida sotuvchiga qaytarish mumkin emas",
      "UZ_WAREHOUSE_RETURN_FORBIDDEN",
    );
  }

  const hasActiveUnits = listActiveProductUnitIndexes(shipment).length > 0;
  const statusOk =
    status === "pending" ||
    status === "accepted" ||
    (hasActiveUnits &&
      (status === "return_request_pending" || status === "return_approved"));

  if (!statusOk) {
    throw new HttpError(
      409,
      "Bu so‘rovni qaytarib bo‘lmaydi",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  if (
    (status === "accepted" ||
      status === "return_request_pending" ||
      status === "return_approved") &&
    shipment.logisticaId &&
    String(shipment.logisticaId) !== String(logisticaId)
  ) {
    throw new HttpError(403, "Bu so‘rov sizniki emas", "SHIPMENT_FORBIDDEN");
  }

  const unitIndexes = normalizeCargoUnitIndexes(
    payload.unitIndexes ?? payload.unitIndex,
    shipment,
  );
  const unitIndex = unitIndexes[0];
  if (!Number.isInteger(unitIndex) || unitIndex < 0) {
    throw new HttpError(400, "Qaytariladigan donani tanlang", "UNIT_INDEX_REQUIRED");
  }

  const product = findShipmentProductByUnitIndex(shipment, unitIndex);
  if (!product) {
    throw new HttpError(404, "Dona topilmadi", "SHIPMENT_UNIT_NOT_FOUND");
  }

  if (!isProductActiveForCargo(product)) {
    const existing = await CargoReturnRequest.findOne({
      shipmentId: shipment._id,
      unitIndex,
      status: "pending",
    });
    if (existing) {
      return {
        request: toPublicCargoReturnRequest(existing),
        shipment: toPublicCargoShipment(shipment),
        alreadyRequested: true,
      };
    }
    throw new HttpError(
      409,
      "Bu dona allaqachon qaytarish oqimida",
      "UNIT_ALREADY_IN_RETURN",
    );
  }

  const openPending = await CargoReturnRequest.findOne({
    shipmentId: shipment._id,
    unitIndex,
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
  const productId =
    Number(product?.productId) || Number(orderItem?.productId) || 0;
  if (!productId) {
    throw new HttpError(409, "Mahsulot ID topilmadi", "PRODUCT_ID_MISSING");
  }

  const unitAmount = resolveCargoUnitAmount(orderItem, orderItem?.quantity);
  const titleParts = resolveProductTitleParts(product?.title || orderItem?.title);
  const comment = String(payload.comment || "").trim();
  const country =
    normalizeCargoCountry(shipment.sellerCountry) ||
    normalizeCargoCountry(profile.logisticaCountry);

  const previousShipmentStatus =
    status === "accepted" || shipment.acceptedAt ? "accepted" : "pending";

  const created = await CargoReturnRequest.create({
    shipmentId: shipment._id,
    requestCode: String(shipment.requestCode || ""),
    orderId: Number(shipment.orderId),
    itemIndex: Number(shipment.itemIndex) || 0,
    unitIndex,
    productId,
    productCode: formatProductCode(productId),
    sellerId: String(shipment.sellerId || "").trim(),
    storeName: String(shipment.storeName || "").trim(),
    cargoCountry: country,
    title: titleParts,
    amount: unitAmount,
    quantity: 1,
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
    previousShipmentStatus,
    isPaid: isOrderPaid(order),
    orderPaymentStatus: String(order?.status || ""),
    orderedAt: order?.createdAt || shipment.submittedAt || null,
  });

  setProductReturnStatus(shipment, unitIndex, "return_request_pending");
  if (!shipment.logisticaId) {
    shipment.logisticaId = logisticaId;
  }
  recomputeShipmentStatusFromProducts(shipment);
  shipment.markModified("products");
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

  setProductReturnStatus(
    shipment,
    Number(request.unitIndex) || 0,
    "return_approved",
  );
  recomputeShipmentStatusFromProducts(shipment);
  shipment.markModified("products");
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

  const now = new Date();
  request.status = "rejected";
  request.reviewedAt = now;
  request.reviewedBy = reviewedBy;
  request.rejectReason = rejectReason;
  request.set("approvedReasonType", undefined);
  await request.save();

  setProductReturnStatus(shipment, Number(request.unitIndex) || 0, "active");
  recomputeShipmentStatusFromProducts(shipment);
  // Agar faol donalar qolsa — operational; aks holda previous
  if (listActiveProductUnitIndexes(shipment).length) {
    const operational =
      request.previousShipmentStatus === "accepted" || shipment.acceptedAt
        ? "accepted"
        : "pending";
    if (
      ["return_request_pending", "return_approved"].includes(
        String(shipment.status || ""),
      )
    ) {
      shipment.status = operational;
    }
  } else if (String(shipment.status) !== "returned_to_seller") {
    shipment.status =
      request.previousShipmentStatus === "accepted" ? "accepted" : "pending";
  }
  shipment.markModified("products");
  await shipment.save();

  return {
    request: toPublicCargoReturnRequest(request),
    shipment: toPublicCargoShipment(shipment),
  };
}

/**
 * Qaytarish board: Admin kutmoqda + Tasdiqlangan (har bo‘lim pagination).
 */
async function listCargoReturnsBoardForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);

  const limit = Math.min(100, Math.max(1, Math.floor(toNumber(query.limit, 30))));
  const pendingPage = Math.max(1, Math.floor(toNumber(query.pendingPage, 1)));
  const approvedPage = Math.max(1, Math.floor(toNumber(query.approvedPage, 1)));

  const pendingFilter = { logisticaId, status: "pending" };
  const approvedFilter = {
    logisticaId,
    status: "approved",
    completedAt: null,
  };

  const [pendingTotal, pendingRows, approvedTotal, approvedRows] =
    await Promise.all([
      CargoReturnRequest.countDocuments(pendingFilter),
      CargoReturnRequest.find(pendingFilter)
        .sort({ createdAt: -1 })
        .skip((pendingPage - 1) * limit)
        .limit(limit)
        .lean(),
      CargoReturnRequest.countDocuments(approvedFilter),
      CargoReturnRequest.find(approvedFilter)
        .sort({ reviewedAt: -1, createdAt: -1 })
        .skip((approvedPage - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

  return {
    limit,
    pending: {
      page: pendingPage,
      limit,
      total: pendingTotal,
      totalPages: Math.max(1, Math.ceil(pendingTotal / limit) || 1),
      items: pendingRows.map(toLogisticaReturnCard),
    },
    approved: {
      page: approvedPage,
      limit,
      total: approvedTotal,
      totalPages: Math.max(1, Math.ceil(approvedTotal / limit) || 1),
      items: approvedRows.map(toLogisticaReturnCard),
    },
  };
}

async function markOrderItemReturnedToSellerFromCargo(
  orderId,
  itemIndex,
  sellerId,
  at,
  unitIndexRaw = 0,
) {
  const order = await Order.findOne({ id: Number(orderId) });
  if (!order) return;

  const item = order.items?.[itemIndex];
  if (!item || String(item.sellerId || "").trim() !== String(sellerId).trim()) {
    return;
  }

  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  ensureItemUnits(item, at);
  const unit = getItemUnit(item, unitIndex);
  if (unit) {
    const unitStatus = resolveUnitTrackingStatus(item, unitIndex);
    // delivered (kuryer Sotildi) ga tegilmaydi
    if (unitStatus !== "delivered" && unitStatus !== "returned_to_seller") {
      unit.trackingStatus = "returned_to_seller";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({
        status: "returned_to_seller",
        at,
        note: "cargo_return_defective",
      });
    }
  }

  const previous = normalizeOrderTrackingStatus(item.trackingStatus);
  recomputeItemTrackingStatusFromUnits(item);
  const next = normalizeOrderTrackingStatus(item.trackingStatus);
  if (next && next !== previous) {
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    const last = item.trackingHistory[item.trackingHistory.length - 1];
    if (String(last?.status || "") !== next) {
      item.trackingHistory.push({
        status: next,
        at,
        note: "cargo_return_defective",
      });
    }
  }

  order.markModified("items");

  // Multi-item / mixed courier+cargo: oxirgi cargo qaytarishda order delivered
  if (
    (await areAllOrderItemsSettledForDelivery(order)) &&
    String(order.status) !== "delivered"
  ) {
    order.status = "delivered";
  }

  await order.save();
}

function isDuplicateKeyError(err) {
  return Boolean(err && (err.code === 11000 || err.code === 11001));
}

async function resolveOrderCustomer(order) {
  if (!order?.userId) {
    return { firstName: "", lastName: "", phone: "" };
  }
  const user = await User.findById(order.userId)
    .select("firstName lastName phone")
    .lean();
  if (!user) {
    return { firstName: "", lastName: "", phone: "" };
  }
  return {
    firstName: String(user.firstName || "").trim(),
    lastName: String(user.lastName || "").trim(),
    phone: String(user.phone || "").trim(),
  };
}

/**
 * Shu cargo so‘roviga tegishli CourierReturnedOrder (yarim yoki to‘liq).
 * Boshqa manba (kuryer) birlikni egallagan bo‘lsa — conflict.
 */
async function findCargoReturnedOrderForResume(request) {
  const unitFilter = {
    orderId: Number(request.orderId),
    itemIndex: Number(request.itemIndex),
    unitIndex: Number(request.unitIndex) || 0,
  };

  if (request.returnedOrderId) {
    const byLink = await CourierReturnedOrder.findById(request.returnedOrderId);
    if (byLink) return { doc: byLink, conflict: false };
  }

  const byRequest = await CourierReturnedOrder.findOne({
    cargoReturnRequestId: request._id,
  });
  if (byRequest) return { doc: byRequest, conflict: false };

  const byUnit = await CourierReturnedOrder.findOne(unitFilter);
  if (!byUnit) return { doc: null, conflict: false };

  const sameCargo =
    String(byUnit.source || "") === "cargo" &&
    (String(byUnit.cargoReturnRequestId || "") === String(request._id) ||
      String(byUnit.shipmentId || "") === String(request.shipmentId));

  if (sameCargo) return { doc: byUnit, conflict: false };
  return { doc: byUnit, conflict: true };
}

function buildCargoReturnedOrderPayload({
  request,
  shipment,
  profile,
  order,
  customer,
  qty,
  variant,
  returnedAt,
  periodKeys,
}) {
  const cargoCountry = normalizeCargoCountry(request.cargoCountry);
  return {
    source: "cargo",
    shipmentId: shipment._id,
    cargoReturnRequestId: request._id,
    cargoCountry,
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
      lastName: cargoCountryLabel(cargoCountry),
      phone: "",
      email: "",
    },
    customer: {
      firstName: String(customer?.firstName || ""),
      lastName: String(customer?.lastName || ""),
      phone: String(customer?.phone || ""),
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
  };
}

/**
 * Yangi yoki mavjud (resume) CourierReturnedOrder.
 */
async function ensureCargoReturnedOrderDoc(ctx) {
  const { request } = ctx;
  const cargoCountry = normalizeCargoCountry(request.cargoCountry);
  const found = await findCargoReturnedOrderForResume(request);
  if (found.conflict) {
    throw new HttpError(
      409,
      "Bu mahsulot allaqachon qaytarilganlar ro‘yxatida",
      "RETURNED_ORDER_EXISTS",
    );
  }

  if (found.doc) {
    const doc = found.doc;
    doc.source = "cargo";
    doc.shipmentId = ctx.shipment._id;
    doc.cargoReturnRequestId = request._id;
    doc.cargoCountry = cargoCountry;
    doc.reasonType = "defective";
    doc.productId = Number(request.productId) || doc.productId;
    doc.sellerId = String(request.sellerId || doc.sellerId || "").trim();
    doc.quantity = ctx.qty;
    doc.color = ctx.variant.color;
    doc.size = ctx.variant.size;
    doc.storage = ctx.variant.storage;
    doc.model = ctx.variant.model;
    if (ctx.customer) {
      doc.customer = {
        firstName: String(ctx.customer.firstName || ""),
        lastName: String(ctx.customer.lastName || ""),
        phone: String(ctx.customer.phone || ""),
      };
    }
    if (ctx.order) {
      doc.isPaid = isOrderPaid(ctx.order) || Boolean(request.isPaid);
      doc.orderPaymentStatus = String(ctx.order.status || "");
    }
    await doc.save();
    return { doc, created: false };
  }

  try {
    const created = await CourierReturnedOrder.create(
      buildCargoReturnedOrderPayload(ctx),
    );
    return { doc: created, created: true };
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    const again = await findCargoReturnedOrderForResume(request);
    if (again.conflict || !again.doc) throw err;
    again.doc.source = "cargo";
    again.doc.shipmentId = ctx.shipment._id;
    again.doc.cargoReturnRequestId = request._id;
    again.doc.cargoCountry = cargoCountry;
    again.doc.reasonType = "defective";
    if (ctx.customer) {
      again.doc.customer = {
        firstName: String(ctx.customer.firstName || ""),
        lastName: String(ctx.customer.lastName || ""),
        phone: String(ctx.customer.phone || ""),
      };
    }
    await again.doc.save();
    return { doc: again.doc, created: false };
  }
}

/**
 * Ombor + tracking + shipment + request + (paid bo‘lsa) mijoz refund.
 * Qayta chaqirilsa xavfsiz.
 */
async function finishCargoDefectiveConfirmSteps({
  request,
  shipment,
  returnedDoc,
  qty,
  variant,
  returnedAt,
}) {
  await claimAndApplyReturnStockDisposition({
    returnedOrderId: returnedDoc._id,
    reasonType: "defective",
    productId: request.productId,
    qty: Math.max(1, Math.floor(Number(qty) || 1)),
    variant,
  });

  await markOrderItemReturnedToSellerFromCargo(
    request.orderId,
    request.itemIndex,
    request.sellerId,
    returnedAt,
    Number(request.unitIndex) || 0,
  );

  setProductReturnStatus(
    shipment,
    Number(request.unitIndex) || 0,
    "returned",
  );
  recomputeShipmentStatusFromProducts(shipment);
  if (String(shipment.status) === "returned_to_seller") {
    shipment.returnedAt = shipment.returnedAt || returnedAt;
  }
  shipment.markModified("products");
  await shipment.save();

  // Online to‘lov — asosiy admin «Mijozga pul qaytarish» (naqd emas)
  const freshForRefund = await CourierReturnedOrder.findById(returnedDoc._id);
  if (freshForRefund) {
    await createCustomerRefundRequestIfNeeded(freshForRefund);
  }

  /**
   * Tarix completed dan oldin — yiqilsa request approved qoladi, qayta «Ha» resume.
   * Xato yutilmaydi (throw).
   */
  await recordReturnedHistory(shipment, {
    at: returnedAt,
    amount: Number(request.amount) || 0,
    cargoReturnRequestId: request._id,
  });

  if (String(request.status) !== "completed") {
    request.status = "completed";
    request.completedAt = returnedAt;
    request.returnedOrderId = returnedDoc._id;
    await request.save();
  } else if (
    !request.returnedOrderId ||
    String(request.returnedOrderId) !== String(returnedDoc._id)
  ) {
    request.returnedOrderId = returnedDoc._id;
    await request.save();
  }
}

/**
 * Logistica Ha — Yaroqsiz: ombordan olib tashlash, siller «Qaytarilgan»ga.
 * Qayta urinish (resume): yarim yozuvni topib qolgan qadamlarni tugatadi.
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

  if (String(request.status) === "completed") {
    const existing = request.returnedOrderId
      ? await CourierReturnedOrder.findById(request.returnedOrderId).lean()
      : null;
    const shipment = await CargoShipment.findById(request.shipmentId);
    // Oldingi urinishda Tarix yozilmagan bo‘lsa — idempotent to‘ldirish
    if (shipment) {
      await recordReturnedHistory(shipment, {
        at: request.completedAt || shipment.returnedAt || new Date(),
        amount: Number(request.amount) || Number(existing?.amount) || 0,
        cargoReturnRequestId: request._id,
      });
    }
    return {
      request: toPublicCargoReturnRequest(request),
      returned: toPublicReturnedOrder(existing),
      shipment: shipment ? toPublicCargoShipment(shipment) : null,
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
    .select("status paidAt createdAt items paymentMethod userId")
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
  const customer = await resolveOrderCustomer(order);

  const { doc: returnedDoc, created } = await ensureCargoReturnedOrderDoc({
    request,
    shipment,
    profile,
    order,
    customer,
    qty,
    variant,
    returnedAt,
    periodKeys,
  });

  await finishCargoDefectiveConfirmSteps({
    request,
    shipment,
    returnedDoc,
    qty,
    variant,
    returnedAt,
  });

  const freshReturned = await CourierReturnedOrder.findById(returnedDoc._id).lean();

  return {
    request: toPublicCargoReturnRequest(request),
    returned: toPublicReturnedOrder(freshReturned),
    shipment: toPublicCargoShipment(shipment),
    alreadyCompleted: false,
    resumed: !created,
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
  listCargoReturnsBoardForLogistica,
  confirmCargoReturnByLogistica,
  findCargoReturnRequestById,
  toPublicCargoReturnRequest,
  cargoCountryLabel,
};
