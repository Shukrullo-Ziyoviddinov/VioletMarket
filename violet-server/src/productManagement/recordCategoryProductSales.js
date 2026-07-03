const { CategoryProductSale } = require("../models/categoryProductSale");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { toNumber } = require("../services/adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { aggregateSellerProductLines } = require("./recordSellerProductSales");

const PAID_STATUSES = ["paid", "delivered"];
const UNKNOWN_CATEGORY_LABEL = "Boshqa";

function normalizeCategoryLabel(value) {
  const label = String(value || "").trim();
  return label || UNKNOWN_CATEGORY_LABEL;
}

async function loadCategoryByProductId(productIds) {
  const ids = [...new Set(productIds.filter((id) => Number.isFinite(id)))];
  if (!ids.length) return new Map();

  const products = await Product.find({ id: { $in: ids } })
    .select("id category")
    .lean();

  return new Map(
    products.map((product) => [Number(product.id), normalizeCategoryLabel(product.category)]),
  );
}

async function recordCategoryProductSalesFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const linesByKey = aggregateSellerProductLines(order.items);
  if (linesByKey.size === 0) return [];

  const productIds = [...linesByKey.values()].map((line) => Number(line.productId));
  const categoryByProductId = await loadCategoryByProductId(productIds);

  const docs = [];
  for (const line of linesByKey.values()) {
    const productId = Number(line.productId);
    const category = categoryByProductId.get(productId) || UNKNOWN_CATEGORY_LABEL;

    const row = await CategoryProductSale.findOneAndUpdate(
      {
        orderId: order.id,
        productId,
      },
      {
        $set: {
          category,
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

async function backfillCategoryProductSalesFromOrders() {
  const existingCount = await CategoryProductSale.countDocuments();
  if (existingCount > 0) return existingCount;

  const orders = await Order.find({
    status: { $in: PAID_STATUSES },
    paidAt: { $ne: null },
  })
    .select("id items status paidAt createdAt")
    .lean();

  let created = 0;
  for (const order of orders) {
    const rows = await recordCategoryProductSalesFromOrder(order);
    created += rows.length;
  }

  return created;
}

module.exports = {
  recordCategoryProductSalesFromOrder,
  backfillCategoryProductSalesFromOrders,
};
