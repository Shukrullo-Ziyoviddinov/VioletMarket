const { SellerSoldItem } = require("../models/sellerSoldItem");
const { nextSequence } = require("../models/autoIncrement");
const { toNumber } = require("../services/adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const {
  isUnitExcludedFromSoldSync,
} = require("./orderItemUnitTracking");

const PAID_STATUSES = ["delivered"];

async function upsertSellerSoldItemUnit(filter, fields) {
  const existing = await SellerSoldItem.findOne(filter).select({ id: 1 }).lean();

  if (existing) {
    return SellerSoldItem.findOneAndUpdate(
      filter,
      { $set: fields },
      { returnDocument: "after" },
    );
  }

  const id = await nextSequence("seller_sold_item_id");
  return SellerSoldItem.findOneAndUpdate(
    filter,
    {
      $set: fields,
      $setOnInsert: {
        id,
        status: "available",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

/**
 * Order delivered bo‘lganda SellerSoldItem sync.
 * unavailable / cancelled / returned_to_seller donalar yozilmaydi.
 * Haqiqiy topshirish: recordSalesOnDelivery (assignment bo‘yicha) — o‘zgarmagan.
 */
async function recordSellerSoldItemsFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const docs = [];

  for (const item of Array.isArray(order.items) ? order.items : []) {
    const sellerId = String(item?.sellerId ?? "").trim();
    const productId = Number(item?.productId);
    if (!sellerId || !Number.isFinite(productId)) continue;

    const quantity = Math.max(0, Math.floor(toNumber(item?.quantity, 0)));
    if (quantity === 0) continue;

    const lineTotal = Math.max(0, toNumber(item?.lineTotal, 0));
    const unitPrice = Math.max(0, toNumber(item?.price, 0));
    const unitAmount = quantity > 0
      ? Math.max(0, Math.round(lineTotal / quantity) || unitPrice)
      : unitPrice;

    for (let unitIndex = 0; unitIndex < quantity; unitIndex += 1) {
      if (isUnitExcludedFromSoldSync(item, unitIndex)) {
        continue;
      }

      const row = await upsertSellerSoldItemUnit(
        {
          orderId: Number(order.id),
          sellerId,
          productId,
          unitIndex,
        },
        {
          price: unitAmount,
          amount: unitAmount,
          soldAt: paidAt,
          dateKey: periodKeys.dateKey,
          weekKey: periodKeys.weekKey,
          monthKey: periodKeys.monthKey,
        },
      );
      docs.push(row);
    }
  }

  return docs;
}

module.exports = {
  recordSellerSoldItemsFromOrder,
  upsertSellerSoldItemUnit,
};
