const { Order } = require("../../models/order");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { HttpError } = require("../../utils/httpError");
const {
  getStatisticsDateKey,
  getTashkentYmd,
  getIsoWeekFromYmd,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey } = require("../adminSales/salesStatisticsHelpers");
const {
  resolveStoredPaymentMethod,
} = require("../../productManagement/paymentMethods");

const REASON_TYPES = new Set(["no_answer", "return"]);
const RETURNABLE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

/**
 * Kuryer uchun: online (payme/click) = to‘langan.
 * Naqd (on_delivery) = hali olinmagan — status "paid" bo‘lsa ham.
 */
function isOrderPaid(order) {
  if (!order) return false;
  const method = resolveStoredPaymentMethod(order.paymentMethod);
  if (method === "on_delivery") return false;
  if (method === "payme" || method === "click") return true;

  const status = String(order.status || "");
  if (status === "paid" || status === "delivered") return true;
  return Boolean(order.paidAt);
}

function resolvePeriodKeys(date = new Date()) {
  const dateKey = getStatisticsDateKey(date);
  const { year, month, day } = getTashkentYmd(date);
  const { isoYear, week } = getIsoWeekFromYmd(year, month, day);
  return {
    dateKey,
    weekKey: formatWeekKey(isoYear, week),
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function toPublicReturnedOrder(doc) {
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
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
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
    reasonType: String(row.reasonType || "return"),
    comment: String(row.comment || ""),
    orderedAt: row.orderedAt || null,
    returnedAt: row.returnedAt || null,
    dateKey: String(row.dateKey || ""),
    weekKey: String(row.weekKey || ""),
    monthKey: String(row.monthKey || ""),
    orderPaymentStatus: String(row.orderPaymentStatus || ""),
    isPaid: Boolean(row.isPaid),
    createdAt: row.createdAt || null,
  };
}

/**
 * Kuryer "Javob bermadi" yoki "Qaytarish".
 * no_answer faqat to‘lov qilingan buyurtmada.
 */
async function returnOrderUnitByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const reasonType = String(payload.reasonType || "").trim().toLowerCase();
  const comment = String(payload.comment || "").trim();

  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }
  if (!REASON_TYPES.has(reasonType)) {
    throw new HttpError(400, "Sabab turi noto‘g‘ri", "INVALID_REASON_TYPE");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (String(assignment.status) === "delivered") {
    throw new HttpError(
      409,
      "Topshirilgan buyurtmani qaytarib bo‘lmaydi",
      "ASSIGNMENT_ALREADY_DELIVERED",
    );
  }

  if (String(assignment.status) === "cancelled") {
    throw new HttpError(
      409,
      "Bu buyurtma allaqachon qaytarilgan",
      "ASSIGNMENT_ALREADY_RETURNED",
    );
  }

  if (!RETURNABLE_STATUSES.has(String(assignment.status))) {
    throw new HttpError(
      409,
      "Avval sotuvchidan mahsulotni oling",
      "ASSIGNMENT_NOT_PICKED_UP",
    );
  }

  const order = await Order.findOne({ id: assignment.orderId })
    .select("status paidAt createdAt items")
    .lean();
  const paid = isOrderPaid(order);

  if (reasonType === "no_answer" && !paid) {
    throw new HttpError(
      409,
      "To‘lov qilinmagan buyurtmada «Javob bermadi» ishlatib bo‘lmaydi",
      "NO_ANSWER_REQUIRES_PAID",
    );
  }

  const orderItem = Array.isArray(order?.items)
    ? order.items[Number(assignment.itemIndex)]
    : null;
  const sellerId =
    String(assignment.sellerId || "").trim() ||
    String(orderItem?.sellerId || "").trim();

  if (!sellerId) {
    throw new HttpError(409, "Siller ID topilmadi", "SELLER_ID_MISSING");
  }

  const returnedAt = new Date();
  const periodKeys = resolvePeriodKeys(returnedAt);
  const returnPayload = {
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
    comment,
    orderedAt: order?.createdAt || assignment.acceptedAt || null,
    returnedAt,
    dateKey: periodKeys.dateKey,
    weekKey: periodKeys.weekKey,
    monthKey: periodKeys.monthKey,
    orderPaymentStatus: String(order?.status || ""),
    isPaid: paid,
  };

  // Qayta qabul qilingan buyurtma yana qaytarilsa — eski yozuv yangilanadi
  const saved = await CourierReturnedOrder.findOneAndUpdate(
    { assignmentId: assignment._id },
    { $set: returnPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  assignment.status = "cancelled";
  await assignment.save();

  return toPublicReturnedOrder(saved);
}

module.exports = {
  returnOrderUnitByCourier,
  toPublicReturnedOrder,
  isOrderPaid,
  resolvePeriodKeys,
};
