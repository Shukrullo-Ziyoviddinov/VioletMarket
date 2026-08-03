const { SellerSale } = require("../../models/sellerSale");
const { toNumber } = require("../../services/adminSales/salesStatisticsHelpers");
const { formatWeekKey } = require("../../services/adminSales/salesStatisticsHelpers");
const {
  getStatisticsDateKey,
  getIsoWeekFromYmd,
} = require("../../utils/customerStatisticsDate");

const PAID_STATUSES = ["delivered"];

function getPeriodKeysFromPaidAt(paidAt) {
  const date = paidAt instanceof Date ? paidAt : new Date(paidAt);
  const dateKey = getStatisticsDateKey(date);
  const [year, month, day] = dateKey.split("-").map(Number);
  const { isoYear, week } = getIsoWeekFromYmd(year, month, day);
  return {
    dateKey,
    weekKey: formatWeekKey(isoYear, week),
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function aggregateSellerTotalsFromOrderItems(items) {
  const totalsBySeller = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const sellerId = String(item?.sellerId ?? "").trim();
    if (!sellerId) continue;

    const quantity = Math.max(0, toNumber(item?.quantity, 0));
    const amount = Math.max(0, toNumber(item?.lineTotal, 0));
    const prev = totalsBySeller.get(sellerId) || { amount: 0, quantity: 0 };
    totalsBySeller.set(sellerId, {
      amount: prev.amount + amount,
      quantity: prev.quantity + quantity,
    });
  }

  return totalsBySeller;
}

async function recordSellerSalesFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const totalsBySeller = aggregateSellerTotalsFromOrderItems(order.items);
  if (totalsBySeller.size === 0) return [];

  const docs = [];
  for (const [sellerId, totals] of totalsBySeller.entries()) {
    const row = await SellerSale.findOneAndUpdate(
      { orderId: order.id, sellerId },
      {
        $set: {
          amount: totals.amount,
          quantity: totals.quantity,
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

async function backfillSellerSalesFromOrders() {
  const { ensureSalesStatisticsSynced } = require("./salesOrderSyncService");
  return ensureSalesStatisticsSynced();
}

module.exports = {
  getPeriodKeysFromPaidAt,
  recordSellerSalesFromOrder,
  backfillSellerSalesFromOrders,
};
