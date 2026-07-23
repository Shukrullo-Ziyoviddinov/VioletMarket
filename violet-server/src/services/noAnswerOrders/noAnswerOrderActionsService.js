const { Order } = require("../../models/order");
const { Product } = require("../../models/product");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  reserveStockUnitOnRehandoff,
  releaseReservedStockOnReturn,
} = require("../../productManagement/markProductsAsSold");
const {
  recordSalesOnDelivery,
} = require("../../productManagement/recordSalesOnDelivery");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const {
  normalizeVariant,
  hasVariantHint,
} = require("../../productManagement/variantStockAdjust");

const RESOLUTION_TYPES = new Set(["re_handoff", "reactivated", "delivered"]);

function resolveOptionLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (!text || text === "[object Object]") return "";
    return text;
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

function isBadVariantLabel(value) {
  const text = String(value || "").trim();
  return !text || text === "[object Object]";
}

function variantFromReturned(doc) {
  return normalizeVariant({
    color: resolveOptionLabel(doc.color),
    size: resolveOptionLabel(doc.size),
    storage: resolveOptionLabel(doc.storage),
    model: resolveOptionLabel(doc.model),
  });
}

function isStockReleased(doc) {
  return Boolean(doc?.stockReleased);
}

function unitKeyFromReturned(doc) {
  return {
    orderId: Number(doc.orderId),
    itemIndex: Number(doc.itemIndex),
    unitIndex: Number(doc.unitIndex) || 0,
  };
}

/**
 * Rang/o‘lcham qaytarish yozuvida bo‘sh yoki [object Object] bo‘lsa —
 * assignment / order item dan tiklaymiz (aks holda variant ombori yangilanmaydi).
 */
async function resolveVariantForStockRestore(doc) {
  let variant = variantFromReturned(doc);
  const needsFallback =
    !hasVariantHint(variant) ||
    isBadVariantLabel(variant.color) ||
    isBadVariantLabel(variant.size);

  if (!needsFallback) return variant;

  let assignment = null;
  if (doc.assignmentId) {
    assignment = await CourierOrderAssignment.findById(doc.assignmentId)
      .select("color size storage model")
      .lean();
  }
  if (!assignment) {
    assignment = await CourierOrderAssignment.findOne(unitKeyFromReturned(doc))
      .select("color size storage model")
      .lean();
  }
  if (assignment) {
    variant = normalizeVariant({
      color: resolveOptionLabel(assignment.color) || variant.color,
      size: resolveOptionLabel(assignment.size) || variant.size,
      storage: resolveOptionLabel(assignment.storage) || variant.storage,
      model: resolveOptionLabel(assignment.model) || variant.model,
    });
  }

  const stillBad =
    !hasVariantHint(variant) ||
    isBadVariantLabel(variant.color) ||
    isBadVariantLabel(variant.size);

  if (!stillBad) return variant;

  const order = await Order.findOne({ id: doc.orderId }).select("items").lean();
  const item = Array.isArray(order?.items)
    ? order.items[Number(doc.itemIndex)]
    : null;
  if (item) {
    variant = normalizeVariant({
      color: resolveOptionLabel(item.color) || variant.color,
      size: resolveOptionLabel(item.size) || variant.size,
      storage: resolveOptionLabel(item.storage) || variant.storage,
      model: resolveOptionLabel(item.model) || variant.model,
    });
  }
  return variant;
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

/** assignmentId eskirgan bo‘lsa ham unit kaliti bilan o‘chiradi */
async function deleteAssignmentForReturned(doc) {
  const unitKey = unitKeyFromReturned(doc);
  if (doc.assignmentId) {
    await CourierOrderAssignment.deleteOne({ _id: doc.assignmentId });
  }
  await CourierOrderAssignment.deleteOne(unitKey);
}

/**
 * Qayta kuryerga topshirish.
 * Ombor ochilgan bo‘lsa — yana rezerv + stockReleased=false.
 * Ochilmagan bo‘lsa — checkout rezervi saqlangan, qayta rezerv yo‘q.
 */
async function reHandoffNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const variant = await resolveVariantForStockRestore(doc);

  if (isStockReleased(doc)) {
    await reserveStockUnitOnRehandoff(doc.productId, 1, variant);
    doc.stockReleased = false;
    await doc.save();
  }

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

  await deleteAssignmentForReturned(doc);

  const publicRow = await markResolved(
    doc,
    "re_handoff",
    options.resolvedBy || options.actor || "admin",
  );
  return { resolution: "re_handoff", returned: publicRow };
}

/**
 * Qayta aktiv qilish — omborga qaytarish + assignmentni tozalash.
 * stockReleased flagiga qaramay bir marta ochamiz (eski skip xatosini yo‘qotish).
 * resolved bo‘lgach qayta bosilmaydi — ikki marta +1 bo‘lmaydi.
 */
async function reactivateNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const variant = await resolveVariantForStockRestore(doc);

  const product = await Product.findOne({ id: doc.productId }).select("id").lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  // Variant yorliqlarini yozuvga ham yozib qo‘yamiz (keyingi amallar uchun)
  if (hasVariantHint(variant)) {
    doc.color = variant.color;
    doc.size = variant.size;
    doc.storage = variant.storage;
    doc.model = variant.model;
  }

  await releaseReservedStockOnReturn(doc.productId, 1, variant);
  doc.stockReleased = true;
  await doc.save();

  await deleteAssignmentForReturned(doc);

  const publicRow = await markResolved(
    doc,
    "reactivated",
    options.resolvedBy || options.actor || "admin",
  );
  return { resolution: "reactivated", returned: publicRow };
}

/**
 * Mijozga topshirildi — Topshirdim kabi sotuv + delivered.
 */
async function markDeliveredNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const variant = await resolveVariantForStockRestore(doc);
  const deliveredAt = new Date();

  if (isStockReleased(doc)) {
    await reserveStockUnitOnRehandoff(doc.productId, 1, variant);
    doc.stockReleased = false;
    await doc.save();
  }

  let assignment = doc.assignmentId
    ? await CourierOrderAssignment.findById(doc.assignmentId)
    : null;

  if (!assignment) {
    assignment = await CourierOrderAssignment.findOne(unitKeyFromReturned(doc));
  }

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
    if (allUnitsDelivered && currentStatus !== "delivered") {
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
