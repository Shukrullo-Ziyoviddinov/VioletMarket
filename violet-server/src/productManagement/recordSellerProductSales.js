const { SellerProductSale } = require("../models/sellerProductSale");
const { toNumber } = require("../services/adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");

const PAID_STATUSES = ["paid", "delivered"];

function aggregateSellerProductLines(items) {
  const linesByKey = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const sellerId = String(item?.sellerId ?? "").trim();
    const productId = Number(item?.productId);
    if (!sellerId || !Number.isFinite(productId)) continue;

    const key = `${sellerId}::${productId}`;
    const quantity = Math.max(0, toNumber(item?.quantity, 0));
    const amount = Math.max(0, toNumber(item?.lineTotal, 0));
    const price = Math.max(0, toNumber(item?.price, 0));
    const existing = linesByKey.get(key);

    if (existing) {
      existing.quantity += quantity;
      existing.amount += amount;
      continue;
    }

    linesByKey.set(key, {
      sellerId,
      productId,
      title: item?.title ?? "",
      image: String(item?.image || "/img/no-image.png"),
      price,
      quantity,
      amount,
    });
  }

  return linesByKey;
}

function aggregateOrderProductLines(items) {
  const linesByProductId = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const productId = Number(item?.productId);
    if (!Number.isFinite(productId)) continue;

    const quantity = Math.max(0, toNumber(item?.quantity, 0));
    const amount = Math.max(0, toNumber(item?.lineTotal, 0));
    const existing = linesByProductId.get(productId);

    if (existing) {
      existing.quantity += quantity;
      existing.amount += amount;
      continue;
    }

    linesByProductId.set(productId, {
      productId,
      quantity,
      amount,
    });
  }

  return linesByProductId;
}

async function recordSellerProductSalesFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const linesByKey = aggregateSellerProductLines(order.items);
  if (linesByKey.size === 0) return [];

  const docs = [];
  for (const line of linesByKey.values()) {
    const row = await SellerProductSale.findOneAndUpdate(
      {
        orderId: order.id,
        sellerId: line.sellerId,
        productId: line.productId,
      },
      {
        $set: {
          title: line.title,
          image: line.image,
          price: line.price,
          quantity: line.quantity,
          amount: line.amount,
          paidAt,
          dateKey: periodKeys.dateKey,
          weekKey: periodKeys.weekKey,
          monthKey: periodKeys.monthKey,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    docs.push(row);
  }

  return docs;
}

async function backfillSellerProductSalesFromOrders() {
  const { ensureSalesStatisticsSynced } = require("./salesOrderSyncService");
  return ensureSalesStatisticsSynced();
}

module.exports = {
  aggregateSellerProductLines,
  aggregateOrderProductLines,
  recordSellerProductSalesFromOrder,
  backfillSellerProductSalesFromOrders,
};
