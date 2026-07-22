const { Order } = require("../../models/order");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { CourierReturnRequest } = require("../../models/courierReturnRequest");
const { HttpError } = require("../../utils/httpError");
const { releaseReservedStockOnReturn } = require("../../productManagement/markProductsAsSold");
const {
  notifyAdminReturnRequestSubmitted,
} = require("../adminNotifications/adminNotificationService");
const {
  isOrderPaid,
  resolvePeriodKeys,
  toPublicReturnedOrder,
} = require("../deliveryOrders/courierReturnOrderService");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
  attachSellerPickup,
  applyCourierKmPayment,
} = require("../deliveryOrders/courierOrderAssignmentService");

const REASON_TYPES = new Set(["no_answer", "return"]);
const REQUESTABLE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

const RETURN_ADVANCE_ACTIONS = {
  go_return_to_seller: {
    from: ["return_to_seller"],
    to: "en_route_return_to_seller",
    atField: "enRouteReturnToSellerAt",
    errorMessage: "Avval sotuvchiga qaytarishni boshlang",
  },
  arrive_return_seller: {
    from: ["en_route_return_to_seller"],
    to: "arrived_return_at_seller",
    atField: "arrivedReturnAtSellerAt",
    errorMessage: "Avval sotuvchiga yo‘lga chiqing",
  },
};

function toPublicReturnRequest(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    assignmentId: String(row.assignmentId || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    title: {
      uz: String(row.title?.uz || ""),
      ru: String(row.title?.ru || ""),
    },
    amount: Math.max(0, Number(row.amount) || 0),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    deliveryId: String(row.deliveryId || ""),
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    customer: {
      firstName: String(row.customer?.firstName || ""),
      lastName: String(row.customer?.lastName || ""),
      phone: String(row.customer?.phone || ""),
    },
    status: String(row.status || "pending"),
    comment: String(row.comment || ""),
    approvedReasonType: row.approvedReasonType || null,
    reviewedBy: String(row.reviewedBy || ""),
    reviewedAt: row.reviewedAt || null,
    rejectReason: String(row.rejectReason || ""),
    isPaid: Boolean(row.isPaid),
    orderPaymentStatus: String(row.orderPaymentStatus || ""),
    orderedAt: row.orderedAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

async function mapAssignmentPublic(assignment) {
  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(assignment, payment),
  ]);
  return publicRow;
}

/**
 * Ajdaniya → faqat so‘rov (admin kutadi).
 */
async function createReturnRequestByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const comment = String(payload.comment || "").trim();

  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  const status = String(assignment.status || "");
  if (status === "delivered" || status === "returned") {
    throw new HttpError(409, "Bu buyurtmani qaytarib bo‘lmaydi", "ASSIGNMENT_TERMINAL");
  }
  if (status === "return_request_pending") {
    const existing = await CourierReturnRequest.findOne({
      assignmentId: assignment._id,
      status: "pending",
    }).lean();
    if (existing) return toPublicReturnRequest(existing);
  }
  if (!REQUESTABLE_STATUSES.has(status)) {
    throw new HttpError(
      409,
      "Avval sotuvchidan mahsulotni oling",
      "ASSIGNMENT_NOT_PICKED_UP",
    );
  }

  const openPending = await CourierReturnRequest.findOne({
    assignmentId: assignment._id,
    status: "pending",
  }).lean();
  if (openPending) {
    throw new HttpError(409, "Ochiq so‘rov allaqachon bor", "RETURN_REQUEST_EXISTS");
  }

  const order = await Order.findOne({ id: assignment.orderId })
    .select("status paidAt createdAt items paymentMethod")
    .lean();
  const paid = isOrderPaid(order);
  const orderItem = Array.isArray(order?.items)
    ? order.items[Number(assignment.itemIndex)]
    : null;
  const sellerId =
    String(assignment.sellerId || "").trim() ||
    String(orderItem?.sellerId || "").trim();
  if (!sellerId) {
    throw new HttpError(409, "Siller ID topilmadi", "SELLER_ID_MISSING");
  }

  const created = await CourierReturnRequest.create({
    assignmentId: assignment._id,
    orderId: assignment.orderId,
    itemIndex: assignment.itemIndex,
    unitIndex: assignment.unitIndex,
    productId: assignment.productId,
    productCode: String(assignment.productCode || ""),
    sellerId,
    title: {
      uz: String(assignment.title?.uz || ""),
      ru: String(assignment.title?.ru || ""),
    },
    amount: Math.max(0, Number(assignment.amount) || 0),
    imageUrl: String(assignment.imageUrl || ""),
    color: String(assignment.color || ""),
    size: String(assignment.size || ""),
    storage: String(assignment.storage || ""),
    model: String(assignment.model || ""),
    deliveryId: assignment.deliveryId,
    courier: {
      firstName: String(assignment.courier?.firstName || ""),
      lastName: String(assignment.courier?.lastName || ""),
      phone: String(assignment.courier?.phone || ""),
      email: String(assignment.courier?.email || ""),
    },
    customer: {
      firstName: String(assignment.customer?.firstName || ""),
      lastName: String(assignment.customer?.lastName || ""),
      phone: String(assignment.customer?.phone || ""),
    },
    status: "pending",
    comment,
    isPaid: paid,
    orderPaymentStatus: String(order?.status || ""),
    orderedAt: order?.createdAt || assignment.acceptedAt || null,
  });

  assignment.status = "return_request_pending";
  await assignment.save();

  try {
    await notifyAdminReturnRequestSubmitted(created);
  } catch (err) {
    console.error("Admin return request notification:", err?.message || err);
  }

  return {
    request: toPublicReturnRequest(created),
    assignment: await mapAssignmentPublic(assignment),
  };
}

async function listReturnRequestsForAdmin(query = {}) {
  const status = String(query.status || "pending").trim().toLowerCase();
  const barcode = String(query.barcode || query.productCode || query.q || "")
    .trim()
    .toLowerCase();
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (barcode) {
    filter.productCode = { $regex: barcode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const rows = await CourierReturnRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return {
    total: rows.length,
    items: rows.map(toPublicReturnRequest),
  };
}

async function approveReturnRequest(requestId, payload = {}) {
  const id = String(requestId || "").trim();
  const reasonType = String(payload.reasonType || payload.approvedReasonType || "")
    .trim()
    .toLowerCase();
  const reviewedBy = String(payload.reviewedBy || "admin").trim();

  if (!id) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_REQUEST_ID");
  }
  if (!REASON_TYPES.has(reasonType)) {
    throw new HttpError(400, "Sabab turi noto‘g‘ri", "INVALID_REASON_TYPE");
  }

  const request = await CourierReturnRequest.findById(id);
  if (!request) {
    throw new HttpError(404, "So‘rov topilmadi", "RETURN_REQUEST_NOT_FOUND");
  }
  if (String(request.status) !== "pending") {
    throw new HttpError(409, "So‘rov allaqachon ko‘rib chiqilgan", "RETURN_REQUEST_NOT_PENDING");
  }

  if (reasonType === "no_answer" && !request.isPaid) {
    throw new HttpError(
      409,
      "To‘lov qilinmagan buyurtmada «Javob bermadi» tasdiqlanmaydi",
      "NO_ANSWER_REQUIRES_PAID",
    );
  }

  const assignment = await CourierOrderAssignment.findById(request.assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Assignment topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  const now = new Date();
  request.status = "approved";
  request.approvedReasonType = reasonType;
  request.reviewedAt = now;
  request.reviewedBy = reviewedBy;
  request.rejectReason = "";
  await request.save();

  assignment.status = "return_approved";
  assignment.approvedReturnReasonType = reasonType;
  await assignment.save();

  return {
    request: toPublicReturnRequest(request),
    assignment: await mapAssignmentPublic(assignment),
  };
}

async function rejectReturnRequest(requestId, payload = {}) {
  const id = String(requestId || "").trim();
  const rejectReason = String(payload.rejectReason || payload.reason || "").trim();
  const reviewedBy = String(payload.reviewedBy || "admin").trim();

  if (!id) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_REQUEST_ID");
  }

  const request = await CourierReturnRequest.findById(id);
  if (!request) {
    throw new HttpError(404, "So‘rov topilmadi", "RETURN_REQUEST_NOT_FOUND");
  }
  if (String(request.status) !== "pending") {
    throw new HttpError(409, "So‘rov allaqachon ko‘rib chiqilgan", "RETURN_REQUEST_NOT_PENDING");
  }

  const assignment = await CourierOrderAssignment.findById(request.assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Assignment topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  const now = new Date();
  request.status = "rejected";
  request.reviewedAt = now;
  request.reviewedBy = reviewedBy;
  request.rejectReason = rejectReason;
  request.set("approvedReasonType", undefined);
  await request.save();

  assignment.status = "arrived_at_customer";
  assignment.set("approvedReturnReasonType", undefined);
  if (!assignment.arrivedAtCustomerAt) {
    assignment.arrivedAtCustomerAt = now;
  }
  await assignment.save();

  return {
    request: toPublicReturnRequest(request),
    assignment: await mapAssignmentPublic(assignment),
  };
}

/**
 * Admin tasdiqlagan turdagi tugma — kuryer bosadi → sotuvchiga qaytarish.
 */
async function confirmApprovedReturnReasonByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  let reasonType = String(payload.reasonType || "").trim().toLowerCase();

  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }
  if (String(assignment.status) !== "return_approved") {
    throw new HttpError(
      409,
      "Avval admin so‘rovni tasdiqlashi kerak",
      "RETURN_NOT_APPROVED",
    );
  }

  let approved = String(assignment.approvedReturnReasonType || "").trim().toLowerCase();
  if (!REASON_TYPES.has(approved)) {
    const request = await CourierReturnRequest.findOne({
      assignmentId: assignment._id,
      status: "approved",
    })
      .sort({ reviewedAt: -1 })
      .lean();
    approved = String(request?.approvedReasonType || "").trim().toLowerCase();
    if (REASON_TYPES.has(approved)) {
      assignment.approvedReturnReasonType = approved;
    }
  }

  if (!REASON_TYPES.has(approved)) {
    throw new HttpError(
      409,
      "Admin qaytarish turini belgilamagan",
      "RETURN_REASON_MISSING",
    );
  }

  // Client tur yubormasa — admin belgilagan tur ishlatiladi
  if (!reasonType) {
    reasonType = approved;
  }
  if (!REASON_TYPES.has(reasonType)) {
    throw new HttpError(400, "Sabab turi noto‘g‘ri", "INVALID_REASON_TYPE");
  }
  if (approved !== reasonType) {
    throw new HttpError(
      409,
      "Faqat admin tasdiqlagan tur ishlaydi",
      "RETURN_REASON_MISMATCH",
    );
  }

  if (reasonType === "no_answer") {
    const order = await Order.findOne({ id: assignment.orderId })
      .select("status paidAt paymentMethod")
      .lean();
    if (!isOrderPaid(order)) {
      throw new HttpError(
        409,
        "To‘lov qilinmagan buyurtmada «Javob bermadi» ishlatib bo‘lmaydi",
        "NO_ANSWER_REQUIRES_PAID",
      );
    }
  }

  assignment.status = "return_to_seller";
  assignment.approvedReturnReasonType = approved;
  await assignment.save();
  return mapAssignmentPublic(assignment);
}

async function advanceReturnToSellerByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const action = String(payload.action || "").trim().toLowerCase();

  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const rule = RETURN_ADVANCE_ACTIONS[action];
  if (!rule) {
    throw new HttpError(400, "Noto‘g‘ri bosqich amali", "INVALID_ADVANCE_ACTION");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  const current = String(assignment.status || "");
  if (current === rule.to) {
    return mapAssignmentPublic(assignment);
  }
  if (!rule.from.includes(current)) {
    throw new HttpError(409, rule.errorMessage, "ASSIGNMENT_STATUS_CONFLICT");
  }

  const at = new Date();
  assignment.status = rule.to;
  assignment[rule.atField] = at;
  await assignment.save();
  return mapAssignmentPublic(assignment);
}

/**
 * Qaytardim — ombor restore + CourierReturnedOrder.
 */
async function completeReturnToSellerByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }
  if (String(assignment.status) !== "arrived_return_at_seller") {
    throw new HttpError(
      409,
      "Avval sotuvchiga boring va kelganingizni tasdiqlang",
      "RETURN_NOT_AT_SELLER",
    );
  }

  const reasonType = String(assignment.approvedReturnReasonType || "return");
  if (!REASON_TYPES.has(reasonType)) {
    throw new HttpError(409, "Qaytarish turi belgilanmagan", "RETURN_REASON_MISSING");
  }

  const order = await Order.findOne({ id: assignment.orderId })
    .select("status paidAt createdAt items paymentMethod")
    .lean();
  const paid = isOrderPaid(order);
  const returnedAt = new Date();
  const periodKeys = resolvePeriodKeys(returnedAt);

  const returnPayload = {
    assignmentId: assignment._id,
    orderId: assignment.orderId,
    itemIndex: assignment.itemIndex,
    unitIndex: assignment.unitIndex,
    productId: assignment.productId,
    productCode: String(assignment.productCode || ""),
    sellerId: String(assignment.sellerId || ""),
    title: {
      uz: String(assignment.title?.uz || ""),
      ru: String(assignment.title?.ru || ""),
    },
    amount: Math.max(0, Number(assignment.amount) || 0),
    quantity: 1,
    imageUrl: String(assignment.imageUrl || ""),
    color: String(assignment.color || ""),
    size: String(assignment.size || ""),
    storage: String(assignment.storage || ""),
    model: String(assignment.model || ""),
    deliveryId: assignment.deliveryId,
    courier: {
      firstName: String(assignment.courier?.firstName || ""),
      lastName: String(assignment.courier?.lastName || ""),
      phone: String(assignment.courier?.phone || ""),
      email: String(assignment.courier?.email || ""),
    },
    customer: {
      firstName: String(assignment.customer?.firstName || ""),
      lastName: String(assignment.customer?.lastName || ""),
      phone: String(assignment.customer?.phone || ""),
    },
    reasonType,
    comment: "",
    orderedAt: order?.createdAt || assignment.acceptedAt || null,
    returnedAt,
    dateKey: periodKeys.dateKey,
    weekKey: periodKeys.weekKey,
    monthKey: periodKeys.monthKey,
    orderPaymentStatus: String(order?.status || ""),
    isPaid: paid,
  };

  const saved = await CourierReturnedOrder.findOneAndUpdate(
    { assignmentId: assignment._id },
    { $set: returnPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await releaseReservedStockOnReturn(assignment.productId, 1);

  assignment.status = "returned";
  assignment.returnedAt = returnedAt;
  await applyCourierKmPayment(assignment, payload, returnedAt);
  await assignment.save();

  return {
    returned: toPublicReturnedOrder(saved),
    assignment: await mapAssignmentPublic(assignment),
  };
}

module.exports = {
  createReturnRequestByCourier,
  listReturnRequestsForAdmin,
  approveReturnRequest,
  rejectReturnRequest,
  confirmApprovedReturnReasonByCourier,
  advanceReturnToSellerByCourier,
  completeReturnToSellerByCourier,
  toPublicReturnRequest,
  RETURN_ADVANCE_ACTIONS,
};
