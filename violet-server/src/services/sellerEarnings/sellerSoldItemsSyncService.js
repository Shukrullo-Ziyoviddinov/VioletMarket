const { Order } = require("../../models/order");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { PAID_STATUSES } = require("../adminSales/salesStatisticsHelpers");
const { recordSellerSoldItemsFromOrder } = require("../../productManagement/recordSellerSoldItems");
const { enrichOrderItemsWithProductData } = require("../../productManagement/salesOrderSyncService");

let syncInFlight = null;

async function findOrderIdsNeedingSoldItemsSync() {
  const [paidOrderIds, syncedOrderIds] = await Promise.all([
    Order.distinct("id", {
      status: { $in: PAID_STATUSES },
      paidAt: { $ne: null },
    }),
    SellerSoldItem.distinct("orderId"),
  ]);

  const syncedSet = new Set(syncedOrderIds.map((id) => Number(id)));
  return paidOrderIds.filter((orderId) => !syncedSet.has(Number(orderId)));
}

async function runSellerSoldItemsSync() {
  const orderIds = await findOrderIdsNeedingSoldItemsSync();
  if (!orderIds.length) return 0;

  const orders = await Order.find({
    id: { $in: orderIds },
    status: { $in: PAID_STATUSES },
    paidAt: { $ne: null },
  })
    .select("id items status paidAt createdAt")
    .lean();

  for (const order of orders) {
    const enrichedOrder = await enrichOrderItemsWithProductData(order);
    await recordSellerSoldItemsFromOrder(enrichedOrder);
  }

  return orders.length;
}

async function ensureSellerSoldItemsSynced() {
  if (!syncInFlight) {
    syncInFlight = runSellerSoldItemsSync().finally(() => {
      syncInFlight = null;
    });
  }

  return syncInFlight;
}

module.exports = {
  ensureSellerSoldItemsSynced,
  recordSellerSoldItemsFromOrder,
};
