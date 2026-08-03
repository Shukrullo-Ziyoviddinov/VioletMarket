/**
 * Deliver settle — ochiq no_answer donalarini DB dan o‘qish + order yakuni.
 * Sof mantiq: orderItemUnitTracking; bu fayl CourierReturnedOrder / Order bog‘lanishi.
 *
 * Topshirdim (kuryer) va no_answer «Sotildi» — bir xil item/order settle:
 * settleItemAndOrderAfterUnitDelivered. Ajdaniya/return complete BU YERGA KIRMAYDI.
 */

const { Order } = require("../models/order");
const { CourierReturnedOrder } = require("../models/courierReturnedOrder");
const { CourierOrderAssignment } = require("../models/courierOrderAssignment");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");
const {
  areAllItemUnitsSettledForDelivery,
  isItemSettledForOrderDelivery,
  markItemUnitDelivered,
  resolveUnitTrackingStatus,
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

/**
 * Order.status = delivered (saqlamaydi — caller save qiladi).
 * @returns {boolean} status o‘zgarganmi
 */
async function maybeSettleOrderDelivered(order) {
  if (!order || String(order.status) === "delivered") return false;
  if (!(await areAllOrderItemsSettledForDelivery(order))) return false;
  order.status = "delivered";
  return true;
}

/**
 * Bitta dona delivered bo‘lgandan keyin item + order settle.
 * Kuryer Topshirdim va no_answer Sotildi — bir xil yo‘l.
 *
 * deliveredUnits = assignment.status=delivered
 *   + no_answer resolutionType=delivered (assignment returned qolishi mumkin)
 *   + joriy unitIndex
 *
 * Save / recordSalesOnDelivery qilmaydi — caller.
 *
 * @returns {{ itemSettled: boolean, orderSettled: boolean, allUnitsDelivered: boolean }}
 */
async function settleItemAndOrderAfterUnitDelivered(order, item, options = {}) {
  if (!order || !item) {
    return { itemSettled: false, orderSettled: false, allUnitsDelivered: false };
  }

  const orderId = Number(options.orderId ?? order.id);
  const itemIndex = Number(options.itemIndex);
  const unitIndex = Math.max(0, Math.floor(Number(options.unitIndex) || 0));
  const at = options.at instanceof Date ? options.at : new Date();

  markItemUnitDelivered(item, unitIndex, at);

  const unitRows = await CourierOrderAssignment.find({
    orderId,
    itemIndex,
  })
    .select("unitIndex status")
    .lean();

  // no_answer «Sotildi»: assignment status returned qoladi — siblinglarni shu yerdan olamiz
  const soldViaNoAnswer = await CourierReturnedOrder.find({
    orderId,
    itemIndex,
    reasonType: "no_answer",
    resolutionType: "delivered",
    resolvedAt: { $ne: null },
  })
    .select("unitIndex")
    .lean();

  const deliveredUnits = new Set([
    ...unitRows
      .filter((row) => String(row.status) === "delivered")
      .map((row) => Number(row.unitIndex) || 0),
    ...soldViaNoAnswer.map((row) => Number(row.unitIndex) || 0),
    unitIndex,
  ]);

  // Ochiq no_answer sibling → settle blok; return/defective sibling → OK
  // Joriy dona deliveredUnits da — o‘zi settle (resolvedAt hali null bo‘lsa ham)
  const unresolvedNoAnswerUnitIndexes =
    await loadUnresolvedNoAnswerUnitIndexes(orderId, itemIndex);
  const allUnitsDelivered = areAllItemUnitsSettledForDelivery(
    item,
    deliveredUnits,
    { unresolvedNoAnswerUnitIndexes },
  );

  let itemSettled = false;
  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (allUnitsDelivered && currentStatus !== "delivered") {
    item.trackingStatus = "delivered";
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    item.trackingHistory.push({ status: "delivered", at });
    itemSettled = true;
  }

  const orderSettled = await maybeSettleOrderDelivered(order);

  return { itemSettled, orderSettled, allUnitsDelivered };
}

/**
 * Crash edge: no_answer «Sotildi» unitni delivered qilgan, resolvedAt yo‘q.
 * Resolution ni delivered qilib yopadi + order settle (save qiladi).
 *
 * Qayta aktiv / qayta kuryerga BUNDAN KEYIN ombor ochmasin / unit ochmasin.
 */
async function healNoAnswerResolvedIfUnitDelivered(
  returnedDoc,
  resolvedBy = "system_heal",
) {
  if (!returnedDoc) {
    return { healed: false, alreadyResolved: false };
  }
  if (returnedDoc.resolvedAt) {
    return { healed: false, alreadyResolved: true };
  }
  if (String(returnedDoc.reasonType || "") !== "no_answer") {
    return { healed: false, alreadyResolved: false };
  }

  const order = await Order.findOne({ id: Number(returnedDoc.orderId) });
  if (!order) {
    return { healed: false, alreadyResolved: false };
  }

  const item = Array.isArray(order.items)
    ? order.items[Number(returnedDoc.itemIndex)]
    : null;
  if (!item) {
    return { healed: false, alreadyResolved: false };
  }

  const unitIndex = Number(returnedDoc.unitIndex) || 0;
  if (resolveUnitTrackingStatus(item, unitIndex) !== "delivered") {
    return { healed: false, alreadyResolved: false };
  }

  returnedDoc.resolutionType = "delivered";
  returnedDoc.resolvedAt = new Date();
  returnedDoc.resolvedBy = String(resolvedBy || "system_heal").trim();
  await returnedDoc.save();

  if (await maybeSettleOrderDelivered(order)) {
    await order.save();
  }

  return { healed: true, alreadyResolved: false, order, returnedDoc };
}

module.exports = {
  loadUnresolvedNoAnswerUnitIndexes,
  loadUnresolvedNoAnswerUnitIndexesByItem,
  areAllOrderItemsSettledForDelivery,
  maybeSettleOrderDelivered,
  settleItemAndOrderAfterUnitDelivered,
  healNoAnswerResolvedIfUnitDelivered,
};
