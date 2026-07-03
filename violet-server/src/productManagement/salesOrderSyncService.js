const { Order } = require("../models/order");
const { SellerSale } = require("../models/sellerSale");
const { SellerProductSale } = require("../models/sellerProductSale");
const { CategoryProductSale } = require("../models/categoryProductSale");
const { CountryCategoryProductSale } = require("../models/countryCategoryProductSale");
const { BrandCategoryProductSale } = require("../models/brandCategoryProductSale");
const { Product } = require("../models/product");
const { PAID_STATUSES } = require("../services/adminSales/salesStatisticsHelpers");
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");
const { recordCategoryProductSalesFromOrder } = require("./recordCategoryProductSales");
const { recordCountryCategoryProductSalesFromOrder } = require("./recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./recordBrandCategoryProductSales");

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

async function recordAllSalesFromOrder(order) {
  const enrichedOrder = await enrichOrderItemsWithProductData(order);
  await recordSellerSalesFromOrder(enrichedOrder);
  await recordSellerProductSalesFromOrder(enrichedOrder);
  await recordCategoryProductSalesFromOrder(enrichedOrder);
  await recordCountryCategoryProductSalesFromOrder(enrichedOrder);
  await recordBrandCategoryProductSalesFromOrder(enrichedOrder);
}

async function findOrderIdsNeedingSync() {
  const [
    paidOrderIds,
    sellerSaleOrderIds,
    sellerProductSaleOrderIds,
    categorySaleOrderIds,
    countrySaleOrderIds,
    brandSaleOrderIds,
  ] = await Promise.all([
    Order.distinct("id", {
      status: { $in: PAID_STATUSES },
      paidAt: { $ne: null },
    }),
    SellerSale.distinct("orderId"),
    SellerProductSale.distinct("orderId"),
    CategoryProductSale.distinct("orderId"),
    CountryCategoryProductSale.distinct("orderId"),
    BrandCategoryProductSale.distinct("orderId"),
  ]);

  const syncedSets = [
    sellerSaleOrderIds,
    sellerProductSaleOrderIds,
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
    status: { $in: PAID_STATUSES },
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
  recordAllSalesFromOrder,
  ensureSalesStatisticsSynced,
};
