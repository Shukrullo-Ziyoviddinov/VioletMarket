const { Order } = require("../../models/order");
const { SellerSale } = require("../../models/sellerSale");
const { SellerProductSale } = require("../../models/sellerProductSale");
const { CategoryProductSale } = require("../../models/categoryProductSale");
const { CountryCategoryProductSale } = require("../../models/countryCategoryProductSale");
const { BrandCategoryProductSale } = require("../../models/brandCategoryProductSale");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { Product } = require("../../models/product");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { toNumber } = require("../../services/adminSales/salesStatisticsHelpers");
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");
const { recordSellerSoldItemsFromOrder } = require("./recordSellerSoldItems");
const { recordCategoryProductSalesFromOrder } = require("./recordCategoryProductSales");
const { recordCountryCategoryProductSalesFromOrder } = require("./recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./recordBrandCategoryProductSales");
const {
  resolveItemQuantity,
  isUnitEligibleForSoldSync,
} = require("../unitTracking/orderItemUnitTracking");

/**
 * BACKFILL / HEAL only.
 * Live sotuv: recordSalesOnDelivery.
 * Display metrics (flash/ranking) BU YERDA HECH QACHON chaqirilmasin.
 */

let syncInFlight = null;

async function enrichOrderItemsWithProductData(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return order;

  const productIds = [
    ...new Set(items.map((item) => Number(item?.productId)).filter(Number.isFinite)),
  ];
  if (!productIds.length) return order;

  const products = await Product.find({ id: { $in: productIds } })
    .select("id sellerId")
    .lean();

  const sellerByProductId = new Map(
    products.map((product) => [Number(product.id), String(product.sellerId || "").trim()]),
  );

  const enrichedItems = items.map((item) => {
    const productId = Number(item?.productId);
    const sellerId = String(item?.sellerId ?? "").trim()
      || sellerByProductId.get(productId)
      || "";

    return {
      ...item,
      sellerId,
    };
  });

  return {
    ...order,
    items: enrichedItems,
  };
}

async function resolveSoldAtForOrder(order) {
  const orderId = Number(order?.id);
  if (Number.isFinite(orderId) && orderId > 0) {
    const latestDelivered = await CourierOrderAssignment.findOne({
      orderId,
      status: "delivered",
      deliveredAt: { $ne: null },
    })
      .sort({ deliveredAt: -1 })
      .select("deliveredAt")
      .lean();

    if (latestDelivered?.deliveredAt) {
      return latestDelivered.deliveredAt;
    }
  }

  return order?.paidAt || order?.createdAt || new Date();
}

/**
 * Aggregate upsert uchun: faqat delivered donalar (to‘liq lineTotal bilan raqobat qilmasin).
 * SellerSoldItem sync alohida — original unitIndex saqlanadi.
 */
function buildAggregateOrderFromDeliveredUnits(order, soldAt) {
  const aggregateItems = [];

  for (const item of Array.isArray(order?.items) ? order.items : []) {
    const quantity = resolveItemQuantity(item);
    const lineTotal = Math.max(0, toNumber(item?.lineTotal, 0));
    const unitPrice = Math.max(0, toNumber(item?.price, 0));
    const unitAmount =
      quantity > 0
        ? Math.max(0, Math.round(lineTotal / quantity) || unitPrice)
        : unitPrice;

    let deliveredCount = 0;
    for (let unitIndex = 0; unitIndex < quantity; unitIndex += 1) {
      if (isUnitEligibleForSoldSync(item, unitIndex)) {
        deliveredCount += 1;
      }
    }
    if (deliveredCount <= 0) continue;

    aggregateItems.push({
      productId: Number(item.productId) || 0,
      sellerId: String(item.sellerId || "").trim(),
      title: item.title ?? "",
      price: unitPrice,
      originalPrice: Math.max(0, toNumber(item.originalPrice, 0)),
      quantity: deliveredCount,
      lineTotal: unitAmount * deliveredCount,
      color: String(item.color || ""),
      size: String(item.size || ""),
      storage: String(item.storage || ""),
      model: String(item.model || ""),
      image: String(item.image || "/img/no-image.png"),
    });
  }

  return {
    id: order.id,
    status: "delivered",
    paidAt: soldAt,
    createdAt: order.createdAt || soldAt,
    items: aggregateItems,
  };
}

async function recordAllSalesFromOrder(order) {
  const enrichedOrder = await enrichOrderItemsWithProductData(order);
  const soldAt = await resolveSoldAtForOrder(enrichedOrder);
  const orderForUnitSync = {
    ...enrichedOrder,
    status: "delivered",
    paidAt: soldAt,
  };

  const aggregateOrder = buildAggregateOrderFromDeliveredUnits(
    orderForUnitSync,
    soldAt,
  );

  if (aggregateOrder.items.length) {
    await recordSellerSalesFromOrder(aggregateOrder);
    await recordSellerProductSalesFromOrder(aggregateOrder);
    await recordCategoryProductSalesFromOrder(aggregateOrder);
    await recordCountryCategoryProductSalesFromOrder(aggregateOrder);
    await recordBrandCategoryProductSalesFromOrder(aggregateOrder);
  }

  // Original unitIndex bo‘yicha; faqat delivered
  await recordSellerSoldItemsFromOrder(orderForUnitSync);
}

async function findOrderIdsNeedingSync() {
  const [
    paidOrderIds,
    sellerSaleOrderIds,
    sellerProductSaleOrderIds,
    sellerSoldItemOrderIds,
    categorySaleOrderIds,
    countrySaleOrderIds,
    brandSaleOrderIds,
  ] = await Promise.all([
    Order.distinct("id", {
      status: "delivered",
      paidAt: { $ne: null },
    }),
    SellerSale.distinct("orderId"),
    SellerProductSale.distinct("orderId"),
    SellerSoldItem.distinct("orderId"),
    CategoryProductSale.distinct("orderId"),
    CountryCategoryProductSale.distinct("orderId"),
    BrandCategoryProductSale.distinct("orderId"),
  ]);

  const syncedSets = [
    sellerSaleOrderIds,
    sellerProductSaleOrderIds,
    sellerSoldItemOrderIds,
    categorySaleOrderIds,
    countrySaleOrderIds,
    brandSaleOrderIds,
  ].map((ids) => new Set(ids.map((id) => Number(id))));

  return paidOrderIds.filter((orderId) => {
    const numericId = Number(orderId);
    return syncedSets.some((set) => !set.has(numericId));
  });
}

async function runSalesStatisticsSync() {
  const orderIds = await findOrderIdsNeedingSync();
  if (!orderIds.length) return 0;

  const orders = await Order.find({
    id: { $in: orderIds },
    status: "delivered",
    paidAt: { $ne: null },
  })
    .select("id items status paidAt createdAt")
    .lean();

  for (const order of orders) {
    await recordAllSalesFromOrder(order);
  }

  return orders.length;
}

async function ensureSalesStatisticsSynced() {
  if (!syncInFlight) {
    syncInFlight = runSalesStatisticsSync().finally(() => {
      syncInFlight = null;
    });
  }

  return syncInFlight;
}

module.exports = {
  enrichOrderItemsWithProductData,
  buildAggregateOrderFromDeliveredUnits,
  recordAllSalesFromOrder,
  ensureSalesStatisticsSynced,
};
