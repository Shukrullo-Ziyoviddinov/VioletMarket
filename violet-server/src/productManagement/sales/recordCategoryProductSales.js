const { CategoryProductSale } = require("../../models/categoryProductSale");
const { Product } = require("../../models/product");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { aggregateOrderProductLines } = require("./recordSellerProductSales");

const PAID_STATUSES = ["delivered"];
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
  const linesByProductId = aggregateOrderProductLines(order.items);
  if (linesByProductId.size === 0) return [];

  const productIds = [...linesByProductId.values()].map((line) => Number(line.productId));
  const categoryByProductId = await loadCategoryByProductId(productIds);

  const docs = [];
  for (const line of linesByProductId.values()) {
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
  const { ensureSalesStatisticsSynced } = require("./salesOrderSyncService");
  return ensureSalesStatisticsSynced();
}

module.exports = {
  recordCategoryProductSalesFromOrder,
  backfillCategoryProductSalesFromOrders,
};
