/**
 * Unit qaytarish lifecycle — Ajdaniya → approve → sotuvchiga qaytarish.
 *
 * Zanjir: createReturnRequest → approve/reject → confirmReason → advance → completeReturn
 * Ombor: inventory via stockDisposition (release | keep | discard)
 * no_answer yechimlari (re_handoff/reactivate/deliver) — 3-bosqich.
 */

const { Order } = require("../models/order");
const { CourierOrderAssignment } = require("../models/courierOrderAssignment");
const { CourierReturnedOrder } = require("../models/courierReturnedOrder");
const { CourierReturnRequest } = require("../models/courierReturnRequest");
const { HttpError } = require("../utils/httpError");
const {
  claimAndApplyReturnStockDisposition,
} = require("./stockDisposition");
const {
  notifyAdminReturnRequestSubmitted,
} = require("../services/adminNotifications/adminNotificationService");
const {
  isOrderPaid,
  resolvePeriodKeys,
  toPublicReturnedOrder,
} = require("../services/deliveryOrders/courierReturnOrderService");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
  attachSellerPickup,
  applyCourierKmPayment,
} = require("../services/deliveryOrders/courierOrderAssignmentService");
const { normalizeVariant } = require("../productManagement/variantStockAdjust");
const {
  REASON_TYPES,
  REQUESTABLE_STATUSES,
  RETURN_ADVANCE_ACTIONS,
} = require("./constants");
const { resolveOptionLabel } = require("./optionLabel");
const {
  createCustomerRefundRequestIfNeeded,
} = require("../services/customerRefund/customerRefundService");
const {
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
  isClosedUnitStatus,
  recomputeItemTrackingStatusFromUnits,
} = require("../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");
const {
  areAllOrderItemsSettledForDelivery,
  healNoAnswerResolvedIfUnitDelivered,
} = require("./deliveryUnitSettlement");


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

  // Bir xil order/item/unit bo‘yicha so‘rov (assignment qayta yaratilgan bo‘lsa)
  const byUnit = await CourierReturnRequest.findOne({
    orderId: Number(assignment.orderId),
    itemIndex: Number(assignment.itemIndex),
    unitIndex: Number(assignment.unitIndex) || 0,
    status: "approved",
  })
    .sort({ reviewedAt: -1 })
    .select("approvedReasonType")
    .lean();

  approved = String(byUnit?.approvedReasonType || "").trim().toLowerCase();
  if (REASON_TYPES.has(approved)) {
    assignment.approvedReturnReasonType = approved;
    return approved;
  }

  return "";
}

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
    color: resolveOptionLabel(assignment.color) || resolveOptionLabel(orderItem?.color),
    size: resolveOptionLabel(assignment.size) || resolveOptionLabel(orderItem?.size),
    storage:
      resolveOptionLabel(assignment.storage) || resolveOptionLabel(orderItem?.storage),
    model: resolveOptionLabel(assignment.model) || resolveOptionLabel(orderItem?.model),
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

  const {
    listCargoReturnRequestsForAdmin,
  } = require("../services/cargoShipments/cargoReturnRequestService");

  const [courierRows, cargoItems] = await Promise.all([
    CourierReturnRequest.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
    listCargoReturnRequestsForAdmin(query),
  ]);

  const courierItems = courierRows.map((row) => ({
    ...toPublicReturnRequest(row),
    source: "courier",
    allowedReasonTypes: ["return", "no_answer", "defective"],
  }));

  const items = [...courierItems, ...cargoItems].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  return {
    total: items.length,
    items: items.slice(0, 200),
  };
}

async function approveReturnRequest(requestId, payload = {}) {
  const id = String(requestId || "").trim();
  const {
    findCargoReturnRequestById,
    approveCargoReturnRequest,
  } = require("../services/cargoShipments/cargoReturnRequestService");

  const cargoDoc = await findCargoReturnRequestById(id);
  if (cargoDoc) {
    return approveCargoReturnRequest(id, payload);
  }

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
  const {
    findCargoReturnRequestById,
    rejectCargoReturnRequest,
  } = require("../services/cargoShipments/cargoReturnRequestService");

  const cargoDoc = await findCargoReturnRequestById(id);
  if (cargoDoc) {
    return rejectCargoReturnRequest(id, payload);
  }

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

  // Oldingi urinishda assignment returned — tracking/reason/stock ni tugatish
  if (String(assignment.status) === "returned") {
    const existingDoc = await CourierReturnedOrder.findOne({
      $or: [{ assignmentId: assignment._id }, unitFilter],
    });

    // no_answer «Sotildi» / qayta aktiv / qayta kuryer — allaqachon yopilgan.
    // Qayta completeReturn resolution ni o‘chirmasin va delivered unitni buzmasin.
    if (existingDoc?.resolvedAt) {
      return {
        returned: toPublicReturnedOrder(existingDoc),
        assignment: await mapAssignmentPublic(assignment),
        alreadyResolved: true,
      };
    }

    // Sotildi order unit ni delivered qilgan, resolvedAt hali yozilmagan crash edge.
    // Faqat skip emas — resolution ni delivered qilib yopamiz (qayta aktiv bloklanadi).
    const orderPeek = await Order.findOne({ id: assignment.orderId }).select("items");
    const peekItem = Array.isArray(orderPeek?.items)
      ? orderPeek.items[Number(assignment.itemIndex)]
      : null;
    if (
      peekItem &&
      resolveUnitTrackingStatus(peekItem, unitFilter.unitIndex) === "delivered"
    ) {
      let healedDoc = existingDoc;
      if (
        existingDoc &&
        String(existingDoc.reasonType || "") === "no_answer" &&
        !existingDoc.resolvedAt
      ) {
        const heal = await healNoAnswerResolvedIfUnitDelivered(
          existingDoc,
          "system_heal_complete_return",
        );
        if (heal.healed) healedDoc = heal.returnedDoc || existingDoc;
      }
      return {
        returned: healedDoc ? toPublicReturnedOrder(healedDoc) : null,
        assignment: await mapAssignmentPublic(assignment),
        alreadyResolved: true,
      };
    }

    await markOrderItemReturnedToSeller(
      assignment,
      assignment.returnedAt || new Date(),
    );
    const prevReason = String(assignment.approvedReturnReasonType || "");
    const reasonType = await resolveApprovedReturnReasonType(assignment);
    if (REASON_TYPES.has(reasonType) && prevReason !== reasonType) {
      await assignment.save();
    }

    if (existingDoc) {
      if (REASON_TYPES.has(reasonType)) {
        existingDoc.reasonType = reasonType;
        existingDoc.assignmentId = assignment._id;
      }
      // resolvedAt/resolutionType ni TOZALAMAYMIZ — ochiq no_answer heal uchun
      // allaqachon null; yopilganlar yuqorida early-return.

      if (
        (reasonType === "return" && !existingDoc.stockReleased) ||
        (reasonType === "defective" && !existingDoc.stockDiscarded) ||
        reasonType === "no_answer"
      ) {
        const leanOrder = await Order.findOne({ id: assignment.orderId })
          .select("items status paidAt paymentMethod")
          .lean();
        const orderItem = Array.isArray(leanOrder?.items)
          ? leanOrder.items[Number(assignment.itemIndex)]
          : null;
        const variant = normalizeVariant({
          color:
            resolveOptionLabel(assignment.color) ||
            resolveOptionLabel(orderItem?.color),
          size:
            resolveOptionLabel(assignment.size) ||
            resolveOptionLabel(orderItem?.size),
          storage:
            resolveOptionLabel(assignment.storage) ||
            resolveOptionLabel(orderItem?.storage),
          model:
            resolveOptionLabel(assignment.model) ||
            resolveOptionLabel(orderItem?.model),
        });

        if (leanOrder) {
          existingDoc.isPaid = isOrderPaid(leanOrder);
          existingDoc.orderPaymentStatus = String(leanOrder.status || "");
        }
        await existingDoc.save();

        const flags = await claimAndApplyReturnStockDisposition({
          returnedOrderId: existingDoc._id,
          reasonType,
          productId: assignment.productId,
          qty: 1,
          variant,
        });
        existingDoc.stockReleased = flags.stockReleased;
        existingDoc.stockDiscarded = flags.stockDiscarded;
      } else {
        const leanOrder = await Order.findOne({ id: assignment.orderId })
          .select("status paidAt paymentMethod")
          .lean();
        if (leanOrder) {
          existingDoc.isPaid = isOrderPaid(leanOrder);
          existingDoc.orderPaymentStatus = String(leanOrder.status || "");
        }
      }

      await existingDoc.save();
      await createCustomerRefundRequestIfNeeded(existingDoc);
      return {
        returned: toPublicReturnedOrder(existingDoc),
        assignment: await mapAssignmentPublic(assignment),
      };
    }

    return {
      returned: null,
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

  const sellerId =
    String(assignment.sellerId || "").trim() ||
    String(orderItem?.sellerId || "").trim();
  if (!sellerId) {
    throw new HttpError(409, "Siller ID topilmadi", "SELLER_ID_MISSING");
  }

  const variant = normalizeVariant({
    color: resolveOptionLabel(assignment.color) || resolveOptionLabel(orderItem?.color),
    size: resolveOptionLabel(assignment.size) || resolveOptionLabel(orderItem?.size),
    storage:
      resolveOptionLabel(assignment.storage) || resolveOptionLabel(orderItem?.storage),
    model: resolveOptionLabel(assignment.model) || resolveOptionLabel(orderItem?.model),
  });

  const returnPayload = {
    assignmentId: assignment._id,
    orderId: unitFilter.orderId,
    itemIndex: unitFilter.itemIndex,
    unitIndex: unitFilter.unitIndex,
    productId: assignment.productId,
    productCode: String(assignment.productCode || ""),
    sellerId,
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
    // Qayta sikl: eski yechimni ochamiz. stockReleased keyinroq (haqiqiy release dan keyin).
    resolvedAt: null,
    resolvedBy: "",
  };

  // Avval tracking — enum xatosida stock/assignment o‘zgarmasin
  await markOrderItemReturnedToSeller(assignment, returnedAt);

  // 1) Avval returned yozuv (stock flaglarini o‘chirib yubormasdan)
  const saved = await CourierReturnedOrder.findOneAndUpdate(
    unitFilter,
    {
      $set: {
        ...returnPayload,
      },
      $setOnInsert: {
        stockReleased: false,
        stockDiscarded: false,
      },
      $unset: { resolutionType: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  // 2) Atomik claim → keyin ombor (qayta urinishda ikki marta emas)
  const stockFlags = await claimAndApplyReturnStockDisposition({
    returnedOrderId: saved._id,
    reasonType,
    productId: assignment.productId,
    qty: 1,
    variant,
  });

  if (
    saved.stockReleased !== stockFlags.stockReleased ||
    saved.stockDiscarded !== stockFlags.stockDiscarded
  ) {
    saved.stockReleased = stockFlags.stockReleased;
    saved.stockDiscarded = stockFlags.stockDiscarded;
  }

  assignment.status = "returned";
  assignment.returnedAt = returnedAt;
  await applyCourierKmPayment(assignment, payload, returnedAt);
  await assignment.save();

  // Pul zanjiri — inventardan keyin, alohida (faqat to‘langan return|defective)
  await createCustomerRefundRequestIfNeeded(saved);

  return {
    returned: toPublicReturnedOrder(saved),
    assignment: await mapAssignmentPublic(assignment),
  };
}

/**
 * Itemdagi barcha ochiq donalar kuryer orqali qaytarilgan bo‘lsa
 * agregat qayta hisoblanadi (recompute).
 *
 * Qanoatlantirilgan:
 *   - assignment returned | delivered
 *   - unit delivered
 *   - unit yopiq (unavailable / cancelled / returned_to_seller)
 *
 * Sibling hali handed bo‘lsa agregat o‘zgarmaydi (pool uchun), lekin
 * units[] har doim saqlanadi.
 *
 * Avval Sotildi, keyin qaytarish: delivered sibling → allSatisfied;
 * recompute → item «delivered» (returned_to_seller ga yopishtirmaydi).
 */
async function markOrderItemReturnedToSeller(assignment, returnedAt) {
  const order = await Order.findOne({ id: assignment.orderId });
  if (!order) return;

  const item = Array.isArray(order.items)
    ? order.items[Number(assignment.itemIndex)]
    : null;
  if (!item) return;

  const at = returnedAt instanceof Date ? returnedAt : new Date(returnedAt || Date.now());
  ensureItemUnits(item, at);

  const thisUnitIndex = Number(assignment.unitIndex) || 0;
  const thisUnit = getItemUnit(item, thisUnitIndex);
  if (thisUnit) {
    const prev = resolveUnitTrackingStatus(item, thisUnitIndex);
    // no_answer «Sotildi» unitni delivered qilgan — qayta completeReturn buzmasin
    if (prev !== "delivered" && prev !== "returned_to_seller") {
      thisUnit.trackingStatus = "returned_to_seller";
      if (!Array.isArray(thisUnit.trackingHistory)) thisUnit.trackingHistory = [];
      thisUnit.trackingHistory.push({ status: "returned_to_seller", at });
    }
  }

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
  statusByUnit.set(thisUnitIndex, "returned");

  let allSatisfied = true;
  for (let i = 0; i < unitCount; i += 1) {
    const assignStatus = String(statusByUnit.get(i) || "");
    if (assignStatus === "returned" || assignStatus === "delivered") {
      continue;
    }

    const unitStatus = resolveUnitTrackingStatus(item, i);
    if (unitStatus === "delivered") continue;
    if (isClosedUnitStatus(unitStatus)) continue;

    allSatisfied = false;
    break;
  }

  if (allSatisfied) {
    // Assignment «returned» lekin units[] hali sync bo‘lmagan donalarni tugatish
    // (oldingi partial save / race). delivered / unavailable / cancelled ga tegilmaydi.
    for (let i = 0; i < unitCount; i += 1) {
      if (String(statusByUnit.get(i) || "") !== "returned") continue;
      const unit = getItemUnit(item, i);
      if (!unit) continue;
      const st = resolveUnitTrackingStatus(item, i);
      if (
        st === "delivered" ||
        st === "returned_to_seller" ||
        st === "unavailable" ||
        st === "cancelled"
      ) {
        continue;
      }
      unit.trackingStatus = "returned_to_seller";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "returned_to_seller", at });
    }

    const previous = normalizeOrderTrackingStatus(item.trackingStatus);
    // delivered + returned aralash → delivered; faqat returned → returned_to_seller
    recomputeItemTrackingStatusFromUnits(item);
    const next = normalizeOrderTrackingStatus(item.trackingStatus);
    if (next && next !== previous) {
      if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
      const last = item.trackingHistory[item.trackingHistory.length - 1];
      if (String(last?.status || "") !== next) {
        item.trackingHistory.push({ status: next, at });
      }
    }
  }

  // Har doim saqlash: partial qaytarishda ham units[i] yo‘qolmasin
  order.markModified("items");

  // Multi-item: oxirgi amal qaytarish bo‘lsa ham order delivered ga yetsin
  // (sibling itemlar delivered/unavailable/terminal returned).
  if (
    allSatisfied &&
    (await areAllOrderItemsSettledForDelivery(order)) &&
    String(order.status) !== "delivered"
  ) {
    order.status = "delivered";
  }

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
  toPublicReturnRequest,
  RETURN_ADVANCE_ACTIONS,
};
