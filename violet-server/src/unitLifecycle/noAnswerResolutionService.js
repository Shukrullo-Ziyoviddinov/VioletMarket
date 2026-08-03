/**
 * Javob bermadi yechimlari — unit lifecycle (3-bosqich).
 *
 *   returned (no_answer)
 *     → reHandoffNoAnswerOrder   — qayta kuryerga (kerak bo‘lsa reReserve)
 *     → reactivateNoAnswerOrder  — omborga releaseToWarehouse
 *     → markDeliveredNoAnswerOrder — sotildi (kuryerga tegmaydi)
 *
 * Ombor faqat: src/inventory
 */

const { Order } = require("../models/order");
const { Product } = require("../models/product");
const { CourierReturnedOrder } = require("../models/courierReturnedOrder");
const { CourierOrderAssignment } = require("../models/courierOrderAssignment");
const { HttpError } = require("../utils/httpError");
const {
  reReserveForCourier,
  releaseToWarehouse,
} = require("../inventory");
const {
  recordSalesOnDelivery,
} = require("../productManagement/recordSalesOnDelivery");
const {
  toPublicReturnedOrder,
} = require("../services/deliveryOrders/courierReturnOrderService");
const {
  normalizeVariant,
  hasVariantHint,
} = require("../productManagement/variantStockAdjust");
const { RESOLUTION_TYPES } = require("./constants");
const { resolveOptionLabel } = require("./optionLabel");
const {
  ensureItemUnits,
  getItemUnit,
} = require("../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");
const {
  maybeSettleOrderDelivered,
  healNoAnswerResolvedIfUnitDelivered,
  settleItemAndOrderAfterUnitDelivered,
} = require("./deliveryUnitSettlement");

/**
 * Sotildi crash: unit delivered, resolvedAt yo‘q.
 * Reactivate / re_handoff ombor ochmasin / unit ochmasin.
 */
async function rejectIfAlreadySoldUnit(doc, options = {}) {
  const heal = await healNoAnswerResolvedIfUnitDelivered(
    doc,
    options.resolvedBy || options.actor || "system_heal",
  );
  if (!heal.healed) return;

  // Best-effort sotuv (Sotildi o‘rtasida crash — sales yozilmagan bo‘lishi mumkin)
  try {
    let assignment = doc.assignmentId
      ? await CourierOrderAssignment.findById(doc.assignmentId)
      : null;
    if (!assignment) {
      assignment = await CourierOrderAssignment.findOne(unitKeyFromReturned(doc));
    }
    if (assignment && heal.order) {
      await recordSalesOnDelivery(
        heal.order,
        heal.returnedDoc?.resolvedAt || new Date(),
        {
          assignmentId: String(assignment._id),
          allowNonDeliveredAssignment: true,
        },
      );
    }
  } catch (_) {
    /* sales retry keyingi Sotildi da */
  }

  throw new HttpError(
    409,
    "Bu dona allaqachon sotildi deb belgilangan — qayta aktiv / qayta kuryer qilib bo‘lmaydi",
    "NO_ANSWER_ALREADY_SOLD",
  );
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

async function deleteAssignmentForReturned(doc) {
  const unitKey = unitKeyFromReturned(doc);
  if (doc.assignmentId) {
    await CourierOrderAssignment.deleteOne({ _id: doc.assignmentId });
  }
  await CourierOrderAssignment.deleteOne(unitKey);
}

/**
 * Qayta kuryerga topshirish.
 * Item agregat + shu dona units[unitIndex] → handed_to_courier
 * (aks holda pool/accept yopiq returned_to_seller ni rad etadi).
 */
async function reHandoffNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  await rejectIfAlreadySoldUnit(doc, options);
  const variant = await resolveVariantForStockRestore(doc);

  if (isStockReleased(doc)) {
    await reReserveForCourier(doc.productId, 1, variant);
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
  const unitIndex = Number(doc.unitIndex) || 0;
  ensureItemUnits(item, now);

  const unit = getItemUnit(item, unitIndex);
  if (unit) {
    const prevUnit = normalizeOrderTrackingStatus(unit.trackingStatus);
    if (prevUnit !== "handed_to_courier") {
      unit.trackingStatus = "handed_to_courier";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "handed_to_courier", at: now });
    }
  }

  // Pool: item.trackingStatus === handed_to_courier + ochiq unit
  item.trackingStatus = "handed_to_courier";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  const lastHistory = item.trackingHistory[item.trackingHistory.length - 1];
  if (String(lastHistory?.status || "") !== "handed_to_courier") {
    item.trackingHistory.push({ status: "handed_to_courier", at: now });
  }

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
 * Qayta aktiv qilish — omborga +1.
 */
async function reactivateNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  await rejectIfAlreadySoldUnit(doc, options);
  const variant = await resolveVariantForStockRestore(doc);

  const product = await Product.findOne({ id: doc.productId }).select("id").lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  if (hasVariantHint(variant)) {
    doc.color = variant.color;
    doc.size = variant.size;
    doc.storage = variant.storage;
    doc.model = variant.model;
  }

  // Crash retry: ombor allaqachon ochilgan bo‘lsa qayta +1 qilmaslik
  if (!isStockReleased(doc)) {
    await releaseToWarehouse(doc.productId, 1, variant);
    doc.stockReleased = true;
    await doc.save();
  }

  await deleteAssignmentForReturned(doc);

  const publicRow = await markResolved(
    doc,
    "reactivated",
    options.resolvedBy || options.actor || "admin",
  );

  // Qayta aktiv: unit returned_to_seller qoladi, lekin no_answer yopiladi →
  // ochiq no_answer yo‘q bo‘lsa order.status = delivered (Sotildi bilan bir xil yakun).
  const order = await Order.findOne({ id: doc.orderId });
  if (order && (await maybeSettleOrderDelivered(order))) {
    await order.save();
  }

  return { resolution: "reactivated", returned: publicRow };
}

/**
 * Mijozga topshirildi (sotildi).
 *
 * Faqat order/item tracking + sotuv yozuvi.
 * Kuryer assignmentga tegilmaydi: status returned qoladi, km to‘lovi saqlanadi.
 * (Mijoz o‘zi olgan / boshqa yo‘l — kuryer «Topshirdi» emas.)
 */
async function markDeliveredNoAnswerOrder(returnedOrderId, options = {}) {
  const doc = await loadUnresolvedNoAnswer(returnedOrderId, options.sellerId);
  const resolvedBy = options.resolvedBy || options.actor || "admin";
  const soldAt = new Date();

  // Crash retry: unit allaqachon delivered, resolvedAt yo‘q → heal + sales + OK
  const earlyHeal = await healNoAnswerResolvedIfUnitDelivered(doc, resolvedBy);
  if (earlyHeal.healed) {
    let assignment = doc.assignmentId
      ? await CourierOrderAssignment.findById(doc.assignmentId)
      : null;
    if (!assignment) {
      assignment = await CourierOrderAssignment.findOne(unitKeyFromReturned(doc));
    }
    if (assignment && earlyHeal.order) {
      await recordSalesOnDelivery(earlyHeal.order, soldAt, {
        assignmentId: String(assignment._id),
        allowNonDeliveredAssignment: true,
      });
    }
    return {
      resolution: "delivered",
      returned: toPublicReturnedOrder(earlyHeal.returnedDoc || doc),
      healed: true,
    };
  }

  const variant = await resolveVariantForStockRestore(doc);

  if (isStockReleased(doc)) {
    await reReserveForCourier(doc.productId, 1, variant);
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

  if (String(assignment.status) !== "returned") {
    throw new HttpError(
      409,
      "Mahsulot hali sotuvchiga qaytarilmagan",
      "ASSIGNMENT_NOT_RETURNED",
    );
  }

  const order = await Order.findOne({ id: doc.orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = Array.isArray(order.items) ? order.items[Number(doc.itemIndex)] : null;
  if (item) {
    // Dona tracking + item/order settle (kuryer Topshirdim bilan bir xil helper)
    await settleItemAndOrderAfterUnitDelivered(order, item, {
      orderId: doc.orderId,
      itemIndex: doc.itemIndex,
      unitIndex: Number(doc.unitIndex) || 0,
      at: soldAt,
    });

    order.markModified("items");
    await order.save();
  }

  // Sotuv yozuvi — assignment status «delivered» bo‘lmasa ham (kuryer returned qoladi)
  await recordSalesOnDelivery(order, soldAt, {
    assignmentId: String(assignment._id),
    allowNonDeliveredAssignment: true,
  });

  const publicRow = await markResolved(doc, "delivered", resolvedBy);
  return { resolution: "delivered", returned: publicRow };
}

module.exports = {
  reHandoffNoAnswerOrder,
  reactivateNoAnswerOrder,
  markDeliveredNoAnswerOrder,
};
