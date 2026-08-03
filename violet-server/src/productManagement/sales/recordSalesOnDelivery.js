const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { toNumber } = require("../../services/adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");
const { upsertSellerSoldItemUnit } = require("./recordSellerSoldItems");
const { recordCategoryProductSalesFromOrder } = require("./recordCategoryProductSales");
const { recordCountryCategoryProductSalesFromOrder } = require("./recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./recordBrandCategoryProductSales");
const { enrichOrderItemsWithProductData } = require("./salesOrderSyncService");
const {
  recordProductSoldDisplayMetrics,
} = require("./recordProductSoldDisplayMetrics");
const {
  ensurePendingReviewForDeliveredProduct,
} = require("../../services/pendingReview/pendingReviewService");

/**
 * LIVE sotuv yozuvi — yagona asosiy yo‘l (Topshirdim / no_answer Sotildi).
 * Backfill: salesOrderSyncService / recordSellerSoldItemsFromOrder (heal only).
 *
 * options.assignmentId — display/izoh faqat shu dona (ikkilanish yo‘q).
 * options.allowNonDeliveredAssignment — no_answer: kuryer returned qoladi,
 *   lekin shu assignmentId ham sotuvga qo‘shiladi.
 */
async function loadAssignmentsForLiveSales(orderId, options = {}) {
  const focusId = String(options.assignmentId || "").trim();
  const allowNonDelivered = Boolean(options.allowNonDeliveredAssignment);
  const oid = Number(orderId);

  const byId = new Map();

  const delivered = await CourierOrderAssignment.find({
    orderId: oid,
    status: "delivered",
  }).lean();
  for (const row of delivered) {
    byId.set(String(row._id), row);
  }

  // Oldingi no_answer «Sotildi» — assignment status returned qoladi
  const soldNoAnswer = await CourierReturnedOrder.find({
    orderId: oid,
    reasonType: "no_answer",
    resolutionType: "delivered",
    resolvedAt: { $ne: null },
  })
    .select("assignmentId")
    .lean();

  for (const row of soldNoAnswer) {
    const id = String(row.assignmentId || "").trim();
    if (!id || byId.has(id)) continue;
    const assignment = await CourierOrderAssignment.findById(id).lean();
    if (assignment) byId.set(id, assignment);
  }

  // Joriy no_answer Sotildi: resolvedAt hali yo‘q — focus ni qo‘shamiz
  if (allowNonDelivered && focusId && !byId.has(focusId)) {
    const focus = await CourierOrderAssignment.findOne({
      orderId: oid,
      _id: focusId,
    }).lean();
    if (focus) byId.set(focusId, focus);
  }

  return {
    assignments: Array.from(byId.values()),
    focusId,
  };
}

async function recordSalesOnDelivery(orderDoc, soldAt = new Date(), options = {}) {
  if (!orderDoc?.id) return null;

  const order = await enrichOrderItemsWithProductData(
    orderDoc.toObject ? orderDoc.toObject() : orderDoc,
  );

  const { assignments, focusId } = await loadAssignmentsForLiveSales(
    order.id,
    options,
  );

  if (!assignments.length) return null;

  const when = soldAt instanceof Date ? soldAt : new Date(soldAt);
  const periodKeys = getPeriodKeysFromPaidAt(when);
  const items = Array.isArray(order.items) ? order.items : [];

  for (const assignment of assignments) {
    const itemIndex = Number(assignment.itemIndex);
    const unitIndex = Math.max(0, Number(assignment.unitIndex) || 0);
    const item = items[itemIndex];
    if (!item) continue;

    const sellerId = String(item.sellerId || assignment.sellerId || "").trim();
    const productId = Number(item.productId || assignment.productId);
    if (!sellerId || !Number.isFinite(productId)) continue;

    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
    const lineTotal = Math.max(0, toNumber(item.lineTotal, 0));
    const unitPrice = Math.max(0, toNumber(item.price, 0));
    const unitAmount =
      quantity > 0
        ? Math.max(0, Math.round(lineTotal / quantity) || unitPrice)
        : unitPrice;

    await upsertSellerSoldItemUnit(
      {
        orderId: Number(order.id),
        sellerId,
        productId,
        unitIndex,
      },
      {
        price: unitAmount,
        amount: unitAmount,
        soldAt: when,
        dateKey: periodKeys.dateKey,
        weekKey: periodKeys.weekKey,
        monthKey: periodKeys.monthKey,
      },
    );
  }

  // Display metrics: faqat shu eventdagi dona(lar) — backfill hech qachon chaqirmasin
  const focusAssignments = focusId
    ? assignments.filter((row) => String(row._id) === focusId)
    : assignments;

  const soldQtyByProduct = new Map();
  for (const assignment of focusAssignments) {
    const item = items[Number(assignment.itemIndex)];
    const productId = Number(item?.productId || assignment.productId);
    if (!Number.isFinite(productId) || productId <= 0) continue;
    soldQtyByProduct.set(productId, (soldQtyByProduct.get(productId) || 0) + 1);
  }

  if (soldQtyByProduct.size) {
    await recordProductSoldDisplayMetrics(soldQtyByProduct);
  }

  if (order.userId) {
    for (const productId of soldQtyByProduct.keys()) {
      try {
        await ensurePendingReviewForDeliveredProduct(order.userId, productId, when);
      } catch (err) {
        console.error("Pending review yaratilmadi:", err?.message || err);
      }
    }
  }

  // Aggregate upsert: barcha sotilgan donalar (partial overwrite xavfisiz)
  const grouped = new Map();
  for (const assignment of assignments) {
    const itemIndex = Number(assignment.itemIndex);
    const item = items[itemIndex];
    if (!item) continue;

    const key = String(itemIndex);
    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
    const lineTotal = Math.max(0, toNumber(item.lineTotal, 0));
    const unitPrice = Math.max(0, toNumber(item.price, 0));
    const unitAmount =
      quantity > 0
        ? Math.max(0, Math.round(lineTotal / quantity) || unitPrice)
        : unitPrice;

    const prev = grouped.get(key);
    if (prev) {
      prev.quantity += 1;
      prev.lineTotal += unitAmount;
      continue;
    }

    grouped.set(key, {
      productId: Number(item.productId) || 0,
      sellerId: String(item.sellerId || "").trim(),
      title: item.title ?? "",
      price: unitPrice,
      originalPrice: Math.max(0, toNumber(item.originalPrice, 0)),
      quantity: 1,
      lineTotal: unitAmount,
      color: String(item.color || ""),
      size: String(item.size || ""),
      storage: String(item.storage || ""),
      model: String(item.model || ""),
      image: String(item.image || "/img/no-image.png"),
    });
  }

  const syntheticOrder = {
    id: order.id,
    status: "delivered",
    paidAt: when,
    createdAt: order.createdAt || when,
    items: Array.from(grouped.values()),
  };

  await recordSellerSalesFromOrder(syntheticOrder);
  await recordSellerProductSalesFromOrder(syntheticOrder);
  await recordCategoryProductSalesFromOrder(syntheticOrder);
  await recordCountryCategoryProductSalesFromOrder(syntheticOrder);
  await recordBrandCategoryProductSalesFromOrder(syntheticOrder);

  return syntheticOrder;
}

module.exports = {
  recordSalesOnDelivery,
};
