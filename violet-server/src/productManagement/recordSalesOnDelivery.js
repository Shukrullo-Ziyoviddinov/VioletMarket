const { CourierOrderAssignment } = require("../models/courierOrderAssignment");
const { toNumber } = require("../services/adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");
const { upsertSellerSoldItemUnit } = require("./recordSellerSoldItems");
const { recordCategoryProductSalesFromOrder } = require("./recordCategoryProductSales");
const { recordCountryCategoryProductSalesFromOrder } = require("./recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./recordBrandCategoryProductSales");
const { enrichOrderItemsWithProductData } = require("./salesOrderSyncService");
const { recordProductSoldDisplayMetrics } = require("./markProductsAsSold");
const {
  ensurePendingReviewForDeliveredProduct,
} = require("../services/pendingReview/pendingReviewService");

/**
 * Kuryer "Topshirdim" — sotuv/daromad + «sotildi» foizi + mijoz pending izoh.
 * options.assignmentId — faqat shu yangi topshirilgan dona uchun display/izoh (qayta hisoblanmasin).
 */
async function recordSalesOnDelivery(orderDoc, soldAt = new Date(), options = {}) {
  if (!orderDoc?.id) return null;

  const order = await enrichOrderItemsWithProductData(
    orderDoc.toObject ? orderDoc.toObject() : orderDoc,
  );

  const assignments = await CourierOrderAssignment.find({
    orderId: Number(order.id),
    status: "delivered",
  }).lean();

  if (!assignments.length) return null;

  const when = soldAt instanceof Date ? soldAt : new Date(soldAt);
  const periodKeys = getPeriodKeysFromPaidAt(when);
  const items = Array.isArray(order.items) ? order.items : [];
  const focusId = String(options.assignmentId || "").trim();

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
