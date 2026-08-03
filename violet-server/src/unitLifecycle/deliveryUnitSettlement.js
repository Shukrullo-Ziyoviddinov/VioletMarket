/**
 * Deliver settle — ochiq no_answer donalarini DB dan o‘qish.
 * Sof mantiq: orderItemUnitTracking; bu fayl faqat CourierReturnedOrder bog‘lanishi.
 */

const { CourierReturnedOrder } = require("../models/courierReturnedOrder");
const {
  isItemSettledForOrderDelivery,
} = require("../productManagement/orderItemUnitTracking");

/**
 * reasonType=no_answer va hali resolvedAt yo‘q — qayta kuryer/aktiv/sotildi kutadi.
 * return / defective bu yerga tushmaydi → terminal returned_to_seller settle OK.
 */
async function loadUnresolvedNoAnswerUnitIndexes(orderId, itemIndex) {
  const rows = await CourierReturnedOrder.find({
    orderId: Number(orderId),
    itemIndex: Number(itemIndex),
    reasonType: "no_answer",
    resolvedAt: null,
  })
    .select({ unitIndex: 1 })
    .lean();

  return new Set(rows.map((row) => Number(row.unitIndex) || 0));
}

/** orderId bo‘yicha: itemIndex → ochiq no_answer unitIndex set */
async function loadUnresolvedNoAnswerUnitIndexesByItem(orderId) {
  const rows = await CourierReturnedOrder.find({
    orderId: Number(orderId),
    reasonType: "no_answer",
    resolvedAt: null,
  })
    .select({ itemIndex: 1, unitIndex: 1 })
    .lean();

  const byItem = new Map();
  for (const row of rows) {
    const itemIndex = Number(row.itemIndex) || 0;
    if (!byItem.has(itemIndex)) byItem.set(itemIndex, new Set());
    byItem.get(itemIndex).add(Number(row.unitIndex) || 0);
  }
  return byItem;
}

/**
 * Barcha order items settle bo‘lganmi (multi-item yakun).
 * Terminal returned_to_seller OK; ochiq no_answer item — yo‘q.
 */
async function areAllOrderItemsSettledForDelivery(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return false;

  const byItem = await loadUnresolvedNoAnswerUnitIndexesByItem(order.id);
  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const unresolvedNoAnswerUnitIndexes = byItem.get(itemIndex) || new Set();
    if (
      !isItemSettledForOrderDelivery(items[itemIndex], {
        unresolvedNoAnswerUnitIndexes,
      })
    ) {
      return false;
    }
  }
  return true;
}

module.exports = {
  loadUnresolvedNoAnswerUnitIndexes,
  loadUnresolvedNoAnswerUnitIndexesByItem,
  areAllOrderItemsSettledForDelivery,
};
