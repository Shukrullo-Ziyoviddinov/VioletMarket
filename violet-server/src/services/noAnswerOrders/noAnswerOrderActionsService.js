const { Order } = require("../../models/order");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  reserveStockUnitOnRehandoff,
} = require("../../productManagement/markProductsAsSold");
const {
  recordSalesOnDelivery,
} = require("../../productManagement/recordSalesOnDelivery");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");

const RESOLUTION_TYPES = new Set(["re_handoff", "reactivated", "delivered"]);

function variantFromReturned(doc) {
  return {
    color: String(doc.color || "").trim(),
    size: String(doc.size || "").trim(),
    storage: String(doc.storage || "").trim(),
    model: String(doc.model || "").trim(),
  };
}

async function loadUnresolvedNoAnswer(returnedOrderId, sellerId = null) {
  const id = String(returnedOrderId || "").trim();
  if (!id) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_RETURNED_ORDER_ID");
  }

  const doc = await CourierReturnedOrder.findById(id);
  if (!doc) {
    throw new HttpError(404, "Javob bermadi yozuvi topilmadi", "NO_ANSWER_NOT_FOUND");
  }
  if (String(doc.reasonType) !== "no_answer") {
    throw new HttpError(409, "Bu yozuv «Javob bermadi» emas", "NOT_NO_ANSWER");
  }
  if (doc.resolvedAt) {
    throw new HttpError(409, "Bu yozuv allaqachon yopilgan", "NO_ANSWER_ALREADY_RESOLVED");
  }
  if (sellerId != null && String(doc.sellerId) !== String(sellerId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "NO_ANSWER_FORBIDDEN");
  }
  return doc;
}

async function markResolved(doc, resolutionType, resolvedBy) {
  if (!RESOLUTION_TYPES.has(resolutionType)) {
    throw new HttpError(400, "Yechim turi noto‘g‘ri", "INVALID_RESOLUTION_TYPE");
  }
  doc.resolutionType = resolutionType;
  doc.resolvedAt = new Date();
  doc.resolvedBy = String(resolvedBy || "").trim();
  await doc.save();
  return toPublicReturnedOrder(doc);
}

/**
 * Qayta kuryerga topshirish — ombor rezerv + handed_to_courier + assignment o‘chadi.
 */
async function reHandoffNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const variant = variantFromReturned(doc);

  await reserveStockUnitOnRehandoff(doc.productId, 1, variant);

  const order = await Order.findOne({ id: doc.orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }
  const item = Array.isArray(order.items) ? order.items[Number(doc.itemIndex)] : null;
  if (!item) {
    throw new HttpError(404, "Mahsulot topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const now = new Date();
  item.trackingStatus = "handed_to_courier";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "handed_to_courier", at: now });
  order.markModified("items");
  await order.save();

  if (doc.assignmentId) {
    await CourierOrderAssignment.deleteOne({ _id: doc.assignmentId });
  }

  const publicRow = await markResolved(
    doc,
    "re_handoff",
    options.resolvedBy || options.actor || "admin",
  );
  return { resolution: "re_handoff", returned: publicRow };
}

/**
 * Qayta aktiv qilish — ombor allaqachon qaytarilgan; faqat ro‘yxatdan yopiladi.
 */
async function reactivateNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const publicRow = await markResolved(
    doc,
    "reactivated",
    options.resolvedBy || options.actor || "admin",
  );
  return { resolution: "reactivated", returned: publicRow };
}

/**
 * Mijozga topshirildi — kuryer Topshirdim kabi sotuv + delivered.
 */
async function markDeliveredNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const variant = variantFromReturned(doc);
  const deliveredAt = new Date();

  // Qaytarishda ombor ochilgan edi — sotish uchun yana rezerv
  await reserveStockUnitOnRehandoff(doc.productId, 1, variant);

  let assignment = doc.assignmentId
    ? await CourierOrderAssignment.findById(doc.assignmentId)
    : null;

  if (!assignment) {
    throw new HttpError(
      404,
      "Kuryer assignment topilmadi",
      "ASSIGNMENT_NOT_FOUND",
    );
  }

  assignment.status = "delivered";
  assignment.deliveredAt = deliveredAt;
  assignment.courierPayment = 0;
  assignment.courierPaymentUpdatedAt = deliveredAt;
  await assignment.save();

  const order = await Order.findOne({ id: doc.orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = Array.isArray(order.items) ? order.items[Number(doc.itemIndex)] : null;
  if (item) {
    const unitCount = Math.max(1, Number(item.quantity) || 1);
    const unitRows = await CourierOrderAssignment.find({
      orderId: doc.orderId,
      itemIndex: doc.itemIndex,
    })
      .select("unitIndex status")
      .lean();

    const deliveredUnits = new Set(
      unitRows
        .filter((row) => String(row.status) === "delivered")
        .map((row) => Number(row.unitIndex) || 0),
    );
    deliveredUnits.add(Number(doc.unitIndex) || 0);

    let allUnitsDelivered = true;
    for (let i = 0; i < unitCount; i += 1) {
      if (!deliveredUnits.has(i)) {
        allUnitsDelivered = false;
        break;
      }
    }

    const currentStatus = String(item.trackingStatus || "");
    if (
      allUnitsDelivered &&
      currentStatus !== "delivered"
    ) {
      item.trackingStatus = "delivered";
      if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
      item.trackingHistory.push({ status: "delivered", at: deliveredAt });
    }

    const allItemsDelivered = (Array.isArray(order.items) ? order.items : []).every(
      (row) => String(row.trackingStatus || "") === "delivered",
    );
    if (allItemsDelivered && String(order.status) !== "delivered") {
      order.status = "delivered";
    }

    order.markModified("items");
    await order.save();
  }

  await recordSalesOnDelivery(order, deliveredAt, {
    assignmentId: String(assignment._id),
  });

  const publicRow = await markResolved(
    doc,
    "delivered",
    options.resolvedBy || options.actor || "admin",
  );
  return { resolution: "delivered", returned: publicRow };
}

module.exports = {
  reHandoffNoAnswerOrder,
  reactivateNoAnswerOrder,
  markDeliveredNoAnswerOrder,
};
