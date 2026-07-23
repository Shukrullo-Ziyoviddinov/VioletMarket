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
const { normalizeVariant } = require("../../productManagement/variantStockAdjust");

function resolveOptionLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const fromName = value.name ?? value.size ?? value.label ?? "";
    if (typeof fromName === "string" || typeof fromName === "number") {
      return String(fromName).trim();
    }
    if (fromName && typeof fromName === "object") {
      return String(fromName.uz || fromName.ru || "").trim();
    }
    return String(value.uz || value.ru || "").trim();
  }
  return "";
}

const REASON_TYPES = new Set(["no_answer", "return"]);
const REQUESTABLE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

/**
 * Admin tasdiqlagan qaytarish turi — assignmentda yo‘q bo‘lsa so‘rovdan oladi.
 * `|| "return"` ishlatilmaydi (noto‘g‘ri «Qaytarilgan»ga tushib qolmasin).
 */
async function resolveApprovedReturnReasonType(assignment) {
  let approved = String(assignment?.approvedReturnReasonType || "")
    .trim()
    .toLowerCase();
  if (REASON_TYPES.has(approved)) {
    return approved;
  }

  const request = await CourierReturnRequest.findOne({
    assignmentId: assignment._id,
    status: "approved",
  })
    .sort({ reviewedAt: -1 })
    .select("approvedReasonType")
    .lean();

  approved = String(request?.approvedReasonType || "").trim().toLowerCase();
  if (REASON_TYPES.has(approved)) {
    assignment.approvedReturnReasonType = approved;
    return approved;
  }

  return "";
}

/**
 * Avvalgi xatolik: no_answer bo‘lishi kerak edi, lekin reasonType=return saqlangan.
 * Admin/siller «Javob bermadi» ochganda o‘zini tuzatadi.
 *
 * Eski no_answer yozuvlari omborni Qaytardim da ochgan — stockReleased=true deb belgilaymiz.
 */
async function healNoAnswerReturnedReasonTypes() {
  await CourierReturnedOrder.updateMany(
    {
      reasonType: "no_answer",
      stockReleased: { $exists: false },
    },
    { $set: { stockReleased: true } },
  );

  const requests = await CourierReturnRequest.find({
    status: "approved",
    approvedReasonType: "no_answer",
  })
    .select({ orderId: 1, itemIndex: 1, unitIndex: 1, assignmentId: 1 })
    .lean();

  if (!requests.length) return 0;

  const ops = requests.map((row) => ({
    updateOne: {
      filter: {
        orderId: Number(row.orderId),
        itemIndex: Number(row.itemIndex),
        unitIndex: Number(row.unitIndex) || 0,
        reasonType: "return",
        $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
      },
      update: {
        $set: {
          reasonType: "no_answer",
          assignmentId: row.assignmentId,
        },
      },
    },
  }));

  const result = await CourierReturnedOrder.bulkWrite(ops, { ordered: false });
  return Number(result.modifiedCount || 0);
}

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

  const unitFilter = {
    orderId: Number(assignment.orderId),
    itemIndex: Number(assignment.itemIndex),
    unitIndex: Number(assignment.unitIndex) || 0,
  };

  // Oldingi urinishda assignment returned bo‘lib tracking/reasonType noto‘g‘ri bo‘lishi mumkin
  if (String(assignment.status) === "returned") {
    await markOrderItemReturnedToSeller(
      assignment,
      assignment.returnedAt || new Date(),
    );
    const prevReason = String(assignment.approvedReturnReasonType || "");
    const reasonType = await resolveApprovedReturnReasonType(assignment);
    if (REASON_TYPES.has(reasonType) && prevReason !== reasonType) {
      await assignment.save();
    }

    let existing = null;
    if (REASON_TYPES.has(reasonType)) {
      existing = await CourierReturnedOrder.findOneAndUpdate(
        { $or: [{ assignmentId: assignment._id }, unitFilter] },
        { $set: { reasonType, assignmentId: assignment._id } },
        { new: true },
      ).lean();
    } else {
      existing = await CourierReturnedOrder.findOne({
        $or: [{ assignmentId: assignment._id }, unitFilter],
      }).lean();
    }

    return {
      returned: existing ? toPublicReturnedOrder(existing) : null,
      assignment: await mapAssignmentPublic(assignment),
    };
  }

  if (String(assignment.status) !== "arrived_return_at_seller") {
    throw new HttpError(
      409,
      "Avval sotuvchiga boring va kelganingizni tasdiqlang",
      "RETURN_NOT_AT_SELLER",
    );
  }

  const reasonType = await resolveApprovedReturnReasonType(assignment);
  if (!REASON_TYPES.has(reasonType)) {
    throw new HttpError(409, "Qaytarish turi belgilanmagan", "RETURN_REASON_MISSING");
  }
  assignment.approvedReturnReasonType = reasonType;

  const order = await Order.findOne({ id: assignment.orderId })
    .select("status paidAt createdAt items paymentMethod")
    .lean();
  const paid = isOrderPaid(order);
  const returnedAt = new Date();
  const periodKeys = resolvePeriodKeys(returnedAt);
  const orderItem = Array.isArray(order?.items)
    ? order.items[Number(assignment.itemIndex)]
    : null;

  const variant = normalizeVariant({
    color: assignment.color || resolveOptionLabel(orderItem?.color),
    size: assignment.size || resolveOptionLabel(orderItem?.size),
    storage: assignment.storage || resolveOptionLabel(orderItem?.storage),
    model: assignment.model || resolveOptionLabel(orderItem?.model),
  });

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
    color: variant.color,
    size: variant.size,
    storage: variant.storage,
    model: variant.model,
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
    // no_answer: ombor ochilmaydi (mijozniki). return: ochiladi.
    stockReleased: reasonType === "return",
  };

  // Unique: orderId+itemIndex+unitIndex — avvalgi muvaffaqiyatsiz urinish qolgan bo‘lsa yangilanadi
  const existingReturned = await CourierReturnedOrder.findOne(unitFilter)
    .select("_id stockReleased")
    .lean();

  const alreadyReleased = Boolean(existingReturned?.stockReleased);
  const shouldReleaseStock = reasonType === "return" && !alreadyReleased;

  const saved = await CourierReturnedOrder.findOneAndUpdate(
    unitFilter,
    {
      $set: {
        ...returnPayload,
        stockReleased: reasonType === "return" ? true : alreadyReleased,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Avval tracking — enum/validation xatosida stock va assignment o‘zgarmasin
  await markOrderItemReturnedToSeller(assignment, returnedAt);

  // Faqat oddiy «Qaytarish»: omborga qaytarish.
  // «Javob bermadi» da rezerv saqlanadi — «Qayta aktiv qilish»da ochiladi.
  if (shouldReleaseStock) {
    await releaseReservedStockOnReturn(assignment.productId, 1, variant);
  }

  assignment.status = "returned";
  assignment.returnedAt = returnedAt;
  await applyCourierKmPayment(assignment, payload, returnedAt);
  await assignment.save();

  return {
    returned: toPublicReturnedOrder(saved),
    assignment: await mapAssignmentPublic(assignment),
  };
}

/**
 * Itemdagi barcha donalar qaytarilgan bo‘lsa trackingStatus ni yangilaydi.
 */
async function markOrderItemReturnedToSeller(assignment, returnedAt) {
  const order = await Order.findOne({ id: assignment.orderId });
  if (!order) return;

  const item = Array.isArray(order.items)
    ? order.items[Number(assignment.itemIndex)]
    : null;
  if (!item) return;

  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const unitRows = await CourierOrderAssignment.find({
    orderId: assignment.orderId,
    itemIndex: assignment.itemIndex,
  })
    .select("unitIndex status")
    .lean();

  const statusByUnit = new Map(
    unitRows.map((row) => [Number(row.unitIndex) || 0, String(row.status || "")]),
  );
  statusByUnit.set(Number(assignment.unitIndex) || 0, "returned");

  for (let i = 0; i < unitCount; i += 1) {
    if (String(statusByUnit.get(i) || "") !== "returned") {
      return;
    }
  }

  const current = String(item.trackingStatus || "");
  if (current === "returned_to_seller") return;

  item.trackingStatus = "returned_to_seller";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "returned_to_seller", at: returnedAt });
  order.markModified("items");
  await order.save();
}

module.exports = {
  createReturnRequestByCourier,
  listReturnRequestsForAdmin,
  approveReturnRequest,
  rejectReturnRequest,
  confirmApprovedReturnReasonByCourier,
  advanceReturnToSellerByCourier,
  completeReturnToSellerByCourier,
  healNoAnswerReturnedReasonTypes,
  toPublicReturnRequest,
  RETURN_ADVANCE_ACTIONS,
};
